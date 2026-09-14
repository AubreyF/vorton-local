import {
  readdir,
  lstat,
  readFile,
  mkdir,
  copyFile,
  chmod,
  rename,
} from "node:fs/promises";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { pathToFileURL } from "node:url";
import { root } from "./paths.mjs";
import { check, safeDirectory, atomicJson } from "../server/store.mjs";

const skipped = new Set([
  "node_modules",
  ".git",
  ".next",
  ".DS_Store",
  ".wrangler",
]);
export async function inventory(source, relative = "") {
  check(
    !(await lstat(path.join(source, relative))).isSymbolicLink(),
    "Source contains a symlink. Review its target before attachment.",
  );
  const result = [];
  for (const entry of await readdir(path.join(source, relative), {
    withFileTypes: true,
  })) {
    if (skipped.has(entry.name)) continue;
    const name = path.join(relative, entry.name);
    check(
      !entry.isSymbolicLink(),
      "Source contains a symlink. Review its target before attachment.",
    );
    if (entry.isDirectory()) result.push(...(await inventory(source, name)));
    else {
      check(entry.isFile(), "Source contains a nonregular file");
      const bytes = await readFile(path.join(source, name));
      result.push({
        path: name,
        bytes: bytes.length,
        sha256: createHash("sha256").update(bytes).digest("hex"),
        mode: (await lstat(path.join(source, name))).mode & 0o777,
      });
    }
  }
  return result.sort((a, b) =>
    a.path < b.path ? -1 : a.path > b.path ? 1 : 0,
  );
}
const digest = (value) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");
export async function attach(source, destinationRoot, apply = false) {
  source = path.resolve(source);
  destinationRoot = path.resolve(destinationRoot);
  check(
    source !== "/" && !source.startsWith("/dev/") && source !== "/dev",
    "Use a regular project directory, not a system root",
  );
  const target = path.join(destinationRoot, "AubOS/authoritative");
  check(
    !source.startsWith(destinationRoot + path.sep) &&
      !destinationRoot.startsWith(source + path.sep) &&
      source !== destinationRoot,
    "Source and destination must be separate directories",
  );
  const before = await inventory(source);
  check(
    before.some((f) => f.path === "dashboard/web/package.json"),
    "Source is not the expected complete AubOS application",
  );
  const summary = {
    contract: "vorton-local.aubos-attachment.v1",
    files: before.length,
    bytes: before.reduce((n, f) => n + f.bytes, 0),
    sourceDigest: digest(before),
    excluded: [...skipped],
    sourceChanged: false,
    applied: false,
  };
  try {
    await lstat(target);
    throw new Error("Target already exists. Nothing will be overwritten.");
  } catch (e) {
    if (e.code !== "ENOENT") throw e;
  }
  if (!apply) return summary;
  await safeDirectory(destinationRoot);
  await safeDirectory(path.join(destinationRoot, "AubOS"));
  const staging = path.join(
    destinationRoot,
    "AubOS",
    `.attachment-${randomUUID()}`,
  );
  await mkdir(staging, { mode: 0o700 });
  for (const file of before) {
    const targetFile = path.join(staging, file.path);
    await mkdir(path.dirname(targetFile), { recursive: true, mode: 0o700 });
    await copyFile(path.join(source, file.path), targetFile, 1);
    await chmod(targetFile, file.mode);
  }
  // Verify both sides. A changing source produces no adopted target. Keep failed
  // staging private for explicit inspection, never silently delete source data.
  check(
    digest(await inventory(source)) === summary.sourceDigest,
    "Source changed during attachment. Staged copy was not adopted.",
  );
  check(
    digest(await inventory(staging)) === summary.sourceDigest,
    "Copied files differ. Staged copy was not adopted.",
  );
  // Exclusive directory rename is serialized by a caller-owned target lock.
  const lock = path.join(destinationRoot, "AubOS/.attachment-lock");
  await mkdir(lock, { mode: 0o700 });
  try {
    try {
      await lstat(target);
      throw new Error("Target appeared during attachment");
    } catch (e) {
      if (e.code !== "ENOENT") throw e;
    }
    await rename(staging, target);
    await safeDirectory(path.join(destinationRoot, ".runtime"));
    await atomicJson(
      path.join(destinationRoot, ".runtime/aubos-attachment.json"),
      { ...summary, applied: true, verifiedAt: new Date().toISOString() },
    );
  } finally {
    const { rmdir } = await import("node:fs/promises");
    await rmdir(lock);
  }
  return { ...summary, applied: true };
}
if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const source = process.argv[process.argv.indexOf("--source") + 1];
  check(
    process.argv.includes("--source") && source,
    "Usage: node scripts/attach-aubos.mjs --source /absolute/current/AubOS [--apply]",
  );
  console.log(
    JSON.stringify(
      await attach(source, root, process.argv.includes("--apply")),
      null,
      2,
    ),
  );
}
