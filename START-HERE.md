# Destination continuity prompt

Paste the following prompt into the destination agent task, with this Vorton directory as its workspace. Read the whole prompt before changing anything.

---

You are taking custody of Vorton Local on the owner's authoritative MacBook Pro. The owner authorized this local setup. This is a one-owner private-tailnet application with AubOS and FreedOS inside one directory, normally `~/dev/Vorton`. `/dev` is the macOS device directory and is never a project target.

## Outcome

Get the local core and the existing authoritative AubOS application running from this single directory. Preserve the current personal records, original modules, themes, and controls. Make Goals, Tasks, executive recommendations, and installation switching usable. Do not replace the authoritative records with any development-machine snapshot. The package intentionally contains no personal data or credentials.

The owner already solved HTTPS through Tailscale. Do not change Tailscale, create a login service, use Supabase, create cloud infrastructure, or introduce API key dependencies.

An existing destination task owns the Paseo resource-consumption framework and scheduler. Do no factory-specific work, issue admission, factory runner, or competing scheduling here. Keep the independent Paseo task intact. Vorton Local exports and imports scoped executive review packets but starts no model calls or schedules. Reuse the authenticated destination agent to perform an explicitly requested review.

Keep at least 50 percent of the owner's weekly account allowance remaining. Check actual account usage with an available authenticated status mechanism before substantial agent work. Do not infer allowance from a cached local file, redeem credits, or activate unattended work to bypass this boundary.

## First inspection

1. Read `AGENTS.md`, `BUILD-PLAN.md`, `README.md`, `docs/OPERATIONS.md`, and `docs/VALIDATION.md`. If this is a Git checkout, check its status without resetting anything. A transfer package intentionally has no Git directory. If `PACKAGE-MANIFEST.json` exists, run `node scripts/verify-package.mjs` before installing dependencies.
2. Identify the current authoritative AubOS root on this Mac. It is a regular directory under the owner's home `dev` directory, not a system path. Locate its `dashboard/web/package.json`. Do not print personal record contents, credentials, tokens, or private logs into the task.
3. Discover the current AubOS process, its working directory, how it is supervised, its listening port, the existing tailnet HTTPS origin, and any writers or schedules using that root. Read configuration without exposing credentials. Confirm which task owns ongoing Paseo scheduling. Do not blindly stop a process by port or duplicate a writer.
4. Note which service and directory must be restored if cutover fails. Preserve the old directory and service definition. Never delete the old source as part of this setup.

## Prepare the single directory

5. Use Node 22.13 or newer. Run `npm ci`, `npm run check`, and `npm run audit:publication` in Vorton. The core has no npm lifecycle script that reads personal data. Do not install dependencies inside a stale source copy.
6. Inspect `scripts/attach-aubos.mjs`. It copies the destination's authoritative AubOS root into `AubOS/authoritative`, excludes dependencies and selected tool caches, preserves ordinary source/data bytes and file modes, verifies both source and copy hashes, refuses symlinks, and refuses an existing target. It never modifies the source. It does not move external aliases or tell other processes which directory is authoritative.
7. Run its default dry run with `--source` pointing to the actual current AubOS directory. If symlinks, unusual files, changed startup scripts, or an existing target block it, inspect the exact conflict. Do not weaken the check, follow unknown links, merge into an existing target, or discard current data. Ask the owner only for a real choice you cannot resolve safely.
8. Coordinate a quiet transfer interval with all current AubOS writers. Pause only identified relevant writers through their existing controls. Run the attachment with `--apply`. Verify its report and retained source. If the source changes during copying, nothing is adopted; resolve the writer and retry using a fresh reviewed staging path. Do not erase failed staging or original data without review.
9. Build the attached AubOS application from `AubOS/authoritative/dashboard/web` using its own documented commands and source instructions. Its existing prebuild scripts regenerate private bundles inside the ignored authoritative directory. Inspect errors rather than fabricating missing records. Restore any required external alias only after checking its target and collisions. No personal data goes into Git.

## Start and verify

10. Create ignored `local.config.json` with `port`, `origin`, and `aubosPort`. `port` is the loopback port already targeted by Tailscale. `origin` is the exact existing HTTPS origin without a trailing slash. `aubosPort` is a different unused internal loopback port. For example, if the existing front door is 47831, use 47831 for `port` and 47833 for `aubosPort`. Do not change the Tailscale mapping.
11. Confirm the attached app still uses the reviewed Vinext start command. `scripts/host.mjs` invokes its installed CLI with the configured internal port without modifying AubOS source. An unfamiliar runtime is a stop for review, not permission to rewrite the personal application.
12. Stop the identified old serving process through its known supervisor only after the copied application is built and the rollback path is recorded. Run `npm start` from Vorton. This supervises the original AubOS process as a child and serves the new core on the configured loopback front door. If a child fails, the combined host stops. It never kills a preexisting process by port.
13. Run `npm run doctor -- --live`. The original AubOS application should remain at `/` and its existing routes. The new local views are `/local/AubOS/goals`, `/local/AubOS/tasks`, `/local/AubOS/command`, and corresponding FreedOS routes. The workspace menu contains a link to the full original AubOS application. Original AubOS pages retain their existing navigation; do not claim that every original module was rewritten into the new shell.
14. Check the existing tailnet HTTPS URL from the owner's browser. Check representative real AubOS pages for freshness without copying their private contents into reports. Verify the new core loads, the dropdown has no decorative shadow or second border, all six themes remain readable, and phone navigation works. Test persistence using an explicitly labeled disposable record only with owner consent, or use the controlled test harness outside authoritative state.
15. Run `npm run backup` and rehearse restoration into a new isolated directory with `node scripts/backup.mjs --restore <backup> --into <new-directory>`. This protects only the new core records. Verify the owner's existing whole-AubOS backup separately; do not call the core backup a backup of the entire personal installation.
16. Install a macOS LaunchAgent only after the foreground checks pass. `node scripts/service.mjs` prints a plan. `node scripts/service.mjs --install` installs a user agent with explicit paths and logs. It refuses an existing plist. Review first, and preserve the old service definition for rollback. Verify restart and logout/login expectations. FileVault and full-disk backup remain owner-controlled host responsibilities.

## Authority and completion

The new Goals store starts empty. It does not replace AubOS strategic CSV/Markdown registers or establish a second writer for the same existing goals. Propose any reconciliation as a separate explicit change. Executive responses import as recommendations only. Acceptance records the owner's choice; it grants no spending, outreach, deployment, factory execution, destructive action, or permission change.

The app trusts the one-owner private host. It is not a public service and is not a sandbox between shell processes. Do not give a future coding worker personal AubOS filesystem access. Do not activate any factory or schedule here.

Record the installed commit or package digest, Node version, paths, service name, ports, origin, verification results, old-service rollback command, and remaining blockers in ignored `.runtime/destination-acceptance.md`. Do not include secrets or personal values. Confirm the old root is retained but no longer has active writers before redirecting any schedule. Schedule changes belong to their existing owner task and require explicit coordination, not mass path replacement.

If anything fails, stop the new host, restart the known old service against its untouched authoritative root, and report the exact blocker. Do not claim destination readiness from this package's development-machine tests.

---
