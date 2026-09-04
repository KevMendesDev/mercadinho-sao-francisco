# session-security Specification

## Purpose

Protect browser access with durable, revocable cookie-only sessions while preventing cross-site requests from changing authenticated application data.

## Requirements

### Requirement: Persistent cookie-only browser session
The system SHALL create an opaque session when credentials and branch access are successfully verified. The browser SHALL receive only a persistent `HttpOnly`, `Secure` in production, path-scoped session cookie and SHALL not store authentication credentials in local storage, session storage, or client-readable JavaScript state. A session SHALL expire after 30 days without activity and SHALL not remain valid beyond 90 days from creation.

#### Scenario: Returning within the inactivity window
- **WHEN** an authenticated person closes and later reopens the browser within 30 days of their last activity
- **THEN** the system authenticates the person without requiring another login

#### Scenario: Session inactivity expires
- **WHEN** a person returns after 30 days without session activity
- **THEN** the system rejects the session, clears its browser cookies, and redirects protected-page access to login

#### Scenario: Legacy token is presented after deployment
- **WHEN** a browser presents a session cookie issued by the former JWT mechanism
- **THEN** the system treats it as unauthenticated and requires a new login

### Requirement: Server-side session validation and revocation
The system SHALL validate each authenticated request against the server-side session record, current user status, current role, and permitted selected branch. The system SHALL reject revoked, expired, unknown, inactive-user, or unauthorized-branch sessions and clear their browser cookies. Logout SHALL revoke the current server-side session before clearing its cookies.

#### Scenario: User is deactivated during an active session
- **WHEN** an administrator deactivates a user with an existing browser session
- **THEN** the user's next authenticated request is rejected and the browser session is cleared

#### Scenario: Person signs out
- **WHEN** an authenticated person submits a valid logout request
- **THEN** the current server-side session is revoked and the browser cannot reuse it to access protected resources

#### Scenario: Selected branch access is removed
- **WHEN** a non-administrator loses access to the branch selected in their session
- **THEN** the next authenticated request is rejected and requires login with an authorized branch

### Requirement: CSRF protection for state changes
The system SHALL reject every state-changing authenticated API request unless it presents a valid CSRF token associated with the current session in the designated request header and originates from the application's own origin. The CSRF value MAY be browser-readable solely to construct the header, but it SHALL not grant authentication by itself. Login SHALL require same-origin validation before creating a session.

#### Scenario: Same-origin mutation includes a valid CSRF token
- **WHEN** an authenticated browser sends a same-origin POST, PATCH, PUT, or DELETE request with the session's valid CSRF header
- **THEN** the system evaluates authorization and processes the request normally

#### Scenario: Cross-site request attempts a mutation
- **WHEN** a request from another origin targets a state-changing API endpoint using a person's browser cookies
- **THEN** the system rejects the request before performing the action

#### Scenario: CSRF header is absent or mismatched
- **WHEN** an authenticated state-changing request has no CSRF header or a token that does not match the current session
- **THEN** the system rejects the request without changing application data

### Requirement: Session renewal without credential exposure
The system SHALL renew a valid active session's inactivity deadline during normal authenticated use without extending its absolute lifetime. The system SHALL issue any replacement cookies with the same security attributes and SHALL preserve the selected branch when it remains authorized.

#### Scenario: Active use renews the inactivity deadline
- **WHEN** a person makes an authenticated request before the 30-day inactivity deadline
- **THEN** the system extends the inactivity deadline while retaining the original 90-day absolute expiration boundary

#### Scenario: Branch selection changes
- **WHEN** an authenticated person selects a branch they are authorized to access
- **THEN** subsequent authenticated requests use that branch without exposing credentials to client-side storage
