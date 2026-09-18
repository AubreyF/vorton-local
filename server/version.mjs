import { readFileSync } from "node:fs";

// Capture at startup so a checkout edit cannot relabel an already running server.
const manifest = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
);
export const installedVersion = Object.freeze({ version: manifest.version });
