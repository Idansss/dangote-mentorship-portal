# Production Readiness Audit Prompt

> **Pre-filled context for the Dangote Mentorship Portal.** This audit is generic by design. For *this* app, treat the threat model below as established and prioritize the whole audit by it — do not re-derive it from scratch, and do not invent findings for sections it rules out. Replace or extend if the architecture has changed.
>
> **Pre-filled Step 0 — Dangote Mentorship Portal**
> - **Stack:** Next.js (App Router) + TypeScript, PostgreSQL via Prisma, Supabase (Auth/Storage/Realtime) or self-hosted Postgres, Auth.js with Microsoft Entra ID SSO, server-side RBAC. Server-side AI adapter (Anthropic/Azure OpenAI). Internal enterprise portal, not public consumer scale.
> - **Scale:** internal use, low thousands of users per cohort (~120 mentors / ~300 mentees), bursty around clinics/newsletters. Optimize for correctness and isolation, not web-scale throughput.
> - **Highest-value assets:** private mentor↔mentee direct messages; signed confidentiality and mentoring agreements; mid/final review responses; session logs. A leak is a trust and potential legal failure, not just a defect.
> - **Primary threat is insider, not external:** the realistic abuse is an over-privileged admin reading private DMs or review content. Scrutinize the metadata-only default and the logged admin-override policy hardest. External and automated threats are secondary.
> - **Key access-control risk is multi-tenant cohort isolation.** Everything is cohort-scoped; point IDOR, broken-object-level-authorization, and privilege-escalation testing here first (e.g. can a 2026 mentor read a 2025 session log?).
> - **Compliance regime:** NDPR / Nigeria Data Protection Act 2023 (Nigerian operator and users). **No payments, no card data, no health data** — skip the Payments (§11) and PCI portions of Compliance (§16) outright with a one-line "not applicable" rather than inventing findings.
> - **Required evidence to run this:** repo/file tree, Prisma schema + migrations, server-action/route definitions, RBAC guard implementation, env variable *names* (never values), the AI adapter, and the messaging/agreements code paths. This audit is a post-build tool — it cannot run against a plan.

---

## Operating Rules (read first)

You are performing a production readiness audit. Follow these rules without exception:

1. **Audit only what you can verify** from the materials I provide (repo, file tree, configs, infra definitions, schemas). For anything you cannot verify, mark it `UNKNOWN — needs verification`. Do **not** infer that something is missing, broken, or secure without evidence.
2. **Every finding must cite evidence** — the file path, line, config key, or command output that proves it. No evidence, no finding.
3. **Label confidence** on each finding: `CONFIRMED`, `LIKELY`, or `NEEDS VERIFICATION`.
4. **Skip inapplicable sections** and say why in one line (e.g. "No payments — section skipped"). Do not invent findings to fill a checklist.
5. **Separate real risks from theoretical ones.** If something is technically valid but low-impact for this app, put it in a "Low-risk / theoretical" bucket so it doesn't bury what matters.
6. **Ask for missing inputs** rather than guessing. If you need a file you don't have, list exactly what to provide.

Apply recognized standards where relevant: OWASP ASVS and OWASP Top 10, CIS Benchmarks, the Twelve-Factor App methodology, and WCAG 2.2 for accessibility.

---

## Step 0 — Context & Threat Model (do this before any checklist)

Before auditing, establish and restate:

- **Stack & architecture**: languages, frameworks, datastores, hosting, deployment target.
- **Traffic & scale**: current and expected users, request volume, data growth.
- **Data sensitivity**: what PII, financial, health, or regulated data is handled? What's the blast radius if it leaks?
- **Threat model**: who are the likely attackers (external, insider, automated), what are they after, and what are the highest-value assets?
- **Compliance surface**: which regimes actually apply given the data and user geography (GDPR, NDPR, CCPA, PCI DSS, HIPAA, etc.)?

The rest of the audit should be prioritized by this threat model. Generic checklists without it find generic issues.

---

## Required Inputs

List for me anything below that you need but don't have:

- Repository or full file tree
- Dependency manifests (package.json, requirements.txt, go.mod, etc.)
- Database schema and migration files
- Infrastructure definitions (Dockerfiles, IaC, CI/CD configs)
- Environment variable / secrets handling (names only, never values)
- API route definitions
- Auth and session implementation

---

## Audit Domains

Cover the domains below **that apply** to this app. Go deep on security, data integrity, and auth first; these carry the highest risk. Work in priority order and flag if the scope is larger than one pass can cover well.

### 1. Architecture & Code Organization
Project structure, layer separation, coupling, single points of failure, scalability bottlenecks, background jobs/queues, environment separation, technical debt. Identify architectural weaknesses with evidence.

### 2. Security (OWASP Top 10 + ASVS)
SQL/NoSQL injection, XSS (stored/reflected), CSRF, SSRF, RCE/command injection, broken auth, broken access control, IDOR, privilege escalation, session fixation/hijacking, security misconfiguration, secrets exposure, hardcoded credentials, open redirects, dependency vulnerabilities, file upload risks, JWT/OAuth flaws, CORS and cookie misconfiguration, password storage.
Verify transport and storage controls: HTTPS/HSTS, CSP, secure/HttpOnly/SameSite cookies, encryption at rest and in transit.

