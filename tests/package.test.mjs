import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { sourceInventory } from "../scripts/source-inventory.mjs";

test("detached package verifies declared source and rejects substitution or traversal", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "vorton-package-"));
  const body = "Controlled source fixture";
  await writeFile(path.join(root, "README.md"), body);
  const manifest = {
    contract: "vorton-local.source-package.v1",
    files: [
      {
        path: "README.md",
        sha256: createHash("sha256").update(body).digest("hex"),
      },
    ],
  };
  await writeFile(
    path.join(root, "PACKAGE-MANIFEST.json"),
    JSON.stringify(manifest),
  );
  assert.deepEqual(await sourceInventory(root), ["README.md"]);
  await writeFile(path.join(root, "README.md"), "Altered");
  await assert.rejects(sourceInventory(root), /digest mismatch/);
  manifest.files[0].path = "../README.md";
  await writeFile(
    path.join(root, "PACKAGE-MANIFEST.json"),
    JSON.stringify(manifest),
  );
  await assert.rejects(sourceInventory(root), /Invalid package source path/);
});
