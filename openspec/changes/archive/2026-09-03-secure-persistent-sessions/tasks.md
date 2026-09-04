## 1. Persistent session foundation

- [x] 1.1 Add the `user_sessions` entity, export it, register it with the data source, and create an indexed migration for hashed tokens, user/branch references, expiry timestamps, activity, and revocation; verify `npm run db:migrate` succeeds on an empty database.
- [x] 1.2 Replace JWT creation, reading, and deletion in the session module with opaque random-token creation, hashed lookup, expiry validation, rolling activity renewal, cookie issuance, and cookie clearing; verify focused unit tests cover valid, unknown, idle-expired, absolute-expired, and revoked sessions.
- [x] 1.3 Update page and API authorization helpers to load the server-side session and validate user status, current role, and selected-branch permission; verify authorization tests reject an inactive user and a user whose selected branch access was removed.

## 2. CSRF and request-origin controls

- [x] 2.1 Add shared origin and session-bound CSRF validation helpers using constant-time token comparison; verify tests reject missing Origin, foreign Origin, missing header, mismatched cookie/header, and mismatched session token.
- [x] 2.2 Apply the shared guard before every POST, PUT, PATCH, and DELETE route, with same-origin-only validation on login and full validation on authenticated mutations; verify an inventory-based test or route tests cover auth, users, categories, products, and stock mutations.
- [x] 2.3 Update login, logout, and branch-switch flows to create, revoke, clear, or update server-side sessions and their paired cookies as designed; verify login creates both cookies, logout makes the opaque token unusable, and an authorized branch change persists.

## 3. Browser integration and persistence

- [x] 3.1 Update `requestJson` to attach the CSRF header only to unsafe same-origin requests while preserving caller-supplied headers; verify unit tests cover POST/PATCH/DELETE header injection and GET non-injection.
- [x] 3.2 Adapt client authentication and mutation callers to the shared request behavior without adding authentication data to local or session storage; verify TypeScript compilation and successful login, logout, branch switch, and a representative stock mutation in the running application.
- [x] 3.3 Ensure invalid-session handling clears both cookies and protected pages redirect to login; verify a browser or route-level test covers a browser restart within the idle window and access after expiry.

## 4. Verification and deployment readiness

- [x] 4.1 Add regression tests for cookie attributes, session persistence, rolling expiry bounded by absolute expiry, legacy JWT rejection, and CSRF-protected mutation behavior; verify `npm test` passes.
- [x] 4.2 Run `npm run lint`, `npm run typecheck`, and `npm run build`; verify all commands pass and no existing test regressions remain.
- [x] 4.3 Validate the deployment prerequisites documented in the design: HTTPS in production, a stable `AUTH_SECRET`, and deployment of the database migration before application code; verify the release checklist records the one-time re-login expectation.
