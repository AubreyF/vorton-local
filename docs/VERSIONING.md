# Versioning

Vorton uses semantic versions. The current candidate is `0.2.0-preview.1`; it is a prerelease, not a public release announcement.

`package.json` is the version source. The root and root-package entries in `package-lock.json` must match. Run `npm run version:check` after any version change. Maintain an unreleased changelog entry describing behavior and compatibility changes. Before 1.0, document breaking changes explicitly in a minor release. After 1.0, incompatible public contracts require a major version.

The server reads the installed package version once when it starts. `/api/version` reports that captured value without a credential, filesystem path, account identity, or private revision. The final item of the upper-left toolbar menu displays it. Restarting into a validated installation is required to change the running version. Editing the checkout does not relabel a process already running.

Tag and publish a version only after the exact candidate passes tests, source and history audits, dependency review, artifact verification, and required independent review, followed by the owner's final release confirmation. Version tags and changelog text do not grant deployment or publication authority.
