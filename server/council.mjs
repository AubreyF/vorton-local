import { createHash, randomUUID } from "node:crypto";
import { check, text } from "./store.mjs";
import { reviewPacket, importRecommendations } from "./review.mjs";

const digest = (packet) => createHash("sha256").update(JSON.stringify(packet)).digest("hex");
function evidence(state) {
  const packet = reviewPacket(state, "council");
  packet.instruction += ` Write a readable Markdown report with these sections: ${packet.council.behavior.reportSections.join(", ")}. Use blank lines, short paragraphs and tables when useful. Refer to goals by title; keep exact IDs in structured fields. Label hypothetical numbers. Never invent metrics or render untrusted HTML. Include every identity's contribution and material disagreement. Return material alternatives as options with title, status (active_candidate, conditional, fallback, parked or rejected), rationale and evidence. These are advisory, not accepted decisions. Summary limit: 24000 characters.`;
  return {
    ...packet,
    priorRecommendations: state.recommendations.map(({ history, ...item }) => item),
    recentSessions: (state.councilSessions ?? []).slice(-14),
  };
}

export function councilPacket(state) {
  check(typeof state.profile === "string" && Array.isArray(state.goals) && Array.isArray(state.tasks), "Council requires a scoped organization state");
  const packet = evidence(state);
  return {
    contract: "vorton-local.council-session.v1",
    sessionId: randomUUID(),
    evidenceDigest: digest(packet),
    packet,
    publication: "Return sessionId, evidenceDigest, summary, and bundle. Bundle follows packet.response. An empty recommendations array is valid when no action is justified. Never invent missing goals or evidence.",
  };
}

// Invoke only inside Store.transact: recommendations and receipt commit together.
export function publishCouncil(state, input) {
  check(input?.contract === "vorton-local.council-session.v1", "Invalid council contract");
  check(typeof input.sessionId === "string" && /^[a-f0-9-]{36}$/.test(input.sessionId), "Invalid session identity");
  check(!(state.councilSessions ?? []).some((s) => s.id === input.sessionId), "Session already published", 409);
  check(input.evidenceDigest === digest(evidence(state)), "Council evidence changed. Prepare a fresh session.", 409);
  const summary = text(input.summary, "session summary", 24000);
  const bundle = input.bundle;
  check(bundle?.contract === "vorton-local.recommendations.v1" && bundle.profile === state.profile, "Recommendation installation does not match");
  check(bundle.basedOnRevision === state.revision, "Council evidence is out of date", 409);
  check(Array.isArray(bundle.recommendations), "Expected recommendations");
  const options = input.options ?? [];
  check(Array.isArray(options) && options.length <= 30, "Invalid council options");
  const alternatives = options.map(option => {
    check(option && Object.keys(option).every(k => ["title", "status", "rationale", "evidence"].includes(k)), "Invalid council option fields");
    check(["active_candidate", "conditional", "fallback", "parked", "rejected"].includes(option.status), "Invalid council option status");
    return { title: text(option.title, "option title", 180), status: option.status, rationale: text(option.rationale, "option rationale", 4000), evidence: text(option.evidence ?? "", "option evidence", 4000, false) };
  });
  const before = state.recommendations.length;
  if (bundle.recommendations.length) importRecommendations(state, bundle);
  const receipt = {
    id: input.sessionId,
    status: "published",
    publishedAt: new Date().toISOString(),
    basedOnRevision: state.revision,
    evidenceDigest: input.evidenceDigest,
    council: evidence(state).council,
    options: alternatives,
    summary,
    recommendationIds: state.recommendations.slice(before).map((r) => r.id),
  };
  (state.councilSessions ??= []).push(receipt);
  return { id: receipt.id, actor: "council-import", detail: `Council session published with ${receipt.recommendationIds.length} recommendations; none accepted automatically` };
}
