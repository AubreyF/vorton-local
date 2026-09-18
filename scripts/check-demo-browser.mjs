import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import { createCoreServer as createServer } from "../server/core-http.mjs";
import { seedDemo } from "./demo-seed.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
// Supply an installed Playwright module explicitly; never load a private app to run the demo.
if (!process.env.PLAYWRIGHT_MODULE)
  throw new Error(
    "Set PLAYWRIGHT_MODULE to an installed playwright-core index.mjs",
  );
const { chromium } = await import(
  pathToFileURL(path.resolve(process.env.PLAYWRIGHT_MODULE))
);
const output = path.join(root, ".runtime/demo-browser");
await mkdir(output, { recursive: true });
const state = await mkdtemp(path.join(output, "state-"));
await seedDemo(state);
const app = createServer({
  root: state,
  dist: path.join(root, "dist"),
  port: 0,
  enabledProfiles: ["LastResort"],
  defaultPath: "/lastresort/bridge",
});
await new Promise((resolve) => app.server.listen(0, "127.0.0.1", resolve));
const origin = `http://127.0.0.1:${app.server.address().port}`;
app.hosts.add(new URL(origin).host);
app.allowed.add(origin);
let browser;
try {
  browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH,
  });
  const page = await browser.newPage({ reducedMotion: "reduce" });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.route("https://**", (route) => route.abort());
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`${origin}/lastresort?filter=Active`, {
      waitUntil: "networkidle",
    });
    assert.equal(page.url(), `${origin}/lastresort/bridge?filter=Active`);
    assert.equal(
      await page
        .getByRole("link", { name: "Bridge", exact: true })
        .getAttribute("aria-current"),
      "page",
    );
    for (const section of [
      "bridge",
      "council",
      "goals",
      "tasks",
      "guestbook",
    ]) {
      assert.equal(
        (
          await page.goto(`${origin}/lastresort/${section}`, {
            waitUntil: "networkidle",
          })
        ).status(),
        200,
      );
      assert.equal(await page.getByRole("alert").count(), 0);
      if (section === "council")
        assert.equal(
          await page.getByText("No saved submission", { exact: true }).count(),
          0,
          "Every fictional Council voice has a saved contribution",
        );
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth + 1,
        ),
        false,
        `${section} overflows at ${width}`,
      );
      await page.screenshot({
        path: path.join(output, `${section}-${width}.png`),
        fullPage: true,
      });
    }
    await page.locator(".demo-switcher summary").click();
    await page.getByLabel("Installed Vorton version").waitFor();
    assert.match(
      await page.getByLabel("Installed Vorton version").innerText(),
      /^Vorton \d+\.\d+\.\d+/,
    );
    assert.equal(
      await page.locator(".demo-menu > :last-child").getAttribute("class"),
      "installed-version",
    );
    for (const theme of [
      "ember",
      "midas",
      "scriptorium",
      "starship-light",
      "starship-dark",
      "neon",
    ]) {
      const preview =
        theme === "starship-light"
          ? "starship"
          : theme === "starship-dark"
            ? "dark-star"
            : theme;
      await page
        .locator(`button:has([data-theme-preview="${preview}"])`)
        .click();
      assert.equal(
        await page.locator("html").getAttribute("data-theme"),
        theme,
      );
    }
    await page.screenshot({ path: path.join(output, `menu-${width}.png`) });
    await page.keyboard.press("Escape");
    assert.equal(
      await page.locator(".demo-switcher").getAttribute("open"),
      null,
    );
  }
  await page.goto(`${origin}/lastresort/goals`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "New goal", exact: true }).click();
  await page
    .getByLabel("Title", { exact: true })
    .fill("Find a finite supply of clean towels");
  await page.getByRole("button", { name: "Save goal", exact: true }).click();
  await page
    .getByText("Find a finite supply of clean towels", { exact: true })
    .waitFor();
  await page.reload({ waitUntil: "networkidle" });
  await page
    .getByText("Find a finite supply of clean towels", { exact: true })
    .waitFor();
  await page.goto(`${origin}/lastresort/tasks`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "New task", exact: true }).click();
  await page
    .getByLabel("Title", { exact: true })
    .fill("Count the towels before they become infinite");
  await page.getByRole("button", { name: "Save task", exact: true }).click();
  await page
    .getByText("Count the towels before they become infinite", { exact: true })
    .waitFor();
  await page.reload({ waitUntil: "networkidle" });
  await page
    .getByText("Count the towels before they become infinite", { exact: true })
    .waitFor();
  await page.goto(`${origin}/lastresort/council`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Accept", exact: true }).click();
  await page.goto(`${origin}/lastresort/tasks`, { waitUntil: "networkidle" });
  await page
    .getByText("Run a twelve-guest opening rehearsal", { exact: true })
    .waitFor();
  assert.deepEqual(errors, []);
  console.log(
    "Demo desktop/mobile routes, six appearances, menu version, saved Council voices, keyboard dismissal, persisted Goals and Tasks, and recommendation acceptance passed.",
  );
} finally {
  await browser?.close();
  await new Promise((resolve) => app.server.close(resolve));
  await rm(state, { recursive: true, force: true });
}
