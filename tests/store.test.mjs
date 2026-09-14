import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, symlink } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Store } from "../server/store.mjs";

async function fixture() {
  return new Store(await mkdtemp(path.join(os.tmpdir(), "vorton-store-")));
}
const cmd = (action, payload, expectedRevision = 0) => ({
  requestId: randomUUID(),
  expectedRevision,
  action,
  payload,
});
test("goals start empty, persist, and stay isolated", async () => {
  const store = await fixture();
  const state = await store.command(
    "AubOS",
    cmd("goal.create", { fields: { title: "Controlled goal" } }),
  );
  assert.equal(state.goals[0].title, "Controlled goal");
  assert.equal((await store.read("AubOS")).goals.length, 1);
  assert.equal((await store.read("FreedOS")).goals.length, 0);
  await assert.rejects(store.read("../AubOS"), /Unknown installation/);
  await assert.rejects(
    store.command(
      "FreedOS",
      cmd("task.create", {
        fields: { title: "Foreign task", goalId: state.goals[0].id },
      }),
    ),
    /does not belong/,
  );
});
test("expected revision, exact retry, and conflicting retry are enforced", async () => {
  const store = await fixture();
  const command = cmd("goal.create", { fields: { title: "Goal" } });
  await store.command("AubOS", command);
  await store.command("AubOS", command);
  assert.equal((await store.read("AubOS")).goals.length, 1);
  await assert.rejects(
    store.command("AubOS", {
      ...command,
      payload: { fields: { title: "Substitution" } },
    }),
    /reused/,
  );
  await assert.rejects(
    store.command("AubOS", cmd("goal.create", { fields: { title: "Stale" } })),
    /out of date/,
  );
});
test("recommendations do not change goals until accepted, and acceptance is atomic", async () => {
  const store = await fixture();
  let s = await store.command(
    "FreedOS",
    cmd("recommendation.create", {
      role: "CTO",
      kind: "goal",
      rationale: "Controlled evidence",
      proposal: { title: "Improve a fixture" },
    }),
  );
  assert.equal(s.goals.length, 0);
  s = await store.command(
    "FreedOS",
    cmd(
      "recommendation.resolve",
      { id: s.recommendations[0].id, decision: "accepted" },
      s.revision,
    ),
  );
  assert.equal(s.goals.length, 1);
  assert.equal(s.recommendations[0].resultId, s.goals[0].id);
  assert.equal(s.events.length, 2);
});
test("goal reviews bind exact version, preserve history, and reject cycles", async () => {
  const store = await fixture();
  let s = await store.command(
    "AubOS",
    cmd("goal.create", { fields: { title: "Original" } }),
  );
  const id = s.goals[0].id;
  s = await store.command(
    "AubOS",
    cmd(
      "recommendation.create",
      {
        role: "COO",
        kind: "goal-review",
        targetId: id,
        targetVersion: 1,
        rationale: "Review",
        proposal: { title: "Suggested" },
      },
      s.revision,
    ),
  );
  s = await store.command(
    "AubOS",
    cmd("goal.update", { id, fields: { title: "Owner edit" } }, s.revision),
  );
  assert.equal(s.goals[0].history[0].fields.title, "Original");
  await assert.rejects(
    store.command(
      "AubOS",
      cmd(
        "recommendation.resolve",
        { id: s.recommendations[0].id, decision: "accepted" },
        s.revision,
      ),
    ),
    /changed since/,
  );
  await assert.rejects(
    store.command(
      "AubOS",
      cmd(
        "goal.update",
        { id, fields: { title: "Cycle", parentId: id } },
        s.revision,
      ),
    ),
    /cycle/,
  );
});
test("concurrent writes cannot lose updates", async () => {
  const store = await fixture();
  const outcomes = await Promise.allSettled(
    [1, 2].map((i) =>
      store.command(
        "AubOS",
        cmd("goal.create", { fields: { title: `Goal ${i}` } }),
      ),
    ),
  );
  assert.equal(outcomes.filter((x) => x.status === "fulfilled").length, 1);
  const persisted = JSON.parse(
    await readFile(path.join(store.root, "AubOS/state/core.json"), "utf8"),
  );
  assert.equal(persisted.goals.length, 1);
  assert.equal(persisted.events.length, 1);
});
test("symlink profile paths fail closed", async () => {
  const store = await fixture();
  const outside = await mkdtemp(path.join(os.tmpdir(), "vorton-outside-"));
  await symlink(outside, path.join(store.root, "AubOS"));
  await assert.rejects(store.read("AubOS"), /symlink/);
});
test("validation rejects fields, nonfinite progress, and impossible dates", async () => {
  const store = await fixture();
  for (const fields of [
    { title: "X", progress: 101 },
    { title: "X", reviewOn: "2026-02-30" },
    { title: "X", execute: true },
  ]) {
    await assert.rejects(
      store.command("AubOS", cmd("goal.create", { fields })),
    );
  }
  assert.equal((await store.read("AubOS")).revision, 0);
});
