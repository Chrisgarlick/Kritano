# Subscription & Tier System — Deep Dive

## Current Architecture

The system has evolved through 3 migrations, resulting in a **hybrid model** that has some confusion:

### Where Tier Data Lives

```
subscriptions table
├── user_id    → User-level subscription (primary, added in migration 025)
├── organization_id → Org-level subscription (legacy, from migration 016)
├── tier       → free | starter | pro | agency | enterprise
├── status     → active | trialing | past_due | canceled | paused
└── stripe_*   → Billing fields
```

### How Tier Is Currently Resolved

`getUserTierLimits(userId)` in `site.service.ts` uses this priority:

1. **User's own subscription** (`subscriptions.user_id = userId`)
2. **Org owner fallback** (user owns an org that has a subscription)
3. **Org member fallback** (user is member of org that has a subscription)
4. **Default**: `free`

This creates ambiguity — a user could match multiple tiers through different paths.

### How Site Features Are Gated

```
POST /api/audits  →  find site  →  get site.owner_id
                                       │
                     ┌─────────────────┘
                     ▼
           getUserTierLimits(ownerId)
                     │
                     ▼
           Site owner's tier determines:
           - max_pages_per_audit
           - max_audit_depth
           - available_checks
           - export options
           - scheduled audits

           Requesting user's tier determines:
           - concurrent_audits (prevents one shared user hogging all slots)
```

**Key rule**: Site owner's tier = feature ceiling for all members on that site.

### How Sharing Works

When an Agency user creates a site and invites members:

```
Agency User (tier: agency)
  └── Site: example.com (owner: Agency User)
        ├── Shared User A (tier: free)  → gets Agency features on this site
        ├── Shared User B (tier: free)  → gets Agency features on this site
        └── All limited by Agency owner's tier limits
```

Members inherit the **site owner's** tier for features, but their own tier for concurrency.

---

## Problems with Current System

### 1. Triple Fallback Creates Confusion

`getUserTierLimits()` checks user → org owner → org member. This means:
- A free user who joins a Pro org gets Pro features everywhere, not just on that org's sites
- There's no way to know *which* subscription gave someone their tier
- Admin can't easily see or control this

### 2. Org Subscriptions vs User Subscriptions Are Redundant

Both `user_id` and `organization_id` exist on the subscriptions table. In practice:
- Stripe checkout creates **user-level** subscriptions
- Legacy org code still creates **org-level** subscriptions
- The fallback chain means both can apply, sometimes conflicting

### 3. No Per-Site Tier Override

If a Pro user owns 10 sites, all 10 are Pro. There's no way to:
- Give one site Agency features (e.g. a client upgraded)
- Downgrade one site independently

### 4. Shared Users Get Owner's Tier Globally Through Org Fallback

Because `getUserTierLimits()` falls back to org membership, a shared user inherits the org's tier for *all* their activity — not just on the shared site.

---

## Recommended Streamlined Model

### Option A: Pure User-Centric (Simplest)

```
subscriptions
├── user_id (required, no more organization_id)
├── tier
├── status
└── stripe_*

Feature resolution:
  For any site → site.owner_id → subscriptions WHERE user_id = owner_id
  For user limits (concurrency, monthly audits) → subscriptions WHERE user_id = current_user
```

**Pros**: Simple, one subscription per user, no ambiguity
**Cons**: No way for an org to centrally manage billing for all members

### Option B: User-Centric + Org Billing (Best of Both)

```
subscriptions
├── user_id (required — every user has one subscription row)
├── managed_by_org_id (nullable — if org is paying for this user)
├── tier
├── status
└── stripe_*

Feature resolution:
  Same as Option A — always check user's own subscription row
  Org billing just controls WHO PAYS, not feature resolution

When org admin adds a member:
  → Create/upgrade that user's subscription to org's tier
  → Set managed_by_org_id = org.id

When org admin removes a member:
  → Downgrade user's subscription back to free
  → Clear managed_by_org_id
```

**Pros**: Clean resolution (always user-level), but orgs can still manage billing centrally
**Cons**: More logic when adding/removing org members

### Option C: Keep Current (With Cleanup)

Remove the triple fallback. Make it:
1. User's own subscription (required)
2. That's it

If a user joins an org, the org admin explicitly upgrades their subscription.

---

## What to Fix Now (Minimal Changes)

1. **Remove org fallback from `getUserTierLimits()`** — only check `subscriptions.user_id`
2. **Ensure every user has a subscription row** — create `free` subscription on signup
3. **Admin tier editor** — already added, edits user-level subscription directly
4. **Org tier management** — when org admin invites a member, optionally upgrade their user subscription

This keeps the current schema but eliminates the confusing fallback chain.

---

## Key Files

| File | Purpose |
|------|---------|
| `server/src/services/site.service.ts:336-378` | `getUserTierLimits()` and `getSiteOwnerTierLimits()` |
| `server/src/services/organization.service.ts` | Org-level subscription queries |
| `server/src/services/stripe.service.ts` | Stripe checkout/webhook |
| `server/src/services/trial.service.ts` | Trial lifecycle |
| `server/src/routes/index.ts:315-494` | `GET /api/subscription` endpoint |
| `server/src/middleware/organization.middleware.ts` | `requireTier()`, `requireFeature()` |
| `server/src/db/migrations/016_create_organizations.sql` | Original org/subscription schema |
| `server/src/db/migrations/025_user_centric_restructure.sql` | User-centric migration |
| `client/src/contexts/AuthContext.tsx` | Frontend subscription state |
| `docs/TIERS.md` | Feature matrix |
