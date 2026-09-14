import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import http from "node:http";
import { createServer } from "../server/http.mjs";

async function fixture(t, options = {}) {
  const app = createServer({
    root: await mkdtemp(path.join(os.tmpdir(), "vorton-http-")),
    port: 0,
    ...options,
  });
  await new Promise((resolve) => app.server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${app.server.address().port}`;
  app.hosts.add(new URL(base).host);
  app.allowed.add(base);
  t.after(() => new Promise((resolve) => app.server.close(resolve)));
  return { ...app, base };
}
test("HTTP denies foreign origins, forged session, and unknown hosts", async (t) => {
  const { base } = await fixture(t);
  assert.equal(
    (
      await fetch(base + "/api/session", {
        headers: { Origin: "https://evil.invalid" },
      })
    ).status,
    403,
  );
  const foreignHostStatus = await new Promise((resolve, reject) => {
    http
      .get(
        base + "/api/session",
        { headers: { Host: "evil.invalid" } },
        (response) => {
          response.resume();
          resolve(response.statusCode);
        },
      )
      .on("error", reject);
  });
  assert.equal(foreignHostStatus, 403);
  assert.equal(
    (
      await fetch(base + "/api/AubOS/command", {
        method: "POST",
        headers: {
          Origin: base,
          "Content-Type": "application/json",
          "X-Vorton-Session": "forged",
        },
        body: "{}",
      })
    ).status,
    403,
  );
});
test("combined front door preserves original routes and rejects foreign mutations", async (t) => {
  let calls = 0;
  const upstream = http.createServer((request, response) => {
    calls++;
    response.setHeader(
      "Content-Security-Policy",
      "script-src 'self' 'unsafe-inline'",
    );
    response.end(JSON.stringify({ path: request.url, method: request.method }));
  });
  await new Promise((resolve) => upstream.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => upstream.close(resolve)));
  const { base } = await fixture(t, { aubosPort: upstream.address().port });
  const original = await fetch(base + "/existing/module?view=two");
  assert.equal(original.status, 200);
  assert.deepEqual(await original.json(), {
    path: "/existing/module?view=two",
    method: "GET",
  });
  assert.equal(
    original.headers.get("content-security-policy"),
    "script-src 'self' 'unsafe-inline'",
  );
  assert.equal(original.headers.get("cache-control"), "no-store");
  const rejected = await fetch(base + "/api/original-edit", {
    method: "POST",
    body: "{}",
  });
  assert.equal(rejected.status, 403);
  assert.equal(calls, 1);
  assert.equal((await fetch(base + "/api/FreedOS/state")).status, 200);
  assert.equal(calls, 1, "core profile data never goes to the original app");
  const accepted = await fetch(base + "/api/original-edit", {
    method: "POST",
    headers: { Origin: base },
    body: "{}",
  });
  assert.deepEqual(await accepted.json(), {
    path: "/api/original-edit",
    method: "POST",
  });
});
test("HTTP writes only selected state and exposes no idempotence internals", async (t) => {
  const { base } = await fixture(t);
  const { token } = await (await fetch(base + "/api/session")).json();
  const response = await fetch(base + "/api/AubOS/command", {
    method: "POST",
    headers: {
      Origin: base,
      "Content-Type": "application/json",
      "X-Vorton-Session": token,
    },
    body: JSON.stringify({
      requestId: randomUUID(),
      expectedRevision: 0,
      action: "goal.create",
      payload: { fields: { title: "Synthetic goal" } },
    }),
  });
  assert.equal(response.status, 200);
  const state = await response.json();
  assert.equal(state.requests, undefined);
  assert.equal(state.profile, "AubOS");
  const other = await (await fetch(base + "/api/FreedOS/state")).json();
  assert.equal(other.goals.length, 0);
  assert.equal((await fetch(base + "/api/Other/state")).status, 404);
});
