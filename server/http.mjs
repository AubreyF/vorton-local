import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { Store, check, Fault, profiles } from "./store.mjs";
import { reviewPacket, importRecommendations } from "./review.mjs";

const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".woff2": "font/woff2",
  ".svg": "image/svg+xml",
};
export function publicState(state) {
  const { requests, ...safe } = state;
  return safe;
}
export function createServer({
  root,
  port = 47832,
  origin = "",
  dist = path.join(root, "dist"),
  aubosPort = null,
}) {
  const store = new Store(root);
  const session = randomBytes(32).toString("hex");
  const allowed = new Set([
    `http://127.0.0.1:${port}`,
    `http://localhost:${port}`,
  ]);
  if (origin) {
    const parsed = new URL(origin);
    check(
      parsed.origin === origin && ["https:", "http:"].includes(parsed.protocol),
      "VORTON_ORIGIN must be an exact origin without a path",
    );
    allowed.add(origin);
  }
  const hosts = new Set([...allowed].map((v) => new URL(v).host));
  if (aubosPort !== null)
    check(
      Number.isInteger(aubosPort) &&
        aubosPort >= 1024 &&
        aubosPort <= 65535 &&
        aubosPort !== port,
      "Invalid internal AubOS port",
    );
  const json = (response, status, value) => {
    response.writeHead(status, {
      "Content-Type": "application/json; charset=utf-8",
    });
    response.end(JSON.stringify(value));
  };
  const server = http.createServer(async (request, response) => {
    response.setHeader("Cache-Control", "no-store");
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader("Referrer-Policy", "no-referrer");
    response.setHeader("X-Frame-Options", "DENY");
    response.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'; object-src 'none'",
    );
    try {
      check(hosts.has(request.headers.host), "Host is not configured", 403);
      if (request.headers.origin)
        check(
          allowed.has(request.headers.origin),
          "Origin is not configured",
          403,
        );
      check(
        !["cross-site"].includes(request.headers["sec-fetch-site"]),
        "Cross-site request denied",
        403,
      );
      const url = new URL(request.url, `http://${request.headers.host}`);
      if (request.method === "GET" && url.pathname === "/api/health")
        return json(response, 200, {
          service: "vorton-local",
          status: "ready",
          factory: "not-implemented",
          scheduler: "external-paseo",
        });
      if (request.method === "GET" && url.pathname === "/api/session")
        return json(response, 200, {
          token: session,
          profiles,
          aubosAppConfigured: aubosPort !== null,
        });
      const match = url.pathname.match(
        /^\/api\/(AubOS|FreedOS)\/(state|command|review|export)$/,
      );
      if (match) {
        const [, profile, operation] = match;
        if (request.method === "GET" && operation === "state")
          return json(response, 200, publicState(await store.read(profile)));
        if (request.method === "GET" && operation === "review")
          return json(
            response,
            200,
            reviewPacket(
              await store.read(profile),
              url.searchParams.get("role"),
            ),
          );
        if (request.method === "GET" && operation === "export") {
          response.setHeader(
            "Content-Disposition",
            `attachment; filename="${profile}-goals-tasks.json"`,
          );
          return json(response, 200, publicState(await store.read(profile)));
        }
        if (request.method === "POST" && operation === "command") {
          check(
            allowed.has(request.headers.origin),
            "A same-origin request is required",
            403,
          );
          const token = Buffer.from(request.headers["x-vorton-session"] ?? "");
          const expected = Buffer.from(session);
          check(
            token.length === expected.length &&
              timingSafeEqual(token, expected),
            "Session expired. Reload this page.",
            403,
          );
          check(
            request.headers["content-type"]?.split(";")[0] ===
              "application/json",
            "Expected JSON",
            415,
          );
          let bytes = 0;
          const chunks = [];
          for await (const chunk of request) {
            bytes += chunk.length;
            check(bytes <= 131072, "Request is too large", 413);
            chunks.push(chunk);
          }
          let command;
          try {
            command = JSON.parse(Buffer.concat(chunks).toString("utf8"));
          } catch {
            throw new Fault(400, "Invalid JSON");
          }
          const updated =
            command.action === "recommendations.import"
              ? await store.transact(profile, command, (state) =>
                  importRecommendations(state, command.payload),
                )
              : await store.command(profile, command);
          return json(response, 200, publicState(updated));
        }
        throw new Fault(405, "Method not allowed");
      }
      if (
        aubosPort !== null &&
        !url.pathname.startsWith("/local/") &&
        !/^\/api\/(AubOS|FreedOS)(\/|$)/.test(url.pathname)
      ) {
        // Preserve the complete existing application at its original routes. This is
        // a fixed loopback upstream, never a URL or file path chosen by a browser.
        if (!["GET", "HEAD"].includes(request.method))
          check(
            allowed.has(request.headers.origin),
            "A same-origin request is required",
            403,
          );
        const upstream = http.request(
          {
            hostname: "127.0.0.1",
            port: aubosPort,
            path: request.url,
            method: request.method,
            headers: request.headers,
          },
          (incoming) => {
            // The original application owns its script policy. Do not impose the core
            // SPA's stricter policy on Next/Vinext inline hydration scripts.
            response.removeHeader("Content-Security-Policy");
            const headers = {
              ...incoming.headers,
              "cache-control": "no-store",
              "x-frame-options": "DENY",
            };
            if (headers.location?.startsWith(`http://127.0.0.1:${aubosPort}/`))
              headers.location = headers.location.slice(
                `http://127.0.0.1:${aubosPort}`.length,
              );
            response.writeHead(incoming.statusCode || 502, headers);
            incoming.pipe(response);
          },
        );
        upstream.on("error", () => {
          if (!response.headersSent)
            json(response, 502, {
              error:
                "The internal AubOS application is not running. Local core records remain available at /local/AubOS/goals.",
            });
          else response.end();
        });
        upstream.setTimeout(15000, () => upstream.destroy());
        request.on("aborted", () => upstream.destroy());
        request.pipe(upstream);
        return;
      }
      if (url.pathname.startsWith("/api/"))
        throw new Fault(404, "Unknown route");
      check(
        request.method === "GET" || request.method === "HEAD",
        "Method not allowed",
        405,
      );
      if (url.pathname === "/") {
        response.writeHead(302, { Location: "/local/AubOS/goals" });
        return response.end();
      }
      if (url.pathname === "/favicon.ico") {
        response.writeHead(204);
        return response.end();
      }
      check(url.pathname.startsWith("/local/"), "Unknown route", 404);
      const relative = decodeURIComponent(url.pathname.slice("/local/".length));
      const asset = relative.startsWith("assets/") ? relative : "index.html";
      const target = path.resolve(dist, asset);
      check(
        target.startsWith(path.resolve(dist) + path.sep) &&
          !relative.includes(".."),
        "Invalid asset path",
        404,
      );
      let data;
      try {
        data = await readFile(target);
      } catch {
        throw new Fault(404, "Application asset not found. Run npm run build.");
      }
      response.writeHead(200, {
        "Content-Type":
          mime[path.extname(target)] ?? "application/octet-stream",
      });
      return response.end(request.method === "HEAD" ? undefined : data);
    } catch (error) {
      if (!response.headersSent)
        json(response, error instanceof Fault ? error.status : 500, {
          error:
            error instanceof Fault
              ? error.message
              : "Operation failed. Local records were not reset.",
        });
      else response.end();
    }
  });
  server.requestTimeout = 15000;
  server.headersTimeout = 10000;
  return { server, store, allowed, hosts };
}
