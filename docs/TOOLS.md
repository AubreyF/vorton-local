# Building workspace tools

A tool should answer a real question, show its assumptions, and give the owner a useful next action. The Last Resort examples are room allocation and breakfast scheduling. Their humor lives in the workspace module; their interface uses the shared Vorton shell and theme tokens.

## Structure

- `web/tools/tools-page.tsx` defines the shared shelf and typed `ToolDefinition`: stable anchor ID, title, description, and component.
- `web/tools/last-resort-tools.tsx` assembles this workspace's tools. Other workspaces supply their own definitions instead of copying the shelf, toolbar, or menus.
- `web/tools/hotel-calculations.ts` contains bounded, deterministic functions. They do not read stores, fetch URLs, consult the clock, or write records. Tests cover invalid input, capacity, partial sittings, zero guests, and midnight crossings.
- `web/main.tsx` supplies the tool view through `WorkspaceApp.renderTools`. The core workspace does not import the hotel module.

## Inputs and results

Use labeled native controls, explicit units and limits, and the existing theme tokens. Invalid input suppresses the result and its action. Do not present a stale calculation as current. State assumptions alongside inputs. Keep long output previews bounded and say when rows are omitted.

The room planner assumes one guest per room and consecutive occupied rooms. It checks finite capacity before offering relocation instructions. The breakfast planner assumes simultaneous sittings and sufficient kitchen capacity; its relative service clock does not model dates, time zones, or daylight saving changes. A scenario is not a booking or a published schedule.

## Records and effects

`onDraftTask` opens the existing Task editor with the calculation and assumptions in its notes. The owner chooses an owner, optionally links a Goal, and saves through the current workspace's existing command path. Cancel writes nothing. Calculations themselves remain in component state and reset when the page reloads.

Use the same pattern for future tools: pure calculation first, an explicit editable proposal second. External integrations need separate task-scoped authority and server-side enforcement. Never give a tool a second store, scheduler, credential path, or workspace fallback.

Validate pure calculations, invalid inputs, keyboard access, mobile layout, and both cancellation and persistence of Task drafts. Run `node --test tests/hotel-tools.test.mjs`; the shared browser harness exercises the Tools route and saved drafts.
