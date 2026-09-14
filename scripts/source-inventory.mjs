import { spawnSync } from "node:child_process";
import { lstat, readFile } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";

export async function sourceInventory(root) {
  let hasGit = false;
  try {
    hasGit = (await lstat(path.join(root, ".git"))).isDirectory();
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  if (hasGit) {
    const result = spawnSync(
      "git",
      ["ls-files", "-z", "--cached", "--others", "--exclude-standard"],
      { cwd: root, encoding: "utf8" },
    );
    if (result.status !== 0) throw new Error("Git source inventory failed");
    return [...new Set(result.stdout.split("\0").filter(Boolean))].sort();
  }
  // A transfer package deliberately omits Git history and private runtime data.
  // Verify its exact declared source rather than accidentally using a parent repo.
  const manifest = JSON.parse(
    await readFile(path.join(root, "PACKAGE-MANIFEST.json"), "utf8"),
  );
  if (
    manifest.contract !== "vorton-local.source-package.v1" ||
    !Array.isArray(manifest.files) ||
    !manifest.files.length
  )
    throw new Error("A Git checkout or valid source package is required");
  const seen = new Set();
  for (const file of manifest.files) {
    if (
      typeof file.path !== "string" ||
      path.isAbsolute(file.path) ||
      file.path
        .split(/[\\/]/)
        .some((part) => !part || part === ".." || part === ".") ||
      seen.has(file.path)
    )
      throw new Error("Invalid package source path");
    seen.add(file.path);
    const location = path.join(root, file.path);
    if (!(await lstat(location)).isFile())
      throw new Error("Package source must be a regular file");
    if (
      createHash("sha256")
        .update(await readFile(location))
        .digest("hex") !== file.sha256
    )
      throw new Error(`Package source digest mismatch: ${file.path}`);
  }
  return [...seen].sort();
}
