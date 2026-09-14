# Local operation

## Core only

```sh
npm ci
npm run check
npm start
```

The default core address is `http://127.0.0.1:47832/local/AubOS/goals`. New stores are empty. Files are written only when a record changes. The server never listens on all interfaces.

For the complete destination handoff, use `START-HERE.md`. It preserves and attaches the existing working AubOS application instead of copying stale development data.

## Existing AubOS application

The private directory `AubOS/authoritative` contains the current destination application and records. It is excluded from Git and source packages. Configure an internal `aubosPort` only after attachment and the original application's build pass.

The combined host preserves original AubOS routes at `/`. The new core lives under `/local/`. This is a small shared host, not a rewrite of the original personal modules. The original app has its own response policy; the core's stricter browser policy does not claim to harden every legacy endpoint.

The ignored configuration accepts only:

```json
{
  "port": 47832,
  "origin": "https://your-existing-host.your-tailnet.ts.net",
  "aubosPort": 47833
}
```

Use the real existing origin and front-door port. Do not paste credentials into configuration. Omit `aubosPort` for a core-only host. No Tailscale changes are made by the package.

## Executive review

Command Bridge exports current goals and tasks for one selected perspective. Its prompt treats record text as untrusted evidence and asks for recommendations, not actions. Paste it into an explicitly chosen agent task. Import its JSON response through Command Bridge. Stale evidence revisions and foreign-installation responses fail closed.

The same boundary is available to the destination task:

```sh
node scripts/review.mjs --profile FreedOS --role CTO
node scripts/review.mjs --profile FreedOS --import /private/path/response.json
```

Review output contains selected private evidence. Do not put it in Git or logs. The CLI starts no model, factory, or schedule. Paseo integration is owned separately. The account reserve must be checked by the executing agent or scheduler, not inferred from this core.

## Persistence and contention

Each installation has one JSON snapshot containing current records, previous versions, recommendation dispositions, activity, and request identities. A directory lock serializes writers. The store writes a new file, flushes it, renames it, and flushes the directory. Expected revisions prevent stale overwrites. Exact retries cannot duplicate acceptance.

Locks are never stolen automatically. After a crash, confirm no process is writing the affected installation, inspect the current JSON and backup, and only then remove its empty `state/.writer` directory. Do not delete data or reset the store to clear a lock. Unexpected temporary files are retained for inspection.

This is a small single-host design. It is not a replacement for database transactions across multiple machines, an append-only secure audit service, or OS-level isolation. A host owner can edit files directly.

## Backup and recovery

`npm run backup` takes consistent snapshots of both core stores under their writer locks and saves a mode-600 file inside ignored `backups/`. The backup contains private data. It is not application-encrypted; protect the host and any off-machine copy appropriately.

`node scripts/backup.mjs --restore <file> --into <new-directory>` checks the digest and restores to an isolated nonexistent directory. It never overwrites a running store. Verify recovery there before any separately reviewed replacement. The digest detects changes, not malicious forgery by someone who can rewrite the backup.

Core backup excludes the original AubOS application, personal sources, credential stores, and Paseo. Keep the existing full personal-data backup and restore procedure.

## Updating

Keep `local.config.json`, `AubOS/state`, `AubOS/authoritative`, and `FreedOS/state` when updating code. Never unpack a new source archive over an authoritative installation without checking its file list. Build and test the new source before service cutover. Retain the prior code and verified data snapshots for rollback. No automatic updater or database migration runs here.
