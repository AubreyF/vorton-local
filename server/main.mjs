import { fileURLToPath } from "node:url";
import path from "node:path";
import { createServer } from "./http.mjs";

const root = path.resolve(
  process.env.VORTON_ROOT || fileURLToPath(new URL("..", import.meta.url)),
);
const port = Number(process.env.VORTON_PORT || 47832);
if (!Number.isInteger(port) || port < 1024 || port > 65535)
  throw new Error("Invalid VORTON_PORT");
const { server } = createServer({
  root,
  port,
  origin: process.env.VORTON_ORIGIN || "",
});
server.listen(port, "127.0.0.1", () =>
  console.log(`Vorton Local: http://127.0.0.1:${port}/local/AubOS/goals`),
);
server.on("error", (error) => {
  console.error(`Startup failed: ${error.code || "unknown error"}`);
  process.exitCode = 1;
});
for (const signal of ["SIGTERM", "SIGINT"])
  process.on(signal, () => {
    server.close(() => process.exit(0));
  });
