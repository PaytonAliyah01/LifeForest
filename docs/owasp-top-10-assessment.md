# OWASP Top 10 Assessment

This checklist is based on the current OWASP Top 10 web application list, OWASP Top 10:2021.

Use it as the project security evidence file: run the automated checks, review each category, and record findings or fixes in the notes column.

## Automated Checks

Run dependency and audit checks:

```powershell
.\security-check.ps1
```

Run an unauthenticated OWASP ZAP baseline scan after the backend is running:

```powershell
.\security-check.ps1 -SkipBackend -SkipFrontend -ZapTarget http://localhost:8080
```

Reports:

```text
backend/build/reports/dependency-check-report.html
security-reports/zap-baseline-report.html
```

## Top 10 Checklist

| OWASP category | What to check in LifeForest | Evidence / command | Notes |
| --- | --- | --- | --- |
| A01 Broken Access Control | Confirm protected endpoints require a valid user token and users cannot read or modify another user's tasks, routines, trees, or focus sessions. | Controller/service tests; manual API calls with two users. | Current hotspot: `SecurityConfig` permits all requests. |
| A02 Cryptographic Failures | Confirm passwords are hashed with BCrypt, JWT secret is strong and environment-based, sensitive data is not logged, and production traffic uses HTTPS. | Code review; environment review. | Current hotspot: dev fallback JWT secret and SQL logging. |
| A03 Injection | Confirm request DTO validation is used, repository access uses JPA/parameter binding, and no raw SQL is built from user input. | Code review; tests with malformed input. | Add validation where request fields are missing constraints. |
| A04 Insecure Design | Confirm abuse cases are handled: interrupted focus sessions, task ownership, routine ownership, replayed JWTs, and deleted records. | Threat model notes; service tests. | Write expected security rules before implementation. |
| A05 Security Misconfiguration | Confirm CORS is restricted, error responses do not leak stack traces, debug endpoints are disabled, and production settings differ from dev settings. | `application.yml`; ZAP baseline report. | Current hotspot: CSRF disabled and broad permit rules. |
| A06 Vulnerable and Outdated Components | Check backend and frontend dependencies for known vulnerabilities. | `.\security-check.ps1`; Dependency-Check and `npm audit` reports. | CI runs both checks. |
| A07 Identification and Authentication Failures | Confirm login rejects bad credentials, password hashing is verified, JWT expiration is enforced, and protected endpoints reject missing/invalid tokens. | Auth tests; manual API calls. | Add tests for expired and tampered JWTs. |
| A08 Software and Data Integrity Failures | Confirm dependency lock files are committed, CI uses clean installs, and deployment images are built from trusted sources. | `package-lock.json`; Gradle wrapper; CI config. | Consider Gradle dependency verification later. |
| A09 Security Logging and Monitoring Failures | Confirm auth failures, access-denied events, and unexpected server errors are logged without secrets. | Code review; integration tests. | Add structured security logging when auth is enforced. |
| A10 Server-Side Request Forgery | Confirm the backend does not fetch arbitrary user-provided URLs. If URL-fetching is added later, allowlist destinations. | Code review. | No obvious SSRF surface currently. |

## Suggested Assessment Flow

1. Start the database and backend.
2. Run `.\security-check.ps1`.
3. Run the ZAP baseline scan against `http://localhost:8080`.
4. Review each checklist row and add findings in the notes column.
5. Convert findings into fixes or test cases.

## Sources

- OWASP Top 10:2021: https://owasp.org/Top10/2021/
- OWASP ZAP baseline scan: https://www.zaproxy.org/docs/docker/baseline-scan/
