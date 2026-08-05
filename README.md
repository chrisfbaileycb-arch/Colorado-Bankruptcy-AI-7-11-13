# LexPetition AI™ Engine

Attorney-supervised Colorado Chapter 7 petition preparation, deterministic validation, field-level provenance, exemption and means-test review, and draft PDF generation.

> **Current scope:** Chapter 7 is the implemented workflow. Chapter 11 and Chapter 13 are architecture plans only. This repository is not a filing service, does not provide legal advice, and must not be used without review by a qualified bankruptcy attorney.

## Release status

The codebase is a pre-production engineering prototype. Statements in historical audit or status documents describe implementation progress, not an independent legal, security, or production-readiness certification.

Before any client-data use, the release owner must verify:

- current official bankruptcy form editions and effective dates;
- current Colorado statutes, local bankruptcy rules, general procedures, and standing orders;
- authentication, authorization, encryption, audit logging, retention, deletion, and incident-response controls;
- attorney approval before any filing-ready packet can be exported.

See [SECURITY.md](SECURITY.md), [docs/data-handling.md](docs/data-handling.md), and [docs/release-checklist.md](docs/release-checklist.md).

## Local development

Requirements: [Bun](https://bun.sh/) and a supported Node.js runtime.

```bash
bun install --frozen-lockfile
bun test
bun run typecheck
bun run build
```

The browser UI is a demonstration interface. Serve the repository with a development server that supports TypeScript modules; do not open `index.html` directly from the filesystem.

## Documentation

- [Technical audit](AUDIT_REPORT.md)
- [Build status](STATUS.md)
- [State handoff](STATE_HANDOFF.md)
- [Master case data model](docs/data-model.md)
- [Multi-chapter expansion architecture](docs/multi-chapter-expansion-architecture.md)
- [Data handling and retention](docs/data-handling.md)
- [Release checklist](docs/release-checklist.md)

## Safety baseline

- Use synthetic fixtures only in source control and automated tests.
- Never commit client PII, credentials, access tokens, signed forms, or generated client PDFs.
- Browser-side acknowledgment screens are not authentication.
- Every generated packet must remain a draft until a supervising attorney explicitly approves it.
