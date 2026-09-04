## Context

See [proposal.md](proposal.md) for the motivation. The application currently signs user, role, and branch data into `msf_session` with `jose`; authorization rehydrates the user but has no central session record. Browser mutations are issued through `requestJson`, while each route performs its own authorization, and no route currently validates CSRF or request origin.

The existing PostgreSQL/TypeORM data layer and API route handlers are suitable for a server-side session store. The application is same-origin and does not expose a public cross-origin API.

## Goals / Non-Goals

**Goals:**

- Keep credentials and the session identifier out of browser-readable storage.
- Support browser-restart persistence, rolling inactivity expiry, absolute expiry, targeted revocation, and immediate invalidation through normal authorization checks.
- Apply one consistent CSRF and origin policy to every unsafe application API request.
- Make correct CSRF header emission the default for client components through the existing shared request helper.

**Non-Goals:**

- Multi-factor authentication, password reset, external identity providers, device-management UI, and cross-origin API support.
- Preserving existing JWT cookies after deployment.
- Treating CSRF as a defense against XSS; existing input/output safety remains a separate concern.

## Decisions

### Opaque sessions stored server-side

Create a `user_sessions` table and matching TypeORM entity. It will store the user and selected branch, a hash of a cryptographically random session token, a hash of a separate random CSRF token, creation time, last activity time, idle expiry, absolute expiry, and optional revocation time. Lookup values are hashed before persistence, so a database disclosure does not yield reusable browser credentials.

Login creates a fresh session after password and branch checks. Authentication reads the `msf_session` cookie, hashes its opaque value, loads the record, and verifies lifetime, revocation, user status, role, and branch access. A valid request updates last activity and the rolling 30-day idle expiry, never past the 90-day absolute expiry. Branch switching updates the authorized branch on the current session rather than encoding it into a new token.

An opaque database session is selected over the current signed JWT because it supports revocation, server-side expiry, and session-specific CSRF binding. A signed JWT plus deny-list would need equivalent state while retaining stale claims and a more complex invalidation model.

### Cookie contract

`msf_session` contains only the random session token and is host-only, `HttpOnly`, `SameSite=Lax`, `Secure` in production, and scoped to `/`. Its browser lifetime is bounded by the session's remaining absolute lifetime. `msf_csrf` contains only the random CSRF token, is host-only, `SameSite=Strict`, `Secure` in production, scoped to `/`, and has the same maximum lifetime; it is intentionally readable by same-origin JavaScript solely to emit a request header.

The server, not cookie expiry alone, remains authoritative for idle and absolute deadlines. Expiring both cookies must use their matching names and attributes. Production deployment must use HTTPS; a secure cookie must not be weakened for an HTTP production environment.

### CSRF and origin enforcement at the authorization boundary

Introduce a shared guard used before every POST, PUT, PATCH, and DELETE handler. For authenticated mutations it will require an exact same-origin `Origin` header, a CSRF header, the CSRF cookie, and a constant-time comparison against the current session's stored CSRF-token hash. A missing or invalid value produces a generic forbidden response before any mutation service runs.

The login endpoint has no pre-existing session and therefore validates same-origin only; it creates session and CSRF cookies only after successful authentication. Logout and branch switching are protected as authenticated mutations. `requestJson` will read only `msf_csrf` and add the designated header for unsafe same-origin requests, merging rather than replacing caller-supplied headers.

This paired origin check and session-bound double-submit token is selected over `SameSite` alone because `SameSite` is a browser mitigation, not a complete server-side authorization signal. It is selected over a response-body token because it retains the cookie-only browser persistence requirement and avoids putting credentials in storage.

### Invalid-session cleanup and migration

Authorization will consistently classify missing, malformed, expired, revoked, and unauthorized sessions as unauthenticated. Route handlers that can write cookies will clear both cookies when they detect one; protected page access will redirect to login. The former JWT verifier and payload-bearing cookie are removed, so old tokens fail closed after the migration.

## Risks / Trade-offs

- [A database lookup now occurs for each authenticated request] -> Reuse the existing database connection pattern, keep the lookup indexed by token hash, and avoid cache complexity until measured.
- [A persistent cookie is valuable if a device is shared or stolen] -> Use `HttpOnly`, HTTPS-only production cookies, idle and absolute expiry, server-side revocation, and the existing explicit logout control.
- [CSRF rollout can miss a mutation route] -> Centralize enforcement, inventory all unsafe handlers, and add tests that prove each route is guarded.
- [Strict CSRF cookie behavior differs across browsers and navigation contexts] -> The token is needed only for same-origin JavaScript mutations; validate the deployed login and mutation flows in supported browsers.
- [Deploying the migration invalidates current users] -> Communicate a one-time re-login and deploy the schema before application code.

## Migration Plan

1. Deploy the database migration and indexes before the application version that reads sessions.
2. Deploy the application that creates and validates opaque sessions, CSRF cookies, and CSRF/origin guards; old JWT cookie values fail closed and users sign in again.
3. Verify production HTTPS, cookie attributes, successful same-origin mutations, failed missing/foreign CSRF requests, logout revocation, and persistence after browser restart.
4. If rollback is required, roll back application code while retaining the additive session table; do not re-enable JWT acceptance. A follow-up migration can remove unused session records only after the rollout is stabilized.