### 3. Authentication
Registration, login, logout, password reset, email/phone verification, MFA, session expiration, refresh tokens, account lockout, brute-force protection, account recovery. Verify protected resources reject unauthenticated access.

### 4. Authorization
RBAC/ABAC, role and tenant isolation, resource-ownership validation, admin vs staff vs user permissions. Test for privilege escalation paths.

### 5. APIs
Per endpoint: authn, authz, input validation/sanitization, rate limiting, error handling, logging, pagination/filtering/sorting, versioning, idempotency, retry handling. Flag slow endpoints, N+1 queries, oversized payloads.

### 6. Database
Schema design, relationships, normalization, indexes, constraints, query performance, connection pooling. Backup AND restore strategy (a backup that's never test-restored doesn't count), migration strategy. Flag missing indexes, full table scans, slow queries, orphaned/duplicate data.

### 7. Performance
Core Web Vitals (LCP, INP, CLS), TTFB, bundle size, code splitting, tree shaking, lazy loading, image optimization, query and caching effectiveness. Name each bottleneck with evidence.

### 8. Caching
Browser, CDN, edge, application/Redis, query caching. Verify invalidation, expiration, and cache security (no leaking private data via shared cache).

### 9. Rate Limiting
Per-IP, per-user, per-device limits on login, signup, OTP, password reset, public/private/admin APIs, webhooks, search, file uploads, payments.

### 10. File Storage
Upload validation (type, size), malware/virus scanning, storage encryption, signed URLs, CDN delivery, access scoping.

### 11. Payments (if applicable)
Payment flows, webhook verification, transaction integrity, duplicate/idempotency protection, refunds, chargebacks, fraud controls, PCI scope and whether card data ever touches your servers.

### 12. Observability & Logging
Metrics, tracing, structured logs, alerts, health checks, uptime and error tracking. Logs for auth, payments, admin actions, security events, system/DB errors — without logging secrets or PII. Verify retention policy.

### 13. DevOps & Deployment
Containerization, CI/CD, rollback strategy, blue-green/canary, secrets management, IaC, environment management.

### 14. Reliability & Disaster Recovery
Retries, circuit breakers, graceful degradation, failover, redundancy, fault tolerance. Defined and *tested* RTO/RPO and backup restores.

### 15. Testing
Unit, integration, E2E, security, load/stress, regression, accessibility, cross-browser, mobile. Report actual coverage where measurable; don't estimate a percentage you can't see.

### 16. Compliance
Only the regimes that apply (per Step 0). Privacy policy, ToS, cookie consent, data retention/deletion, DSAR handling, KYC/AML and PCI DSS where relevant.

### 17. SEO & Accessibility (if user-facing web)
SEO: meta tags, structured data, sitemap, robots.txt, canonicals, Open Graph, indexability. Accessibility: WCAG 2.2, keyboard nav, screen readers, color contrast, focus states, ARIA, semantic HTML.

### 18. Analytics & Cost
Event/funnel/conversion tracking and gaps. Cost: expensive queries, overprovisioned/idle resources, storage and bandwidth waste, with rough monthly savings estimates.

---

## Output Format

### A. Executive Summary
3–5 sentences: overall state, biggest risks, and the single most important thing to fix.

### B. Findings by Severity
Group as **Critical (block launch)**, **High**, **Medium**, **Low / Theoretical**. For each finding:

| Field | |
|---|---|
| **Problem** | What's wrong |
| **Evidence** | File / line / config proving it |
| **Confidence** | CONFIRMED / LIKELY / NEEDS VERIFICATION |
| **Impact** | What happens if unfixed |
| **Fix** | Concrete remediation |
| **Effort** | S / M / L |

### C. Scores (only if rubric-backed)
Give a score per domain **only when** you can state the rubric behind it (what separates 70 from 85). Otherwise report a qualitative rating: `Strong / Adequate / Weak / Unknown`. Don't fabricate precision.

- Overall Production Readiness
- Security, Scalability, Performance, Reliability
- Compliance, DevOps, Testing, SEO, Accessibility, Cost

### D. Launch Recommendation
One of: `NOT READY` / `PARTIALLY READY` / `READY FOR BETA` / `READY FOR PRODUCTION` / `READY FOR SCALE` — with the 2–3 findings that drive the verdict.

### E. Scale Readiness
What breaks first at 1K → 10K → 100K → 1M → 10M users, based on the actual architecture (not generic advice).

### F. Action Plan
Phased and ordered:
- **Phase 1 — Critical**: must fix before launch
- **Phase 2 — Important**: before scaling
- **Phase 3 — Optimization**
- **Phase 4 — Scale prep**

### G. Open Questions / Missing Inputs
Everything marked UNKNOWN and exactly what you need to resolve it.
