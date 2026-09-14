import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, readFile, symlink } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Store } from "../server/store.mjs";
import { backup, restoreIsolated } from "../scripts/backup.mjs";
import { attach } from "../scripts/attach-aubos.mjs";
const temp = () => mkdtemp(path.join(os.tmpdir(), "vorton-ops-"));
test("backup verifies exact isolated restoration and denies overwrite and alteration", async () => {
  const at = await temp();
  const store = new Store(at);
  await store.command("FreedOS", {
    requestId: randomUUID(),
    expectedRevision: 0,
    action: "goal.create",
    payload: { fields: { title: "Controlled fixture" } },
  });
  const file = await backup(at);
  const target = path.join(await temp(), "restored");
  const result = await restoreIsolated(file, target);
  assert.equal(result.productionMutated, false);
  assert.deepEqual(
    await new Store(target).read("FreedOS"),
    await store.read("FreedOS"),
  );
  await assert.rejects(restoreIsolated(file, target), /nonexistent/);
  const bundle = JSON.parse(await readFile(file, "utf8"));
  bundle.states[1].goals[0].title = "Tampered";
  await writeFile(file, JSON.stringify(bundle));
  await assert.rejects(
    restoreIsolated(file, path.join(await temp(), "bad")),
    /hash/,
  );
});
test("attachment is dry-run by default, preserves source, verifies copy, and never overwrites", async () => {
  const source = await temp();
  const destination = await temp();
  await mkdir(path.join(source, "dashboard/web"), { recursive: true });
  await writeFile(
    path.join(source, "dashboard/web/package.json"),
    '{"name":"controlled-fixture"}',
  );
  await writeFile(path.join(source, "fixture.txt"), "Controlled data only.");
  const plan = await attach(source, destination);
  assert.equal(plan.applied, false);
  const result = await attach(source, destination, true);
  assert.equal(result.applied, true);
  assert.equal(
    await readFile(path.join(source, "fixture.txt"), "utf8"),
    "Controlled data only.",
  );
  assert.equal(
    await readFile(
      path.join(destination, "AubOS/authoritative/fixture.txt"),
      "utf8",
    ),
    "Controlled data only.",
  );
  await assert.rejects(attach(source, destination, true), /already exists/);
});
test("attachment refuses symlinks and nested destinations", async () => {
  const source = await temp();
  await symlink("/dev/null", path.join(source, "external"));
  await assert.rejects(attach(source, await temp()), /symlink/);
  await assert.rejects(attach(source, path.join(source, "inside")), /separate/);
});
