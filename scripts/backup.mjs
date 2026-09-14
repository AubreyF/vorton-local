import { mkdir, lstat, readFile, readdir, rmdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createHash, randomUUID } from "node:crypto";
import {
  Store,
  profiles,
  check,
  safeDirectory,
  atomicJson,
} from "../server/store.mjs";
import { root } from "./paths.mjs";
const hash = (value) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");
export async function backup(at) {
  const store = new Store(at);
  const locks = [];
  try {
    for (const profile of profiles) {
      const lock = path.join(await store.directory(profile), ".writer");
      await mkdir(lock, { mode: 0o700 });
      locks.push(lock);
    }
    const states = await Promise.all(
      profiles.map((profile) => store.read(profile)),
    );
    const body = {
      contract: "vorton-local.core-backup.v1",
      createdAt: new Date().toISOString(),
      scope: "core-goals-tasks-only",
      states,
    };
    const directory = path.join(at, "backups");
    await safeDirectory(directory);
    const filename = path.join(
      directory,
      `core-${Date.now()}-${randomUUID()}.json`,
    );
    await atomicJson(filename, { ...body, sha256: hash(body) });
    return filename;
  } finally {
    for (const lock of locks.reverse()) await rmdir(lock);
  }
}
export async function restoreIsolated(filename, target) {
  check(
    !(await lstat(filename)).isSymbolicLink(),
    "Backup must not be a symlink",
  );
  const bundle = JSON.parse(await readFile(filename, "utf8"));
  const { sha256, ...body } = bundle;
  check(
    sha256 === hash(body) && body.contract === "vorton-local.core-backup.v1",
    "Backup hash or contract is invalid",
  );
  check(
    Array.isArray(body.states) &&
      body.states.length === 2 &&
      body.states.every((s, i) => s.profile === profiles[i]),
    "Backup installation set is invalid",
  );
  target = path.resolve(target);
  check(
    target !== "/" && !target.startsWith("/dev/") && target !== "/dev",
    "Invalid restore target",
  );
  try {
    await lstat(target);
    throw new Error(
      "Restore requires a new, nonexistent directory. No records were overwritten.",
    );
  } catch (e) {
    if (e.code !== "ENOENT") throw e;
  }
  await mkdir(target, { mode: 0o700 });
  const store = new Store(target);
  for (const state of body.states) {
    const directory = await store.directory(state.profile);
    await atomicJson(path.join(directory, "core.json"), state);
    check(
      hash(await store.read(state.profile)) === hash(state),
      "Restored state differs",
    );
  }
  return {
    restored: true,
    scope: body.scope,
    installations: profiles,
    sourceHash: sha256,
    productionMutated: false,
  };
}
if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  if (process.argv.includes("--restore")) {
    const filename = process.argv[process.argv.indexOf("--restore") + 1];
    const target = process.argv[process.argv.indexOf("--into") + 1];
    check(
      process.argv.includes("--into") && filename && target,
      "Restore requires --restore backup.json --into a-new-directory",
    );
    console.log(
      JSON.stringify(await restoreIsolated(filename, target), null, 2),
    );
  } else console.log(await backup(root));
}
