import { spawnSync } from "node:child_process";
import { readFile, mkdir, mkdtemp, copyFile, lstat } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { root } from "./paths.mjs";
import { atomicJson } from "../server/store.mjs";
import { sourceInventory } from "./source-inventory.mjs";

const audit = spawnSync(process.execPath, ["scripts/publication-audit.mjs"], {
  cwd: root,
  stdio: "inherit",
});
if (audit.status !== 0) throw new Error("Publication path audit failed");
const inventory = await sourceInventory(root);
const revision = spawnSync("git", ["rev-parse", "HEAD"], {
  cwd: root,
  encoding: "utf8",
});
await mkdir(path.join(root, "output"), { recursive: true, mode: 0o700 });
const parent = await mkdtemp(path.join(root, "output", "delivery-"));
const destination = path.join(parent, "vorton");
await mkdir(destination, { mode: 0o700 });
const files = [];
for (const file of inventory) {
  const source = path.join(root, file);
  if (!(await lstat(source)).isFile())
    throw new Error("Package accepts regular source files only");
  const target = path.join(destination, file);
  await mkdir(path.dirname(target), { recursive: true });
  await copyFile(source, target, 1);
  files.push({
    path: file,
    sha256: createHash("sha256")
      .update(await readFile(target))
      .digest("hex"),
  });
}
await atomicJson(path.join(destination, "PACKAGE-MANIFEST.json"), {
  contract: "vorton-local.source-package.v1",
  sourceCommit: revision.status === 0 ? revision.stdout.trim() : null,
  createdAt: new Date().toISOString(),
  privateDataIncluded: false,
  dependenciesIncluded: false,
  files,
});
console.log(
  JSON.stringify(
    {
      directory: destination,
      sourceFiles: files.length,
      privateDataIncluded: false,
      next: "Run a redacted source scan against this directory before handing it off. Dependencies and the interface build are prepared on the destination.",
    },
    null,
    2,
  ),
);
