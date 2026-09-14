import { readFile, lstat } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { root } from "./paths.mjs";
import { check } from "../server/store.mjs";

const manifest = JSON.parse(
  await readFile(path.join(root, "PACKAGE-MANIFEST.json"), "utf8"),
);
check(
  manifest.contract === "vorton-local.source-package.v1" &&
    manifest.privateDataIncluded === false &&
    Array.isArray(manifest.files),
  "Invalid source package manifest",
);
const seen = new Set();
for (const item of manifest.files) {
  check(
    typeof item.path === "string" &&
      !path.isAbsolute(item.path) &&
      !item.path.split(/[\\/]/).includes("..") &&
      !seen.has(item.path),
    "Unsafe or duplicate package path",
  );
  seen.add(item.path);
  const file = path.join(root, item.path);
  check((await lstat(file)).isFile(), "Package file missing or not regular");
  check(
    createHash("sha256")
      .update(await readFile(file))
      .digest("hex") === item.sha256,
    "Source package digest mismatch",
  );
}
console.log(
  JSON.stringify({
    verified: true,
    files: manifest.files.length,
    scope:
      "Manifest file integrity, not a signed release or destination readiness proof",
  }),
);
