## Why

The current signed JWT cookie expires after a fixed ten hours and cannot be revoked centrally. It also lacks CSRF validation for state-changing endpoints, leaving cookie-authenticated actions insufficiently protected.

## What Changes

- Replace the browser's signed JWT with an opaque, server-side session referenced only by an `HttpOnly` cookie.
- Persist sessions across browser restarts with rolling expiration, central revocation, and validation of the user and selected branch on every authenticated request.
- Add CSRF protection to every state-changing API route, using a cookie-backed token and a required request header, plus same-origin validation.
- Update the shared browser API client so authenticated mutations automatically include the CSRF header without storing authentication credentials in JavaScript storage.
- Revoke the server-side session and clear both cookies on logout or when an invalid session is detected.
- Add automated coverage for session lifetime, revocation, cookie attributes, and CSRF rejection/acceptance cases.

## Capabilities

### New Capabilities

- `session-security`: Persistent, revocable cookie-only browser sessions and CSRF safeguards for authenticated mutations.

### Modified Capabilities

- None.

## Impact

- Affected code: `src/lib/auth`, authentication routes, authorization helpers, `src/lib/client-api.ts`, all mutating API routes, and login/logout/branch-switch UI flows.
- Affected data: a new persistent session store and migration.
- Existing JWT session cookies will no longer be accepted, so users will sign in once after deployment.
- No new third-party dependency is expected; secure random values and token hashing can use Node/Web platform primitives already available to the application.
