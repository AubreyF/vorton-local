import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { randomUUID } from "node:crypto";
import { Store } from "../server/store.mjs";
import { reviewPacket, importRecommendations } from "../server/review.mjs";
test("full council imports multiple role proposals atomically without accepting work", async () => {
  const store = new Store(
    await mkdtemp(path.join(os.tmpdir(), "vorton-council-")),
  );
  const state = await store.read("FreedOS");
  const packet = reviewPacket(state, "council");
  assert.equal(packet.profile, "FreedOS");
  assert.equal(packet.revision, 0);
  for (const role of ["CEO", "CTO", "CMO", "COO", "CFO"])
    assert.ok(packet.instruction.includes(`${role}:`));
  const bundle = {
    contract: "vorton-local.recommendations.v1",
    profile: "FreedOS",
    basedOnRevision: 0,
    recommendations: ["CEO", "CTO"].map((role) => ({
      role,
      kind: "task",
      rationale: "Controlled council review",
      proposal: { title: `Controlled ${role} proposal` },
    })),
  };
  const command = {
    action: "recommendations.import",
    requestId: randomUUID(),
    expectedRevision: 0,
    payload: bundle,
  };
  const result = await store.transact("FreedOS", command, (s) =>
    importRecommendations(s, bundle),
  );
  assert.equal(result.revision, 1);
  assert.equal(result.recommendations.length, 2);
  assert.equal(result.tasks.length, 0);
  assert.equal((await store.read("AubOS")).revision, 0);
  const invalid = {
    ...bundle,
    basedOnRevision: 1,
    recommendations: [
      ...bundle.recommendations,
      { ...bundle.recommendations[0], role: "council" },
    ],
  };
  await assert.rejects(
    store.transact(
      "FreedOS",
      {
        ...command,
        requestId: randomUUID(),
        expectedRevision: 1,
        payload: invalid,
      },
      (s) => importRecommendations(s, invalid),
    ),
    /role/,
  );
  assert.deepEqual(await store.read("FreedOS"), result);
});
test("manual review packets bind installation and evidence revision", async () => {
  const store = new Store(
    await mkdtemp(path.join(os.tmpdir(), "vorton-review-")),
  );
  const state = await store.read("AubOS");
  const packet = reviewPacket(state, "CTO");
  assert.equal(packet.profile, "AubOS");
  assert.equal(packet.revision, 0);
  assert.equal(packet.goals.length, 0);
  const bundle = {
    contract: "vorton-local.recommendations.v1",
    profile: "AubOS",
    basedOnRevision: 0,
    recommendations: [
      {
        role: "CTO",
        kind: "task",
        rationale: "Review fixture",
        proposal: { title: "Verify fixture" },
      },
    ],
  };
  let result = await store.transact(
    "AubOS",
    {
      action: "recommendations.import",
      requestId: randomUUID(),
      expectedRevision: 0,
      payload: bundle,
    },
    (s) => importRecommendations(s, bundle),
  );
  assert.equal(result.tasks.length, 0);
  assert.equal(result.recommendations.length, 1);
  assert.throws(() => importRecommendations(result, bundle), /out of date/);
  assert.throws(
    () => importRecommendations(result, { ...bundle, profile: "FreedOS" }),
    /does not match/,
  );
});
