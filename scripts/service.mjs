import { mkdir, open, lstat } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { root } from "./paths.mjs";
import { check, safeDirectory } from "../server/store.mjs";

check(
  process.platform === "darwin",
  "This user service installer is for macOS only",
);
const label = "com.vorton.local";
const directory = path.join(os.homedir(), "Library/LaunchAgents");
const file = path.join(directory, `${label}.plist`);
const xml = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
const plist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>Label</key><string>${label}</string>
<key>ProgramArguments</key><array><string>${xml(process.execPath)}</string><string>${xml(path.join(root, "scripts/host.mjs"))}</string></array>
<key>WorkingDirectory</key><string>${xml(root)}</string>
<key>RunAtLoad</key><true/><key>KeepAlive</key><true/>
<key>ThrottleInterval</key><integer>15</integer>
<key>EnvironmentVariables</key><dict><key>PATH</key><string>${xml([path.dirname(process.execPath), "/opt/homebrew/bin", "/usr/local/bin", "/usr/bin", "/bin"].join(":"))}</string></dict>
<key>StandardOutPath</key><string>${xml(path.join(root, ".runtime/host.stdout.log"))}</string>
<key>StandardErrorPath</key><string>${xml(path.join(root, ".runtime/host.stderr.log"))}</string>
</dict></plist>
`;
console.log(
  JSON.stringify(
    {
      label,
      file,
      workingDirectory: root,
      node: process.execPath,
      automaticStart: "At user login, not before login",
      installRequested: process.argv.includes("--install"),
    },
    null,
    2,
  ),
);
if (process.argv.includes("--install")) {
  check(
    !(await lstat(root)).isSymbolicLink(),
    "Install from the final regular package directory",
  );
  await safeDirectory(path.join(root, ".runtime"));
  await mkdir(directory, { recursive: true });
  const handle = await open(file, "wx", 0o600);
  try {
    await handle.writeFile(plist);
    await handle.sync();
  } finally {
    await handle.close();
  }
  const result = spawnSync(
    "/bin/launchctl",
    ["bootstrap", `gui/${process.getuid()}`, file],
    { encoding: "utf8" },
  );
  if (result.status !== 0)
    throw new Error(
      `Service could not bootstrap. Inspect the new plist at ${file}; no existing plist was replaced.`,
    );
  console.log(
    "User service installed. Verify HTTP readiness and inspect restart behavior before declaring acceptance.",
  );
}
