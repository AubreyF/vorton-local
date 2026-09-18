import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const source = await readFile(
  new URL("../web/load-progress.ts", import.meta.url),
  "utf8",
);
const js = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const { readResponseBytes, trackLoad, observeLoad } = await import(
  `data:text/javascript;base64,${Buffer.from(js).toString("base64")}`
);
const tick = () => new Promise((resolve) => setImmediate(resolve));

test("partial stream reports real decoded bytes, then checking, ignoring compressed length", async () => {
  let controller;
  const stream = new ReadableStream({
    start(value) {
      controller = value;
    },
  });
  const events = [];
  const promise = readResponseBytes(
    new Response(stream, {
      headers: { "Content-Length": "1", "Content-Encoding": "gzip" },
    }),
    { total: 4, maximum: 4, report: (event) => events.push(event) },
  );
  controller.enqueue(new Uint8Array([1, 2]));
  await tick();
  assert.deepEqual(events.at(-1), {
    phase: "downloading",
    loaded: 2,
    total: 4,
  });
  await tick();
  assert.equal(events.at(-1).loaded, 2, "Waiting must not invent progress");
  controller.enqueue(new Uint8Array([3, 4]));
  controller.close();
  assert.deepEqual(await promise, new Uint8Array([1, 2, 3, 4]));
  assert.deepEqual(events.at(-1), { phase: "checking", loaded: 4, total: 4 });
});

test("unknown sizes remain indeterminate; oversized and truncated streams fail", async () => {
  const events = [];
  await readResponseBytes(new Response("hello"), {
    maximum: 20,
    report: (event) => events.push(event),
  });
  assert.ok(events.every((event) => event.total === undefined));
  assert.equal(events.at(-1).loaded, 5);
  await assert.rejects(
    readResponseBytes(new Response("too long"), { total: 2, maximum: 20 }),
    /exceeds/,
  );
  await assert.rejects(
    readResponseBytes(new Response("short"), { total: 10, maximum: 20 }),
    /mismatch/,
  );
  await assert.rejects(
    readResponseBytes(new Response("too long"), { maximum: 2 }),
    /exceeds/,
  );
});

test("shared requests replay progress to late subscribers without a duplicate download", async () => {
  let report,
    finish,
    calls = 0;
  const task = trackLoad(async (listener) => {
    calls++;
    report = listener;
    return new Promise((resolve) => {
      finish = resolve;
    });
  });
  const first = [],
    second = [];
  const one = observeLoad(task, (event) => first.push(event));
  await tick();
  report({ phase: "downloading", loaded: 50, total: 100 });
  const two = observeLoad(task, (event) => second.push(event));
  assert.deepEqual(second[0], first.at(-1));
  report({ phase: "preparing", loaded: 100, total: 100 });
  finish("fixture");
  assert.deepEqual(await Promise.all([one, two]), ["fixture", "fixture"]);
  assert.equal(calls, 1);
  const count = first.length;
  report({ phase: "waiting", loaded: 0 });
  assert.equal(first.length, count, "Finished subscribers are released");
});
