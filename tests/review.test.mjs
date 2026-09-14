import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { randomUUID } from "node:crypto";
import { Store } from "../server/store.mjs";
import { reviewPacket, importRecommendations } from "../server/review.mjs";
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
