import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { WorkspaceApp } from "./workspace";
import { InstalledVersion } from "./installed-version";
import {
  APPEARANCE_DEFINITIONS,
  DEFAULT_APPEARANCE_ID,
  getAppearanceAttributes,
  resolveAppearanceId,
} from "./design/theme-registry";
import { ThemePreviewButton } from "./design/ThemePreviewButton";
import brief from "../demo/last-resort/brief.json";
import "./design/themes.css";
import "./design/theme-preview.css";
import "./demo-shell.css";

const sections = [
  { id: "bridge", label: "Bridge" },
  { id: "council", label: "Council" },
  { id: "goals", label: "Goals" },
  { id: "tasks", label: "Tasks" },
  { id: "guestbook", label: "Hotel brief" },
];
function DemoApp() {
  const menu = useRef<HTMLDetailsElement>(null);
  const [theme, setTheme] = useState<string>(DEFAULT_APPEARANCE_ID);
  const [profiles, setProfiles] = useState<string[]>(["LastResort"]);
  const page = location.pathname.split("/")[2] || "bridge";
  const valid =
    /^\/lastresort(?:\/|$)/.test(location.pathname) &&
    sections.some((x) => x.id === page);
  function appearance(value: string) {
    const id = resolveAppearanceId(value);
    const attributes = getAppearanceAttributes(id);
    Object.assign(document.documentElement.dataset, attributes);
    setTheme(id);
    try {
      localStorage.setItem("vorton-demo-appearance", id);
    } catch {
      /* Appearance works without storage. */
    }
  }
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/session", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) return;
        const session = await response.json();
        if (
          Array.isArray(session.profiles) &&
          session.profiles.every(
            (p: unknown) =>
              typeof p === "string" && /^[A-Za-z][A-Za-z0-9_-]{0,63}$/.test(p),
          )
        )
          setProfiles(session.profiles);
      })
      .catch(() => {});
    try {
      appearance(
        localStorage.getItem("vorton-demo-appearance") || DEFAULT_APPEARANCE_ID,
      );
    } catch {
      appearance(DEFAULT_APPEARANCE_ID);
    }
    const close = (event: Event) => {
      if (
        menu.current &&
        event.target instanceof Node &&
        !menu.current.contains(event.target)
      )
        menu.current.open = false;
    };
    document.addEventListener("pointerdown", close, true);
    document.addEventListener("focusin", close);
    return () => {
      controller.abort();
      document.removeEventListener("pointerdown", close, true);
      document.removeEventListener("focusin", close);
    };
  }, []);
  useEffect(() => {
    document.title = `The Last Resort · ${sections.find((x) => x.id === page)?.label || "Not found"}`;
  }, [page]);
  return (
    <div className="demo-shell">
      <a className="demo-skip" href="#demo-main">
        Skip to content
      </a>
      <header className="demo-topbar">
        <details
          ref={menu}
          className="demo-switcher"
          onKeyDown={(event) => {
            if (event.key === "Escape" && menu.current) {
              menu.current.open = false;
              menu.current.querySelector("summary")?.focus();
            }
          }}
        >
          <summary aria-label="Workspace and appearance">
            The Last Resort <span aria-hidden="true">⌄</span>
          </summary>
          <div className="demo-menu">
            {profiles.map((profile) => (
              <a
                key={profile}
                href={`/${profile.toLowerCase()}/bridge`}
                aria-current={profile === "LastResort" ? "true" : undefined}
              >
                {profile === "LastResort" ? "✓ The Last Resort" : profile}
              </a>
            ))}
            <p>Fictional demo workspace</p>
            <fieldset>
              <legend>Appearance</legend>
              <div className="demo-themes">
                {APPEARANCE_DEFINITIONS.map((t) => (
                  <ThemePreviewButton
                    key={t.id}
                    theme={t}
                    active={theme === t.id}
                    onClick={() => appearance(t.id)}
                    variant="compact"
                  />
                ))}
              </div>
            </fieldset>
            <InstalledVersion />
          </div>
        </details>
        <nav aria-label="The Last Resort sections">
          {sections.map((s) => (
            <a
              key={s.id}
              href={`/lastresort/${s.id}`}
              aria-current={s.id === page ? "page" : undefined}
            >
              {s.label}
            </a>
          ))}
        </nav>
      </header>
      <main id="demo-main" tabIndex={-1}>
        <p className="demo-notice">{brief.notice}</p>
        {valid ? (
          <>
            {page === "bridge" && (
              <section className="demo-welcome">
                <p>THE LAST RESORT</p>
                <h1>{brief.tagline}</h1>
                <p>{brief.description}</p>
                <p>
                  Checkout is at eleven. Causality is subject to availability.
                </p>
              </section>
            )}
            {page === "guestbook" ? (
              <section className="demo-brief">
                <h1>Hospitality at the edge of everything</h1>
                <p>{brief.operatingPrinciple}</p>
                <div className="demo-bulletins">
                  {brief.bulletins.map((b) => (
                    <article key={b.title}>
                      <h2>{b.title}</h2>
                      <p>{b.body}</p>
                    </article>
                  ))}
                </div>
                <h2>The people keeping the lights on</h2>
                <div className="demo-bulletins">
                  {brief.staff.map((s) => (
                    <article key={s.id}>
                      <h3>{s.name}</h3>
                      <p>{s.title}</p>
                      <p>{s.mandate}</p>
                      <p>{s.challenge}</p>
                    </article>
                  ))}
                </div>
              </section>
            ) : (
              <WorkspaceApp profile="LastResort" page={page} />
            )}
          </>
        ) : (
          <section>
            <h1>Room 404</h1>
            <p>This page is not on the hotel plan.</p>
            <a href="/lastresort/bridge">Return to the Bridge</a>
          </section>
        )}
      </main>
    </div>
  );
}
const root = document.getElementById("root");
if (root) createRoot(root).render(<DemoApp />);
