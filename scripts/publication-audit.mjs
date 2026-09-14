import { readFile, lstat } from "node:fs/promises";
import path from "node:path";
import { root } from "./paths.mjs";
import { sourceInventory } from "./source-inventory.mjs";

const candidates = await sourceInventory(root);
const denied =
  /(^|\/)(state|authoritative|runs|worktrees|backups|\.runtime|\.attachment-[^/]*|node_modules|dist|\.git|\.next|\.wrangler|private|vault|sessions)(\/|$)|(^|\/)(auth\.json|local\.config\.json|\.env(?:\..*)?)$/;
const findings = [];
for (const file of candidates) {
  if (denied.test(file)) {
    findings.push({
      file,
      reason: "Private or generated path selected for publication",
    });
    continue;
  }
  const location = path.join(root, file);
  const stat = await lstat(location);
  if (stat.isSymbolicLink()) {
    findings.push({ file, reason: "Symlink is not publication source" });
    continue;
  }
  if (stat.size > 2_000_000) {
    findings.push({
      file,
      reason: "Unexpected large source file requires review",
    });
    continue;
  }
  const body = await readFile(location, "utf8");
  // Report file names and reasons only. Never echo a suspected credential.
  if (/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(body))
    findings.push({ file, reason: "Private key material" });
  if (
    /(?:sk-(?:proj-)?[A-Za-z0-9_-]{35,}|gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})/.test(
      body,
    )
  )
    findings.push({ file, reason: "Credential-like material" });
}
console.log(
  JSON.stringify(
    {
      candidateFiles: candidates.length,
      passed: findings.length === 0,
      findings,
      limits:
        "This path and pattern check complements gitleaks source and history scans. It does not recognize every possible secret or personal value.",
    },
    null,
    2,
  ),
);
if (findings.length) process.exitCode = 1;
