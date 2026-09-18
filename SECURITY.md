# Security

Vorton is designed for one owner on a local machine. The portable host validates Host and Origin headers, requires a process-local session token for mutations, binds writes to the selected workspace, and uses revision checks to reject stale changes. State files use atomic replacement and a writer lock. These controls do not make it a multi-user internet service or an operating-system sandbox.

Do not put credentials or personal records in demo fixtures, issues, screenshots, or pull requests. Do not report a suspected secret publicly. A private vulnerability-reporting channel must be configured by the repository owner before public release.

If a credential has been exposed, removing the current file is insufficient. The credential owner must revoke or rotate it and assess logs, history, artifacts, and forks. This repository's audit tooling never rotates credentials automatically.

Release scans are evidence, not a guarantee that every sensitive value can be recognized. Missing Git history, an unavailable scanner, an unresolved finding, or an unreviewed artifact prevents a clean release claim.
