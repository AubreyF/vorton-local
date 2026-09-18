import { readFile } from "node:fs/promises";
const manifest = JSON.parse(
  await readFile(new URL("../package.json", import.meta.url), "utf8"),
);
const lock = JSON.parse(
  await readFile(new URL("../package-lock.json", import.meta.url), "utf8"),
);
if (
  !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z]+(?:\.[0-9A-Za-z]+)*)?$/.test(manifest.version)
)
  throw new Error("Invalid release version");
if (
  lock.version !== manifest.version ||
  lock.packages?.[""]?.version !== manifest.version
)
  throw new Error("Package and lockfile versions differ");
console.log(`Version consistent: ${manifest.version}`);
