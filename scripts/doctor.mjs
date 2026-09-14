import { access, readFile, lstat } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { root, configuration } from "./paths.mjs";
import { Store, profiles } from "../server/store.mjs";

const checks = [];
async function check(name, work, required = true) {
  try {
    const detail = await work();
    checks.push({ name, passed: true, required, detail });
  } catch (error) {
    checks.push({ name, passed: false, required, detail: error.message });
  }
}
await check("Node runtime", () => {
  const [major, minor] = process.versions.node.split(".").map(Number);
  if (major < 22 || (major === 22 && minor < 13))
    throw new Error("Node 22.13 or newer is required");
  return process.versions.node;
});
await check("Built local interface", () =>
  access(path.join(root, "dist/index.html")),
);
await check("Local configuration", async () => {
  const c = await configuration();
  return {
    port: c.port,
    originConfigured: Boolean(c.origin),
    aubosAppConfigured: c.aubosPort !== null,
  };
});
for (const profile of profiles)
  await check(`${profile} core state`, async () => {
    const store = new Store(root);
    const s = await store.read(profile);
    try {
      await lstat(path.join(root, profile, "state/.writer"));
      throw new Error("Writer lock exists. Confirm no writer before recovery.");
    } catch (e) {
      if (e.code !== "ENOENT") throw e;
    }
    return {
      revision: s.revision,
      goals: s.goals.length,
      tasks: s.tasks.length,
    };
  });
await check(
  "Destination agent executable",
  () => {
    const result = spawnSync("codex", ["--version"], {
      encoding: "utf8",
      timeout: 5000,
    });
    if (result.status !== 0)
      throw new Error(
        "Not found on PATH. The core still works; use the destination agent to review packets.",
      );
    return "Executable available. Authentication and account allowance are not inferred.";
  },
  false,
);
await check(
  "Preserved AubOS application",
  async () => {
    await access(
      path.join(root, "AubOS/authoritative/dashboard/web/package.json"),
    );
    return "Attached. Destination build, data freshness, and live behavior require separate acceptance.";
  },
  false,
);
const c = await configuration();
if (process.argv.includes("--live"))
  await check("HTTP readiness", async () => {
    const response = await fetch(`http://127.0.0.1:${c.port}/api/health`, {
      signal: AbortSignal.timeout(5000),
    });
    const status = await response.json();
    if (!response.ok || status.service !== "vorton-local")
      throw new Error("Wrong or unhealthy service");
    return status;
  });
if (process.argv.includes("--live") && c.aubosPort !== null)
  await check("Internal AubOS HTTP readiness", async () => {
    const response = await fetch(`http://127.0.0.1:${c.aubosPort}/`, {
      signal: AbortSignal.timeout(10000),
    });
    await response.body?.cancel();
    if (!response.ok)
      throw new Error(
        "The configured original AubOS application is not healthy",
      );
    return "Original application responds. Representative page and data freshness checks remain manual.";
  });
console.log(
  JSON.stringify(
    { ready: checks.every((c) => !c.required || c.passed), checks },
    null,
    2,
  ),
);
if (checks.some((c) => c.required && !c.passed)) process.exitCode = 1;
