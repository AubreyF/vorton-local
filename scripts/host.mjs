import { spawn } from "node:child_process";
import path from "node:path";
import net from "node:net";
import { readFile } from "node:fs/promises";
import { root, configuration } from "./paths.mjs";
import { createServer } from "../server/http.mjs";

const config = await configuration();
const { server } = createServer({ root, ...config });
let child;
let stopping = false;
async function unusedPort(port) {
  const probe = net.createServer();
  await new Promise((resolve, reject) => {
    probe.once("error", reject);
    probe.listen(port, "127.0.0.1", resolve);
  });
  await new Promise((resolve) => probe.close(resolve));
}
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  process.exitCode = code;
  server.close();
  if (child?.pid) {
    // The child owns a private process group; do not signal an unrelated service.
    try {
      process.kill(-child.pid, "SIGTERM");
    } catch {
      /* Already exited. */
    }
  }
  // Let accepted requests finish their atomic snapshot writes before exit.
  setTimeout(() => process.exit(code), 10_000).unref();
}
try {
  await unusedPort(config.port);
  if (config.aubosPort !== null) {
    await unusedPort(config.aubosPort);
    const app = path.join(root, "AubOS/authoritative/dashboard/web");
    const pkg = JSON.parse(
      await readFile(path.join(app, "package.json"), "utf8"),
    );
    if (
      pkg.scripts?.start !==
      "WRANGLER_LOG_PATH=.wrangler/wrangler.log vinext start --hostname 127.0.0.1 --port 47831"
    )
      throw new Error(
        "The current AubOS start script differs from the reviewed source. Have the destination agent review it before enabling the companion.",
      );
    const runtimeRoot = path.join(app, "node_modules/vinext");
    const runtimePackage = JSON.parse(
      await readFile(path.join(runtimeRoot, "package.json"), "utf8"),
    );
    const executable =
      typeof runtimePackage.bin === "string"
        ? runtimePackage.bin
        : runtimePackage.bin?.vinext;
    if (!executable)
      throw new Error("Installed AubOS runtime exposes no reviewed CLI");
    const bin = path.resolve(runtimeRoot, executable);
    if (!bin.startsWith(runtimeRoot + path.sep))
      throw new Error("Invalid AubOS runtime executable path");
    // Supply the internal port to the existing runtime, without rewriting any
    // AubOS application file or the owner's existing Tailscale configuration.
    child = spawn(
      process.execPath,
      [
        bin,
        "start",
        "--hostname",
        "127.0.0.1",
        "--port",
        String(config.aubosPort),
      ],
      {
        cwd: app,
        stdio: "inherit",
        detached: true,
        env: { ...process.env, WRANGLER_LOG_PATH: ".wrangler/wrangler.log" },
      },
    );
    child.on("error", () => stop(1));
    child.on("exit", () => {
      if (!stopping) {
        console.error(
          "Internal AubOS stopped. Stopping the combined host for supervised recovery.",
        );
        stop(1);
      }
    });
  }
  server.listen(config.port, "127.0.0.1", () =>
    console.log(
      `Vorton Local ready at http://127.0.0.1:${config.port}/local/AubOS/goals`,
    ),
  );
  server.on("error", () => stop(1));
  for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => stop());
} catch (error) {
  console.error(error.message);
  stop(1);
}
