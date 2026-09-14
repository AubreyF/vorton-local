import { mkdir, readFile, open, rename, lstat, rmdir } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

export const profiles = Object.freeze(["AubOS", "FreedOS"]);
export const roles = Object.freeze(["CEO", "CTO", "CMO", "COO", "CFO"]);
export class Fault extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
export function check(condition, message, status = 400) {
  if (!condition) throw new Fault(status, message);
}
export function text(value, name, limit = 4000, required = true) {
  check(
    typeof value === "string" &&
      value.length <= limit &&
      (!required || value.trim().length > 0),
    `Invalid ${name}`,
  );
  return value.trim();
}
const choose = (v, set, name) => {
  check(set.includes(v), `Invalid ${name}`);
  return v;
};
const timestamp = () => new Date().toISOString();
function deadline(v) {
  if (v === "" || v === undefined) return "";
  check(
    typeof v === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(v) &&
      !Number.isNaN(Date.parse(v)) &&
      new Date(v).toISOString().slice(0, 10) === v,
    "Invalid date",
  );
  return v;
}
function fields(value, allowed) {
  check(
    value && typeof value === "object" && !Array.isArray(value),
    "Expected an object",
  );
  check(
    Object.keys(value).every((k) => allowed.includes(k)),
    "Unexpected field",
  );
}
export function goalInput(input) {
  fields(input, [
    "title",
    "intent",
    "successCriteria",
    "owner",
    "horizon",
    "priority",
    "parentId",
    "reviewOn",
    "milestones",
    "evidence",
    "progress",
    "status",
  ]);
  const progress = input.progress ?? 0;
  check(
    Number.isInteger(progress) && progress >= 0 && progress <= 100,
    "Progress must be 0 to 100",
  );
  const milestones = input.milestones ?? [];
  check(
    Array.isArray(milestones) && milestones.length <= 30,
    "Invalid milestones",
  );
  return {
    title: text(input.title, "title", 180),
    intent: text(input.intent ?? "", "intent", 4000, false),
    successCriteria: text(
      input.successCriteria ?? "",
      "success criteria",
      4000,
      false,
    ),
    owner: text(input.owner ?? "Owner", "owner", 120),
    horizon: text(input.horizon ?? "", "horizon", 160, false),
    priority: choose(
      input.priority ?? "normal",
      ["high", "normal", "low"],
      "priority",
    ),
    parentId: text(input.parentId ?? "", "parent goal", 80, false),
    reviewOn: deadline(input.reviewOn),
    milestones: milestones.map((m) => {
      fields(m, ["title", "done"]);
      check(typeof m.done === "boolean", "Invalid milestone state");
      return { title: text(m.title, "milestone", 240), done: m.done };
    }),
    evidence: text(input.evidence ?? "", "evidence", 12000, false),
    progress,
    status: choose(
      input.status ?? "active",
      ["active", "paused", "achieved", "retired"],
      "goal status",
    ),
  };
}
export function taskInput(input) {
  fields(input, [
    "title",
    "notes",
    "goalId",
    "owner",
    "dueOn",
    "status",
    "priority",
  ]);
  return {
    title: text(input.title, "title", 180),
    notes: text(input.notes ?? "", "notes", 8000, false),
    goalId: text(input.goalId ?? "", "goal", 80, false),
    owner: text(input.owner ?? "Owner", "owner", 120),
    dueOn: deadline(input.dueOn),
    status: choose(
      input.status ?? "todo",
      ["todo", "doing", "blocked", "done", "cancelled"],
      "task status",
    ),
    priority: choose(
      input.priority ?? "normal",
      ["high", "normal", "low"],
      "priority",
    ),
  };
}
export function recommendationInput(input) {
  fields(input, [
    "role",
    "kind",
    "targetId",
    "targetVersion",
    "rationale",
    "tradeoffs",
    "confidence",
    "evidence",
    "proposal",
  ]);
  const kind = choose(
    input.kind,
    ["goal", "task", "goal-review", "task-review"],
    "recommendation kind",
  );
  const isReview = kind.endsWith("-review");
  if (isReview)
    check(
      Number.isInteger(input.targetVersion) && input.targetVersion > 0,
      "Review must bind the current target version",
    );
  return {
    role: choose(input.role, roles, "executive role"),
    kind,
    targetId: text(input.targetId ?? "", "target", 80, isReview),
    targetVersion: isReview ? input.targetVersion : null,
    rationale: text(input.rationale, "rationale", 8000),
    tradeoffs: text(input.tradeoffs ?? "", "tradeoffs", 8000, false),
    confidence: choose(
      input.confidence ?? "medium",
      ["low", "medium", "high"],
      "confidence",
    ),
    evidence: text(input.evidence ?? "", "evidence", 12000, false),
    proposal: kind.startsWith("goal")
      ? goalInput(input.proposal)
      : taskInput(input.proposal),
  };
}
function initial(profile) {
  return {
    schema: 1,
    profile,
    revision: 0,
    goals: [],
    tasks: [],
    recommendations: [],
    events: [],
    requests: [],
  };
}
function validateState(s, profile) {
  check(
    s.schema === 1 &&
      s.profile === profile &&
      Number.isInteger(s.revision) &&
      s.revision >= 0,
    "State identity is invalid",
    503,
  );
  for (const key of ["goals", "tasks", "recommendations", "events", "requests"])
    check(Array.isArray(s[key]), "State is invalid", 503);
  return s;
}
export async function safeDirectory(directory) {
  // Reject symlinks at each level below the configured package root.
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const info = await lstat(directory);
  check(
    info.isDirectory() && !info.isSymbolicLink(),
    "State directory must not be a symlink",
    503,
  );
}
export async function atomicJson(filename, value) {
  const temporary = `${filename}.${randomUUID()}.tmp`;
  const file = await open(temporary, "wx", 0o600);
  try {
    await file.writeFile(JSON.stringify(value, null, 2) + "\n");
    await file.sync();
  } finally {
    await file.close();
  }
  await rename(temporary, filename);
  const directory = await open(path.dirname(filename), "r");
  try {
    await directory.sync();
  } finally {
    await directory.close();
  }
}
export class Store {
  constructor(root) {
    this.root = path.resolve(root);
  }
  async directory(profile) {
    check(profiles.includes(profile), "Unknown installation", 404);
    await safeDirectory(this.root);
    await safeDirectory(path.join(this.root, profile));
    const directory = path.join(this.root, profile, "state");
    await safeDirectory(directory);
    return directory;
  }
  async read(profile) {
    const directory = await this.directory(profile);
    const filename = path.join(directory, "core.json");
    try {
      check(
        !(await lstat(filename)).isSymbolicLink(),
        "State file must not be a symlink",
        503,
      );
      return validateState(
        JSON.parse(await readFile(filename, "utf8")),
        profile,
      );
    } catch (error) {
      if (error.code === "ENOENT") return initial(profile);
      if (error instanceof SyntaxError)
        throw new Fault(
          503,
          "State is unreadable. Restore a verified backup; do not reset it.",
        );
      throw error;
    }
  }
  async transact(profile, command, change) {
    const directory = await this.directory(profile);
    const lock = path.join(directory, ".writer");
    try {
      await mkdir(lock, { mode: 0o700 });
    } catch (e) {
      if (e.code === "EEXIST")
        throw new Fault(
          409,
          "Another writer is active. Retry after refreshing. A crashed writer requires explicit recovery.",
        );
      throw e;
    }
    try {
      const state = await this.read(profile);
      check(
        command &&
          typeof command.requestId === "string" &&
          /^[a-f0-9-]{36}$/.test(command.requestId),
        "A request identity is required",
      );
      const serialized = JSON.stringify(command);
      const prior = state.requests.find((r) => r.id === command.requestId);
      if (prior) {
        check(
          prior.command === serialized,
          "Request identity was reused with different contents",
          409,
        );
        return state;
      }
      check(
        command.expectedRevision === state.revision,
        "This view is out of date. Refresh before saving.",
        409,
      );
      const result = await change(state);
      state.revision++;
      state.events.push({
        id: randomUUID(),
        at: timestamp(),
        action: command.action,
        subjectId: result?.id ?? "",
        actor: result?.actor ?? "owner",
        revision: state.revision,
        detail: result?.detail ?? "",
      });
      state.requests.push({ id: command.requestId, command: serialized });
      // Keep idempotence for the life of the store. Never silently evict identity history.
      await atomicJson(path.join(directory, "core.json"), state);
      return state;
    } finally {
      await rmdir(lock);
    }
  }
  async command(profile, command) {
    return this.transact(profile, command, (state) =>
      applyCommand(state, command),
    );
  }
}
function relations(state, data, kind, id = "") {
  const goalId = kind === "goal" ? data.parentId : data.goalId;
  if (!goalId) return;
  check(
    state.goals.some((g) => g.id === goalId),
    "Linked goal does not belong to this installation",
  );
  if (kind === "goal") {
    const seen = new Set([id]);
    let current = goalId;
    while (current) {
      check(!seen.has(current), "Goal hierarchy would contain a cycle");
      seen.add(current);
      current = state.goals.find((g) => g.id === current)?.parentId;
    }
  }
}
function saveEntity(state, kind, data, id, origin = null) {
  const collection = kind === "goal" ? state.goals : state.tasks;
  const existing = id ? collection.find((g) => g.id === id) : null;
  if (id) check(existing, "Item not found in this installation", 404);
  relations(state, data, kind, id);
  const entry = {
    ...data,
    id: id || randomUUID(),
    version: (existing?.version ?? 0) + 1,
    createdAt: existing?.createdAt ?? timestamp(),
    updatedAt: timestamp(),
    origin: existing?.origin ?? origin,
    history: [
      ...(existing?.history ?? []),
      ...(existing
        ? [
            {
              at: existing.updatedAt,
              version: existing.version,
              fields: Object.fromEntries(
                Object.entries(existing).filter(
                  ([k]) => !["history"].includes(k),
                ),
              ),
            },
          ]
        : []),
    ],
  };
  if (existing) collection[collection.indexOf(existing)] = entry;
  else collection.push(entry);
  return entry;
}
export function applyCommand(state, command) {
  const { action, payload = {} } = command;
  if (action === "goal.create" || action === "goal.update")
    return saveEntity(
      state,
      "goal",
      goalInput(payload.fields),
      action.endsWith("update") ? text(payload.id, "goal ID", 80) : "",
    );
  if (action === "task.create" || action === "task.update")
    return saveEntity(
      state,
      "task",
      taskInput(payload.fields),
      action.endsWith("update") ? text(payload.id, "task ID", 80) : "",
    );
  if (action === "recommendation.create") {
    const data = recommendationInput(payload);
    relations(
      state,
      data.proposal,
      data.kind.startsWith("goal") ? "goal" : "task",
      data.targetId,
    );
    if (data.kind.endsWith("-review")) {
      const target = (
        data.kind.startsWith("goal") ? state.goals : state.tasks
      ).find((i) => i.id === data.targetId);
      check(
        target && target.version === data.targetVersion,
        "Recommendation target is stale or outside this installation",
        409,
      );
    }
    const recommendation = {
      ...data,
      id: randomUUID(),
      status: "pending",
      createdAt: timestamp(),
    };
    state.recommendations.push(recommendation);
    return recommendation;
  }
  if (action === "recommendation.resolve") {
    const item = state.recommendations.find((r) => r.id === payload.id);
    check(item, "Recommendation not found", 404);
    check(
      ["pending", "deferred"].includes(item.status),
      "Recommendation already resolved",
      409,
    );
    choose(payload.decision, ["accepted", "rejected", "deferred"], "decision");
    if (payload.decision === "accepted") {
      const kind = item.kind.startsWith("goal") ? "goal" : "task";
      const collection = kind === "goal" ? state.goals : state.tasks;
      if (item.kind.endsWith("-review"))
        check(
          collection.find((t) => t.id === item.targetId)?.version ===
            item.targetVersion,
          "Target changed since this recommendation. Request a fresh review.",
          409,
        );
      const data =
        kind === "goal"
          ? goalInput(payload.fields ?? item.proposal)
          : taskInput(payload.fields ?? item.proposal);
      const saved = saveEntity(
        state,
        kind,
        data,
        item.kind.endsWith("-review") ? item.targetId : "",
        item.id,
      );
      item.resultId = saved.id;
    }
    item.status = payload.decision;
    item.resolvedAt = timestamp();
    item.ownerNote = text(payload.note ?? "", "note", 4000, false);
    return item;
  }
  throw new Fault(400, "Unknown command");
}
