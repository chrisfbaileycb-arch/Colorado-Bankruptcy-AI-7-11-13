# Release Checklist

A release owner must record evidence for every item. “Implemented” is not equivalent to “verified.”

## Engineering

- [ ] Clean install succeeds from a committed lockfile using a frozen install.
- [ ] The deployed AppDeploy snapshot is reproducibly built from a recorded GitHub commit SHA.
- [ ] Tests, typecheck, and production build pass in CI.
- [ ] PDF output regression fixtures pass for every supported form.
- [ ] Dependency and secret scans pass.
- [ ] Browser output encoding/CSP and XSS regression coverage are verified for every user-controlled value rendered into HTML.
- [ ] Backup and restore are tested.

## Legal and form currency

- [ ] A qualified Colorado bankruptcy attorney verifies every exemption rule and amount.
- [ ] Official U.S. Courts form editions and effective dates are recorded in machine-readable metadata.
- [ ] District of Colorado local rules, general procedures, standing orders, and required local forms are verified.
- [x] Colorado median-income table and effective date are verified against the U.S. Trustee Program table effective 2026-07-15.
- [ ] Means-test expense standards and all other means-test inputs are verified against authoritative sources.
- [ ] Chapter 11 and Chapter 13 remain disabled until separately implemented and verified.

## Privacy and security

- [ ] Independent security review is complete.
- [ ] Server-side authentication, authorization, tenant isolation, encryption, audit trails, secrets management, retention, deletion, and incident response are tested.
- [ ] No real client data exists in source, fixtures, logs, screenshots, or deployment history.
- [ ] Generated PDFs and temporary files follow the approved lifecycle.

## Attorney gate

- [ ] Export remains “DRAFT — NOT FILED.”
- [ ] Hard audit flags and unresolved/flagged material fields block approval.
- [ ] Any UI readiness/coverage percentage is demonstrably consistent with validation results and generated output.
- [ ] Supervising attorney identity and approval are server-validated and auditable.
- [ ] Filing remains a separate authorized attorney action.
