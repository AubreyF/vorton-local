import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import ts from "typescript";
import {
  Store,
  opportunityInput,
  entryInput,
  financePlanInput,
} from "../server/store.mjs";
const command = (action, payload, expectedRevision) => ({
  action,
  payload,
  expectedRevision,
  requestId: randomUUID(),
});
const opportunity = {
  title: "Controlled event",
  owner: "Owner",
  kind: "event",
  status: "new",
  valueCents: 12500,
  nextAction: "Confirm capacity",
};
const plan = {
  openingCashCents: 2000000,
  rooms: 12,
  days: 30,
  occupancy: 35,
  rateCents: 18000,
  variableCents: 4500,
  fixedCents: 1800000,
};
test("business records persist with history, scoped links, revision checks, and complete exports", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "vorton-business-"));
  try {
    const store = new Store(root, ["LastResort", "Other"]);
    let state = await store.command(
      "LastResort",
      command("opportunity.create", { fields: opportunity }, 0),
    );
    const id = state.opportunities[0].id;
    assert.equal((await store.read("Other")).opportunities.length, 0);
    await assert.rejects(
      store.command(
        "Other",
        command("opportunity.update", { id, fields: opportunity }, 0),
      ),
      /not found/,
    );
    await assert.rejects(
      store.command(
        "Other",
        command(
          "opportunity.create",
          { fields: { ...opportunity, goalId: "foreign" } },
          0,
        ),
      ),
      /Linked goal/,
    );
    await assert.rejects(
      store.command(
        "LastResort",
        command("opportunity.update", { id, fields: opportunity }, 0),
      ),
      /out of date/,
    );
    state = await store.command(
      "LastResort",
      command(
        "opportunity.update",
        { id, fields: { ...opportunity, status: "won" } },
        1,
      ),
    );
    assert.equal(state.opportunities[0].history[0].fields.status, "new");
    assert.equal(state.events.at(-1).detail, "Controlled event");
    state = await store.command(
      "LastResort",
      command(
        "entry.create",
        {
          fields: {
            title: "Deposit",
            kind: "income",
            amountCents: 12500,
            date: "2032-04-01",
            category: "Bookings",
          },
        },
        2,
      ),
    );
    state = await store.command(
      "LastResort",
      command("finance.plan.update", plan, 3),
    );
    state = await store.command(
      "LastResort",
      command(
        "settings.update",
        { defaultOwner: "Mabel", purpose: "Keep breakfast finite" },
        4,
      ),
    );
    const saved = await store.read("LastResort");
    assert.equal(saved.revision, 5);
    assert.equal(saved.ledger[0].amountCents, 12500);
    assert.deepEqual(saved.financePlan, plan);
    assert.equal(saved.settings.defaultOwner, "Mabel");
    assert.equal(saved.preferenceHistory.length, 2);
    assert.deepEqual(saved.preferenceHistory[0].after, plan);
    assert.equal(saved.preferenceHistory[1].before.defaultOwner, "Owner");
    assert.equal((await store.read("Other")).ledger.length, 0);
    // Old schema1 files gain empty collections without losing their prior work.
    const filename = path.join(root, "LastResort/state/core.json");
    const old = JSON.parse(await readFile(filename));
    delete old.opportunities;
    delete old.ledger;
    delete old.settings;
    delete old.financePlan;
    await writeFile(filename, JSON.stringify(old));
    const migrated = await store.read("LastResort");
    assert.deepEqual(migrated.opportunities, []);
    assert.deepEqual(migrated.ledger, []);
    assert.equal(migrated.revision, 5);
    assert.equal(migrated.events.length, 5);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
test("business inputs reject unknown fields, invalid dates, fractions of a cent and unbounded forecasts", () => {
  assert.throws(() =>
    opportunityInput({ ...opportunity, status: "imaginary" }),
  );
  assert.throws(() =>
    opportunityInput({ ...opportunity, followUpOn: "2032-02-30" }),
  );
  assert.throws(() => opportunityInput({ ...opportunity, profile: "Other" }));
  for (const amountCents of [-1, 0, 1.5, Infinity, 10000000001])
    assert.throws(() =>
      entryInput({
        title: "Test",
        kind: "income",
        amountCents,
        date: "2032-04-01",
        category: "Test",
      }),
    );
  assert.throws(() => financePlanInput({ ...plan, occupancy: 101 }));
  assert.throws(() => financePlanInput({ ...plan, rooms: 0 }));
  assert.throws(() => financePlanInput({ ...plan, days: 32 }));
});
const compiled = ts.transpileModule(
  await readFile(new URL("../web/finance-model.ts", import.meta.url), "utf8"),
  {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  },
);
const { financeSummary } = await import(
  `data:text/javascript;base64,${Buffer.from(compiled.outputText).toString("base64")}`
);
test("forecast and cash stay separate, including negative contribution and zero burn", () => {
  const summary = financeSummary(plan, [
    { kind: "income", amountCents: 300000 },
    { kind: "expense", amountCents: 918000 },
  ]);
  assert.equal(summary.cash, 1382000);
  assert.equal(summary.nights, 126);
  assert.equal(summary.revenue, 2268000);
  assert.equal(summary.net, -99000);
  assert.equal(summary.runway, 1382000 / 99000);
  assert.ok(Math.abs(summary.breakEven - 37.037037) < 0.000001);
  assert.equal(financeSummary({ ...plan, occupancy: 100 }, []).runway, null);
  assert.equal(financeSummary({ ...plan, rateCents: 0 }, []).breakEven, null);
  assert.equal(
    financeSummary({ ...plan, rateCents: 0, fixedCents: 0 }, []).breakEven,
    0,
  );
  assert.equal(
    financeSummary({ ...plan, rateCents: 4500, fixedCents: 0 }, []).breakEven,
    0,
  );
  assert.equal(
    financeSummary({ ...plan, openingCashCents: 0 }, [
      { kind: "expense", amountCents: 100 },
    ]).runway,
    0,
  );
});
