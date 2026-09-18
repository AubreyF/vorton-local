import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Store } from "../server/store.mjs";
import { seedDemo } from "../scripts/demo-seed.mjs";
import { createCoreServer as createServer } from "../server/core-http.mjs";

async function fixture(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), "vorton-demo-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  return root;
}
test("demo fixtures populate only their own store and cannot reset existing work", async (t) => {
  const root = await fixture(t);
  const store = new Store(root);
  assert.equal((await store.read("LastResort")).goals.length, 0);
  const state = await seedDemo(root);
  assert.equal(state.goals.length, 3);
  assert.equal(state.tasks.length, 5);
  assert.equal(state.councilSessions.length, 1);
  assert.equal(state.recommendations.length, 1);
  assert.equal(state.council.identities.length, 4);
  assert.ok(state.council.identities.every((x) => x.fictional));
  assert.ok(
    state.tasks.every((task) =>
      state.goals.some((goal) => goal.id === task.goalId),
    ),
  );
  assert.deepEqual(await readdir(root), ["LastResort"]);
  const before = await readFile(
    path.join(root, "LastResort/state/core.json"),
    "utf8",
  );
  await assert.rejects(seedDemo(root), /already contains work/);
  assert.equal(
    await readFile(path.join(root, "LastResort/state/core.json"), "utf8"),
    before,
  );
});
test("demo server denies private profiles, persists changes, and reports installed version", async (t) => {
  const root = await fixture(t);
  await seedDemo(root);
  const app = createServer({
    root,
    port: 0,
    enabledProfiles: ["LastResort"],
    defaultPath: "/lastresort/bridge",
  });
  await new Promise((resolve) => app.server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => app.server.close(resolve)));
  const base = `http://127.0.0.1:${app.server.address().port}`;
  app.hosts.add(new URL(base).host);
  app.allowed.add(base);
  assert.equal(
    (await fetch(base, { redirect: "manual" })).headers.get("location"),
    "/lastresort/bridge",
  );
  for (const route of [
    "/lastresort",
    "/lastresort/",
    "/lastresort/command",
    "/lastresort/command-bridge",
    "/LastResort",
  ]) {
    for (const method of ["GET", "HEAD"]) {
      const redirected = await fetch(base + route + "?filter=Active", {
        method,
        redirect: "manual",
      });
      assert.equal(redirected.status, 308);
      assert.equal(
        redirected.headers.get("location"),
        "/lastresort/bridge?filter=Active",
      );
    }
  }
  for (const profile of ["aubos", "freedos", "unknown"])
    assert.equal((await fetch(`${base}/api/${profile}/state`)).status, 404);
  const session = await (await fetch(`${base}/api/session`)).json();
  assert.deepEqual(session.profiles, ["LastResort"]);
  const response = await fetch(`${base}/api/lastresort/command`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: base,
      "X-Vorton-Session": session.token,
    },
    body: JSON.stringify({
      requestId: randomUUID(),
      expectedRevision: 2,
      action: "goal.create",
      payload: { fields: { title: "Controlled guest request" } },
    }),
  });
  assert.equal(response.status, 200);
  assert.equal(
    (await (await fetch(`${base}/api/lastresort/state`)).json()).goals.at(-1)
      .title,
    "Controlled guest request",
  );
  const version = await (await fetch(`${base}/api/version`)).json();
  const manifest = JSON.parse(
    await readFile(new URL("../package.json", import.meta.url), "utf8"),
  );
  assert.equal(version.version, manifest.version);
  assert.deepEqual(await readdir(root), ["LastResort"]);
});
