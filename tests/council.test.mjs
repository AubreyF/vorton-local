import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Store } from "../server/store.mjs";
import { councilPacket, publishCouncil } from "../server/council.mjs";

async function fixture() {
  const store = new Store(await mkdtemp(path.join(os.tmpdir(), "vorton-council-")));
  const packet = councilPacket(await store.read("FreedOS"));
  const input = {
    contract: packet.contract, sessionId: packet.sessionId,
    evidenceDigest: packet.evidenceDigest, summary: "Controlled review",
    bundle: { contract: "vorton-local.recommendations.v1", profile: "FreedOS", basedOnRevision: 0, recommendations: [] },
  };
  const publish = () => store.transact("FreedOS", {
    action: "council.publish", requestId: input.sessionId,
    expectedRevision: input.bundle.basedOnRevision, payload: input,
  }, (state) => publishCouncil(state, input));
  return { store, input, publish };
}

test("council publishes durable receipts and exact retries are idempotent", async () => {
  const { store, publish } = await fixture();
  await publish();
  const state = await publish();
  assert.equal(state.revision, 1);
  assert.equal(state.councilSessions.length, 1);
  assert.equal((await store.read("FreedOS")).councilSessions[0].summary, "Controlled review");
  assert.equal((await store.read("AubOS")).councilSessions.length, 0);
});

test("failed recommendation validation rolls back both recommendations and receipt", async () => {
  const { store, input, publish } = await fixture();
  input.bundle.recommendations = [
    { role: "COO", kind: "task", rationale: "Controlled evidence", proposal: { title: "Controlled task" } },
    { role: "invalid" },
  ];
  await assert.rejects(publish());
  const state = await store.read("FreedOS");
  assert.equal(state.revision, 0);
  assert.equal(state.recommendations.length, 0);
  assert.equal(state.councilSessions.length, 0);
});

test("changed evidence and cross-installation bundles cannot publish", async () => {
  const { input, publish } = await fixture();
  input.evidenceDigest = "changed";
  await assert.rejects(publish(), /evidence changed/);
  const other = await fixture();
  other.input.bundle.profile = "AubOS";
  await assert.rejects(other.publish(), /installation/);
  assert.throws(() => councilPacket({ profile: "AubOS" }), /scoped/);
});

test("published proposals remain advisory and the next packet includes their receipts", async () => {
  const { input, publish } = await fixture();
  input.bundle.recommendations = [{
    role: "COO", kind: "task", rationale: "Controlled evidence",
    proposal: { title: "Controlled task" },
  }];
  const state = await publish();
  assert.equal(state.tasks.length, 0);
  assert.equal(state.goals.length, 0);
  assert.deepEqual(state.councilSessions[0].recommendationIds, [state.recommendations[0].id]);
  const next = councilPacket(state);
  assert.equal(next.packet.priorRecommendations.length, 1);
  assert.equal(next.packet.recentSessions.length, 1);
  assert.notEqual(next.evidenceDigest, input.evidenceDigest);
});
