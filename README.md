# Vorton

Vorton is a local workspace for turning Council recommendations into Goals and Tasks you can inspect, accept, and track. The flagship demonstration is **The Last Resort**, a hotel at the edge of the universe. Checkout is at eleven. Causality is subject to availability.

The demo includes three Goals, five Tasks, four fictional staff members, a Council briefing, and a recommendation awaiting your decision. Its people, evidence, incidents, and figures are invented. Accepting a recommendation creates a local planning record; it does not start an agent or perform external work.

## Run locally

Use Node.js 22.13 or newer and npm.

```sh
npm ci
npm run check
npm run demo:seed
npm run demo
```

Open `http://127.0.0.1:47840/lastresort/bridge`. The server listens on loopback. Set `VORTON_DEMO_PORT` to use a different unreserved port. No API key, hosted database, account connection, or model runtime is needed.

The seed command creates fictional records in `.runtime/last-resort`. It refuses to overwrite existing work. New stores otherwise start empty. The source fixtures are checked in; runtime mutations, exports, caches, and screenshots are not.

Use Bridge for the operating picture, Council for recorded reasoning and pending decisions, Goals for outcomes and milestones, Tasks for work, and Hotel brief for the fictional organization. The upper-left menu contains six appearances and the installed Vorton version at its bottom.

## Boundaries

Repository work requires no quota verification or weekly allowance floor. Future quota controls belong in the Paseo scheduler.

This is a one-owner local application. It is not a public multi-user service. Workspace selection scopes application records; it does not create an operating-system sandbox. Keep the local server behind your own access controls and do not expose it directly to the internet.

The portable source candidate contains no private installation adapter, personal records, agent scheduler, or Factory implementation. See [design provenance](web/design/SOURCE.md) for the origin of the shared visual vocabulary.

Vorton is available under the [MIT license](LICENSE). This is an early preview; see [security](SECURITY.md), [versioning](docs/VERSIONING.md), and [release gates](docs/RELEASE.md).
