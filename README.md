# Vorton Local

Vorton Local gives a person and their AI team a shared place to set goals, organize work, make recommendations, and see what happened. It runs on a machine you control, with files you can inspect and keep.

The first two installations are **AubOS**, for personal life, and **FreedOS**, for the team building Freed. They share an application and design system while keeping their records, instructions, and execution boundaries separate.

## Useful sooner

[Vorton Cloud](https://github.com/AubreyF/vorton-cloud) pursues the larger vision: a reusable foundation for people and AI-native organizations, with governed action, durable memory, independently deployable modules, and multiple installations.

That vision is worth pursuing. It also requires a substantial platform before many of its benefits become available.

Vorton Local takes the pieces that can improve daily life now and gives them a smaller home. Goals should help a team choose useful work today. Executive recommendations should reach a person who can evaluate them. A software factory should complete a bounded task, show its evidence, and stop when it needs judgment.

The long-term direction remains aligned with Vorton Cloud. Local is an independent implementation for an immediate, one-owner use case, not a claim that the cloud platform is complete or that switching between them is already supported.

## The first pilot

The first pilot includes:

- Goals with success criteria, milestones, linked tasks, evidence, and a history of changes.
- Executive review of existing work and recommendations for new goals and tasks.
- One inbox for accepting, editing, deferring, or rejecting recommendations.
- AubOS and FreedOS switching using the existing AubOS themes and controls.
- Visible recommendation activity, startup checks, backup, and recovery.

Factory execution and resource-aware scheduling are being developed separately in Paseo. This build does not implement a factory runner or a competing scheduler. FreedOS receives the shared goal, task, and executive-review surfaces; its execution integration follows that separate work.

**This is a tested local pilot, not a production cloud platform.** Start with `START-HERE.md` on the destination machine. Do not replace an authoritative installation until the handoff and destination checks pass.

## Small infrastructure

The working directory is `~/dev/vorton` on both the development and destination machines. The repository name remains `vorton-local`; it does not dictate the folder name. The older cloud checkout lives separately at `~/dev/vortoncloud` on the development machine.

The transfer ZIP is a small source package, not a complete installed AubOS image. It includes the local core, two empty installation directories, design tokens, tests, and setup instructions. It excludes dependencies, compiled assets, credentials, and the original AubOS application's code and personal records. The destination agent installs dependencies, builds the core, and attaches the destination's authoritative AubOS using `START-HERE.md`. Do not overwrite that application with a stale development copy.

The pilot targets a single owner on macOS. It does not require Supabase, a hosted database, a new login platform, or cloud infrastructure. Private network access is supplied by the owner. The application must not be exposed directly to the public internet.

Executive reviews use copyable prompts and validated JSON responses through an existing authenticated agent. This pilot starts no model calls itself. No API key is bundled or required by the application. An agent provider may still process the evidence explicitly supplied to it; local storage does not mean all model processing occurs on the host.

Advanced memory, independently distributed plugins, remote worker fleets, and multi-owner hosting remain longer-term candidates. None is a prerequisite for the first pilot.

## Your records stay yours

Code and operational data have different homes. This repository contains source, documentation, and controlled fixtures. It must not contain personal records, generated personal dashboard bundles, credentials, provider sessions, private keys, or backups.

The `AubOS` and `FreedOS` directories hold separate local state outside Git. An existing authoritative AubOS installation is preserved at the destination. A stale development copy must never overwrite it or silently become its replacement.

Profile separation is not an operating-system sandbox. A coding worker needs a restricted execution environment that cannot read personal AubOS files or credentials. The application does not claim that a dropdown supplies that protection.

## Judgment and action

Recommendations are advisory. Accepting a goal or task does not authorize spending, outreach, deployment, or factory execution. No factory is implemented here. Automatic merging, deployment, destructive changes, and changes to execution permissions are outside the pilot's authority.

Errors and incomplete work remain visible. A generated plan is not evidence that an action happened. A passing local test is not proof that another machine is ready.

## Publication

This repository is private during development. Public publication requires the owner's review and approval after source and history scans. A clean scan is supporting evidence, not a guarantee that every sensitive value has been recognized.
