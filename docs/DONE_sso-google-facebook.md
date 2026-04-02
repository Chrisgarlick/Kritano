# SSO Implementation: Google + Facebook Social Sign-On

## Context

Kritano currently supports email/password authentication only. Users have requested social sign-on for faster onboarding. This plan adds Google and Facebook SSO using the Authorization Code flow with PKCE, integrating into the existing custom JWT auth system (no Passport.js).

**User decisions:**
- Providers: Google + Facebook
- Account linking: Auto-link if emails match and provider confirms email is verified
- Settings UI: Link/unlink from settings page
- Email verification: Auto-verify if provider confirms it

---

## Database Changes

### Migration 087: `server/src/db/migrations/087_sso_oauth_providers.sql`

```sql
-- Make password_hash nullable for SSO-only users
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- Add avatar_url to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- OAuth providers link table
CREATE TABLE user_oauth_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('google', 'facebook')),
    provider_user_id TEXT NOT NULL,
    email TEXT,
    name TEXT,
    avatar_url TEXT,
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,
    raw_profile JSONB,
    linked_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (provider, provider_user_id),
    UNIQUE (user_id, provider)
);

CREATE INDEX idx_user_oauth_providers_user_id ON user_oauth_providers(user_id);
CREATE INDEX idx_user_oauth_providers_lookup ON user_oauth_providers(provider, provider_user_id);

CREATE TRIGGER update_user_oauth_providers_updated_at
    BEFORE UPDATE ON user_oauth_providers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

Key constraints:
- `UNIQUE (provider, provider_user_id)` -- prevents same social account linking to multiple Kritano users
- `UNIQUE (user_id, provider)` -- one link per provider per user

---

## Backend Changes

### New files to create

#### 1. `server/src/config/oauth.config.ts` -- OAuth configuration

```typescript
export const OAUTH_CONFIG = {
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUri: `${process.env.APP_URL}/auth/callback/google`,
    scopes: ['openid', 'email', 'profile'],
  },
  facebook: {
    appId: process.env.FACEBOOK_APP_ID || '',
    appSecret: process.env.FACEBOOK_APP_SECRET || '',
    redirectUri: `${process.env.APP_URL}/auth/callback/facebook`,
    scopes: ['email', 'public_profile'],
    graphApiVersion: 'v19.0',
  },
  state: {
    cookieName: 'oauth_state',
    maxAgeMs: 10 * 60 * 1000, // 10 minutes
  },
};
```

#### 2. `server/src/services/oauth.service.ts` -- OAuth service

Core methods:
- `generateAuthUrl(provider)` -> returns `{ url, state, codeVerifier }` with PKCE
- `exchangeCode(provider, code, codeVerifier)` -> returns `OAuthProfile`
- `findOAuthLink(provider, providerUserId)` -> find existing link
- `linkProvider(userId, provider, profile, tokens)` -> create link row
- `unlinkProvider(userId, provider)` -> delete link row
- `getLinkedProviders(userId)` -> list linked providers
- `handleOAuthLogin(provider, profile, tokens)` -> orchestrate find/create/link user

**`handleOAuthLogin` flow:**
1. Check if OAuth link exists for `(provider, provider_user_id)` -> log in existing linked user
2. Else check if user exists with same email:
   - If yes + provider email verified -> auto-link + log in
   - If yes + email NOT verified -> reject with helpful error
3. Else create new user (`password_hash = NULL`, `email_verified = TRUE`, `status = 'active'`) -> link + return `isNewUser: true`

**Google**: Use `google-auth-library` (`OAuth2Client.getToken()` + `verifyIdToken()`)
**Facebook**: Direct `fetch` to Graph API (`/oauth/access_token` + `/me?fields=id,email,first_name,last_name,picture`)

#### 3. `server/src/routes/auth/oauth.ts` -- OAuth routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/auth/oauth/:provider/url` | Public | Returns auth URL, sets state cookie (`sameSite: lax`) |
| POST | `/api/auth/oauth/:provider/callback` | Public | Exchanges code -> login/register -> sets JWT cookies |
| GET | `/api/auth/oauth/providers` | Required | Lists linked providers for current user |
| POST | `/api/auth/oauth/:provider/link` | Required | Links provider to authenticated user |
| DELETE | `/api/auth/oauth/:provider` | Required | Unlinks provider (enforces >= 1 auth method remains) |

### Existing files to modify

#### 4. `server/src/types/auth.types.ts`
- Change `password_hash: string` -> `password_hash: string | null` in `User` interface
- Add `OAuthProvider`, `OAuthProfile`, `OAuthTokens`, `OAuthProviderRecord`, `OAuthProviderSummary` types
- Add audit event types: `'oauth_login' | 'oauth_register' | 'oauth_link' | 'oauth_unlink' | 'oauth_auto_link'`

