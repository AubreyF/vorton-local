import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { Store, check } from "../server/store.mjs";
import { reviewPacket, importRecommendations } from "../server/review.mjs";
import { root } from "./paths.mjs";

const args = process.argv.slice(2);
const value = (flag) => args[args.indexOf(flag) + 1];
check(
  args.includes("--profile"),
  "Supply --profile AubOS or --profile FreedOS",
);
const profile = value("--profile");
const store = new Store(root);
if (args.includes("--import")) {
  const bundle = JSON.parse(await readFile(value("--import"), "utf8"));
  const command = {
    action: "recommendations.import",
    requestId: randomUUID(),
    expectedRevision: bundle.basedOnRevision,
    payload: bundle,
  };
  const updated = await store.transact(profile, command, (state) =>
    importRecommendations(state, bundle),
  );
  console.log(
    JSON.stringify({
      profile,
      revision: updated.revision,
      imported: bundle.recommendations.length,
      accepted: 0,
    }),
  );
} else {
  check(args.includes("--role"), "Supply --role CEO, CTO, CMO, COO, or CFO");
  // Output contains selected private evidence. The caller chooses whether to send
  // it to a model. No provider process or scheduler is started here.
  console.log(
    JSON.stringify(
      reviewPacket(await store.read(profile), value("--role")),
      null,
      2,
    ),
  );
}
