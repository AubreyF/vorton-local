import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import { check } from "../server/store.mjs";
export const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
export async function configuration(at = root) {
  let config = {};
  try {
    config = JSON.parse(
      await readFile(path.join(at, "local.config.json"), "utf8"),
    );
  } catch (e) {
    if (e.code !== "ENOENT") throw e;
  }
  check(
    Object.keys(config).every((k) =>
      ["port", "origin", "aubosPort"].includes(k),
    ),
    "Unknown local configuration field",
  );
  check(
    Number.isInteger(config.port ?? 47832) &&
      (config.port ?? 47832) >= 1024 &&
      (config.port ?? 47832) <= 65535,
    "Local port must be an integer from 1024 to 65535",
  );
  check(typeof (config.origin ?? "") === "string", "Origin must be a string");
  return {
    port: config.port ?? 47832,
    origin: config.origin ?? "",
    aubosPort: config.aubosPort ?? null,
  };
}