#### 5. `server/src/services/user.service.ts`
- Add `createOAuthUser(profile: OAuthProfile): Promise<SafeUser>` -- creates user with `password_hash = NULL`, `email_verified = TRUE`, `status = 'active'`
- Add `hasPassword(userId: string): Promise<boolean>` -- checks if `password_hash IS NOT NULL`

#### 6. `server/src/routes/auth/index.ts`
- **Login handler**: Before `passwordService.verify()`, check if `user.password_hash` is null -> return error code `SSO_ONLY_ACCOUNT` with message "This account uses social sign-in. Please sign in with Google or Facebook, or set a password from your account settings."
- **`/auth/me` route**: Return `hasPassword: boolean` and `linkedProviders: OAuthProviderSummary[]` in response
- Register OAuth sub-router: `router.use('/oauth', oauthRouter)`

#### 7. `server/src/middleware/rateLimit.middleware.ts`
- Add `oauthRateLimiter` (5 attempts per 15 min per IP)

#### 8. `server/src/config/auth.config.ts`
- Add `OAUTH_STATE_COOKIE_CONFIG` with `sameSite: 'lax'` (required for cross-origin redirects from providers)

---

## Frontend Changes

### New files to create

#### 9. `client/src/components/auth/SocialButtons.tsx` -- Reusable social login buttons

Google: white bg, slate border (secondary button style per brand guidelines)
Facebook: `#1877F2` brand blue bg

On click: `GET /api/auth/oauth/{provider}/url` -> redirect `window.location.href` to returned URL.

#### 10. `client/src/pages/auth/OAuthCallback.tsx` -- Callback handler page

Route: `/auth/callback/:provider`
1. Extract `code` + `state` from URL query params
2. POST to `/api/auth/oauth/{provider}/callback`
3. On success: `refreshUser()` -> redirect to `/dashboard`
4. On error: show error message + link to `/login`

### Existing files to modify

#### 11. `client/src/components/auth/LoginForm.tsx`
- Add `<SocialButtons mode="login" />` above email/password form
- Add "or" divider between social buttons and email form
- Handle `SSO_ONLY_ACCOUNT` error code

#### 12. `client/src/components/auth/RegisterForm.tsx`
- Add `<SocialButtons mode="register" />` above form
- Add "or" divider

#### 13. `client/src/services/api.ts`
Add to `authApi`: `getOAuthUrl`, `oauthCallback`, `getLinkedProviders`, `linkProvider`, `unlinkProvider`

#### 14. `client/src/types/auth.types.ts`
- Add `hasPassword?: boolean` to `User`
- Add `OAuthProviderSummary` interface

#### 15. `client/src/contexts/AuthContext.tsx`
- Add `loginWithOAuth(provider, code, state)` method

#### 16. `client/src/App.tsx`
- Add route: `/auth/callback/:provider`

#### 17. `client/src/pages/settings/Profile.tsx`
- Add "Connected Accounts" card: Google + Facebook rows with Connect/Disconnect
- If user has no password: "Set a password" prompt instead of "Change password"

---

## Environment Variables

```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
```

## NPM Dependencies

- `google-auth-library` (server only)

---

## Security Considerations

1. Authorization Code + PKCE flow -- code exchanged server-side
2. State parameter in httpOnly cookie (10 min TTL) prevents CSRF
3. `sameSite: lax` for OAuth state cookie; main auth cookies remain `strict`
4. Only auto-link if provider confirms `email_verified: true`
5. Unlink enforces >= 1 auth method must remain
6. Login route handles null `password_hash` gracefully
7. OAuth endpoints rate-limited (5 per 15 min)
8. All events logged in `auth_audit_logs`

---

## Implementation Order

| # | Task | Files |
|---|------|-------|
| 1 | Database migration | `server/src/db/migrations/087_sso_oauth_providers.sql` |
| 2 | Install `google-auth-library`, add env vars | `server/package.json`, `.env.example` |
| 3 | OAuth config | `server/src/config/oauth.config.ts` |
| 4 | Backend types | `server/src/types/auth.types.ts` |
| 5 | OAuth service | `server/src/services/oauth.service.ts` |
| 6 | User service updates | `server/src/services/user.service.ts` |
| 7 | Rate limiter | `server/src/middleware/rateLimit.middleware.ts` |
| 8 | OAuth routes | `server/src/routes/auth/oauth.ts` |
| 9 | Register routes + fix login for null password | `server/src/routes/auth/index.ts` |
| 10 | Auth config (state cookie) | `server/src/config/auth.config.ts` |
| 11 | Frontend types | `client/src/types/auth.types.ts` |
| 12 | Frontend API methods | `client/src/services/api.ts` |
| 13 | SocialButtons component | `client/src/components/auth/SocialButtons.tsx` |
| 14 | OAuthCallback page | `client/src/pages/auth/OAuthCallback.tsx` |
| 15 | Update LoginForm + RegisterForm | `client/src/components/auth/LoginForm.tsx`, `RegisterForm.tsx` |
| 16 | Update AuthContext | `client/src/contexts/AuthContext.tsx` |
| 17 | Add callback route | `client/src/App.tsx` |
| 18 | Connected Accounts in Profile | `client/src/pages/settings/Profile.tsx` |

