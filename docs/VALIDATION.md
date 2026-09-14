# Development validation

This report covers the development machine and controlled fixtures. It is not proof that the authoritative destination has been configured or accepted.

## Verified during development

- TypeScript compilation and production interface build.
- File-backed goals and tasks, profile isolation, parent/task relationships, hierarchy-cycle rejection, retained versions, optimistic concurrency, and idempotent retry.
- Recommendations remain advisory until accepted. Acceptance and resulting record creation are one snapshot transaction. Stale reviewed targets and foreign review packets are rejected.
- HTTP host, origin, and session checks reject controlled hostile requests. Core state responses exclude the internal idempotence ledger.
- Consistent core backup, isolated exact restore, tamper detection, and refusal to overwrite an existing restore target.
- Controlled AubOS attachment dry run, verified copy, source preservation, symlink rejection, and refusal to overwrite an attached target.
- Browser creation and persistence of a controlled goal with success criteria, milestones, and progress, plus a linked task.
- Browser recommendation import leaves assigned work unchanged. Explicit acceptance creates the task and records the decision. Switching to FreedOS shows an empty separate store; returning to AubOS preserves its records.
- Rendered desktop and phone checks, all six appearance choices, readable controls, flat workspace button, avatar dropdown, and horizontal navigation arrows with edge fades.
- A detached copy without Git metadata passed dependency installation, all tests, typechecking, production build, package integrity verification, publication-path audit, startup, and live core health checks with Node 22.23.2.
- Redacted Gitleaks source scan and dependency vulnerability audit returned zero findings during development. Publication also requires the source-package and committed-history checks.

The automated suite currently contains 15 tests. GitHub CI repeats checks on Node 22 on macOS. The final handoff identifies the published commit and exact-head CI. Source scans do not guarantee detection of all personal information or credentials. Public visibility remains an owner decision after review.

## Not claimed

- No destination service, Tailscale route, authoritative personal record, current AubOS source directory, cloud resource, or factory was changed during these tests.
- No executive model call or automatic scheduler was started. Review packets are manually passed to the destination agent. Paseo owns execution and resource scheduling.
- No personal strategic-register import or reconciliation was performed.
- The existing AubOS application's build and live behavior after relocation remain destination acceptance steps.
- The private host is not an OS sandbox or a public multi-user service. Core backups are not backups of the full personal application and are not encrypted by this package.
