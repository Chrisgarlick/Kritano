# Site-Owner Tier Model — Implementation

## Overview

Audit capabilities (max pages, depth, available checks like E-E-A-T/AEO) are now determined by **the site owner's subscription tier**, not the user who runs the audit. This ensures consistent feature availability regardless of who triggers the audit on a shared site.

Additionally, each tier now limits how many members can be shared on a site, and site ownership can be transferred between users.

## Key Design Decisions

1. **Feature checks use site owner's tier** — E-E-A-T, AEO, security, performance, page limits, and depth limits are all gated by whoever owns the site.
2. **Concurrent audit limit stays user-based** — the person running the audit is capped by their own concurrency, preventing shared users from monopolizing the queue.
3. **Old owner becomes admin after transfer** — preserves their access to the site they built.
4. **Member count includes pending invitations** — prevents gaming limits by sending invites that circumvent the cap.
5. **Viewers cannot run audits** — only editors, admins, and owners can create audit jobs on a site.

## Database Changes

### Migration 043: `043_site_owner_tier_model.sql`

Added `max_members_per_site` column to `tier_limits`:

| Tier | max_members_per_site |
|------|---------------------|
| Free | 0 |
| Starter | 1 |
| Pro | 3 |
| Agency | 10 |
| Enterprise | NULL (unlimited) |

## Backend Changes

### `server/src/services/site.service.ts`

- **`getSiteOwnerTierLimits(siteId)`** — Resolves the site owner via `COALESCE(owner_id, created_by)` and returns their tier limits. Thin wrapper around `getUserTierLimits`.
- **`transferSiteOwnership(siteId, currentOwnerId, newOwnerId)`** — Validates ownership, checks new owner's site limit, updates `sites.owner_id`, removes new owner's share (now owner), creates admin share for old owner.

### `server/src/routes/audits/index.ts`

- Moved `findOrCreateSiteForDomain` call **before** tier resolution.
- Replaced `getUserTierLimits(userId)` with `getSiteOwnerTierLimits(siteId)` for page/depth/feature gating.
- Concurrent audit limit still uses `getUserTierLimits(userId)`.
- Added permission guard: shared users need `editor`+ role to run audits (403 for viewers).

### `server/src/services/queue/audit-worker.service.ts`

- Consolidated two duplicate tier queries (E-E-A-T and AEO) into a single query.
- Changed tier resolution from `job.user_id` to `job.site_id` — uses the site owner's tier.

### `server/src/services/site-sharing.service.ts`

- Added `checkMemberLimit(siteId)` helper — counts accepted shares + pending invitations against the site owner's tier limit.
- Enforced in `createShare()`, `createInvitation()`, and transitively in `shareByEmail()`.

### `server/src/routes/sites/index.ts`

- **GET `/:siteId/shares`** — Response now includes `memberLimit: { used, max, tier }`.
- **POST `/:siteId/shares`** and **POST `/:siteId/invitations`** — Return 403 with `MEMBER_LIMIT_REACHED` code when limit is hit.
- **POST `/:siteId/transfer`** — New endpoint (owner-only). Accepts `{ email }`, validates target user exists, transfers ownership.

## Frontend Changes

### `client/src/types/site.types.ts`

- Added `maxMembersPerSite: number | null` to `TierLimits` interface.
- Added `MemberLimit` interface (`{ used, max, tier }`).

### `client/src/services/api.ts`

- Updated `getShares` return type to include `memberLimit`.
- Added `transferOwnership(siteId, email)` API method.

### `client/src/pages/sites/SiteDetail.tsx`

- Sharing tab header shows member usage (e.g., "2 / 3 members used").
- "Users with Access" card shows count (e.g., "(2/3)").
- "Invite User" button disabled at limit with hover tooltip.
- "Transfer Ownership" button visible to site owners only.
- Transfer ownership modal with email input and tier impact warning.

## Critical Files

| File | Action |
|------|--------|
| `server/src/db/migrations/043_site_owner_tier_model.sql` | NEW |
| `server/src/services/site.service.ts` | Added `getSiteOwnerTierLimits`, `transferSiteOwnership` |
| `server/src/routes/audits/index.ts` | Site owner tier, permission guard |
| `server/src/services/queue/audit-worker.service.ts` | Site owner tier, consolidated queries |
| `server/src/services/site-sharing.service.ts` | Member limit enforcement |
| `server/src/routes/sites/index.ts` | Transfer endpoint, member limit in shares response |
| `client/src/types/site.types.ts` | `MemberLimit` type, `maxMembersPerSite` field |
| `client/src/services/api.ts` | Updated shares type, added `transferOwnership` |
| `client/src/pages/sites/SiteDetail.tsx` | Member limits UI, transfer ownership UI |

## Verification Checklist

1. Run migration 043 — verify `max_members_per_site` column added with correct values
2. Create a Pro site, share with 3 users — succeeds; try 4th — fails with limit error
3. Create a Free site — try to share — fails immediately (limit = 0)
4. Run audit as shared editor on a Pro site — E-E-A-T and AEO populated (site owner's tier)
5. Run audit as shared editor on a Free site — E-E-A-T/AEO columns are NULL
6. Attempt audit as a viewer — 403 rejection
7. Transfer site ownership — old owner becomes admin, new owner has full control
8. Transfer to a user at their site limit — rejection
9. Frontend: sharing tab shows member count/limit, invite button disabled at limit, transfer button visible to owner only