---

## Verification

- `npx tsc --noEmit` in both `server/` and `client/`
- New user signs up with Google -> account created, email auto-verified, lands on dashboard
- Existing email/password user signs in with Google (same email) -> auto-linked, logged in
- SSO-only user tries email/password login -> gets `SSO_ONLY_ACCOUNT` error
- User links Google from Settings -> Connected Accounts shows Google linked
- User unlinks Google (with password set) -> succeeds
- User tries to unlink only auth method -> rejected
- State parameter mismatch / expired -> rejected
- Facebook login with unverified email + existing account -> rejected with helpful message

---

## Setup Guide: Getting SSO Working

### Step 1: Run the Database Migration

```bash
# Connect to your PostgreSQL instance and run:
psql $DATABASE_URL -f server/src/db/migrations/087_sso_oauth_providers.sql

# Or if you use your existing migration runner:
# (however your project runs migrations — apply 087)
```

### Step 2: Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project (or select your existing one)
3. Go to **APIs & Services > OAuth consent screen**
   - Choose **External** user type
   - Fill in app name ("Kritano"), support email, developer email
   - Add scopes: `openid`, `email`, `profile`
   - Add your domain(s) to **Authorized domains** (e.g. `kritano.com`)
   - For development, add test users (your email) — while in "Testing" publishing status, only test users can sign in
4. Go to **APIs & Services > Credentials**
   - Click **Create Credentials > OAuth client ID**
   - Application type: **Web application**
   - Name: "Kritano" (or whatever you like)
   - **Authorized JavaScript origins**: `http://localhost:3000` (dev) and your production URL
   - **Authorized redirect URIs**: `http://localhost:3000/auth/callback/google` (dev) and `https://yourdomain.com/auth/callback/google` (prod)
   - Click Create — copy the **Client ID** and **Client Secret**

### Step 3: Set Up Facebook OAuth

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Click **My Apps > Create App**
   - Choose **Consumer** (or "None" if prompted for use case)
   - App name: "Kritano"
3. From the app dashboard, go to **App Settings > Basic**
   - Copy the **App ID** and **App Secret**
   - Set **App Domains**: `localhost` (dev) and your production domain
   - Set **Privacy Policy URL** and **Terms of Service URL** (required for going live)
4. Go to **Add Product** and add **Facebook Login for Web**
   - In Facebook Login > Settings:
   - **Valid OAuth Redirect URIs**: `http://localhost:3000/auth/callback/facebook` (dev) and `https://yourdomain.com/auth/callback/facebook` (prod)
   - Enable **Client OAuth Login** and **Web OAuth Login**
5. The app starts in **Development** mode — only app admins/developers/testers can log in. To allow all users, submit for **App Review** and switch to **Live** mode (requires privacy policy, valid redirect URIs, etc.)

### Step 4: Add Environment Variables

Add these to your `server/.env` file:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-google-client-secret

# Facebook OAuth
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
```

Make sure `APP_URL` is also set correctly — the redirect URIs are built from it:
```env
APP_URL=http://localhost:3000
```

### Step 5: Restart the Server

```bash
cd server && npm run dev
```

### Step 6: Test the Flow

1. **New user via Google**: Go to `/login` → click "Sign in with Google" → authorize → should land on `/dashboard` with a new account
2. **Existing user auto-link**: Sign in with Google using an email that already has an account → should auto-link and log in
3. **SSO-only password login**: Try logging in with email/password for an SSO-only account → should see "This account uses social sign-in" error
4. **Link from settings**: Log in normally → go to `/settings/profile` → Connected Accounts → click Connect on Google/Facebook
5. **Unlink**: Disconnect a provider from settings (only works if you have another auth method)

### Production Checklist

- [ ] Google OAuth consent screen published (moved out of "Testing" mode) or all users added as test users
- [ ] Facebook app switched to **Live** mode (requires app review for `email` permission)
- [ ] Redirect URIs updated to production domain in both Google and Facebook dashboards
- [ ] `APP_URL` env var set to production URL (e.g. `https://kritano.com`)
- [ ] `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET` set in production env
- [ ] Migration 087 applied to production database
- [ ] HTTPS enforced (OAuth providers require it in production)
