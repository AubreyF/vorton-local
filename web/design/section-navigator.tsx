"use client";

import { useEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent, ReactNode } from "react";

export type SectionNavigationItem = {
  id: string;
  label: string;
  detail?: string;
};

function navigationOffset() {
  const contextualNavigation = document.querySelector<HTMLElement>(".section-nav-bar");
  const primaryNavigation = document.querySelector<HTMLElement>(".topbar");
  return Math.max(
    contextualNavigation?.getBoundingClientRect().bottom ?? 0,
    primaryNavigation?.getBoundingClientRect().bottom ?? 0,
  ) + 24;
}

function nearestSection(items: readonly SectionNavigationItem[]) {
  const sections = items
    .map((item) => document.getElementById(item.id))
    .filter((section): section is HTMLElement => section instanceof HTMLElement);

  if (!sections.length) return "";
  const offset = navigationOffset();
  // Read each box once before updating React state.
  let closest = sections[0];
  let distance = Infinity;
  for (const section of sections) {
    const next = Math.abs(section.getBoundingClientRect().top - offset);
    if (next < distance) { closest = section; distance = next; }
  }
  return closest.id;
}

export function SectionNavigator({
  children,
  items,
  label,
  pageWidth,
}: {
  children: ReactNode;
  items: readonly SectionNavigationItem[];
  label: string;
  pageWidth: "contained" | "full";
}) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? "");
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame = 0;

    const updateActiveSection = () => {
      const nextId = nearestSection(items);
      if (nextId) setActiveId(nextId);
    };

    const scheduleUpdate = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(updateActiveSection);
    };

    scheduleUpdate();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    const mutationObserver = new MutationObserver(scheduleUpdate);
    if (contentRef.current) mutationObserver.observe(contentRef.current, { childList: true, subtree: true });

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      mutationObserver.disconnect();
    };
  }, [items]);

  const jumpToSection = (event: ReactMouseEvent<HTMLAnchorElement>, id: string) => {
    event.preventDefault();
    const target = document.getElementById(id);
    if (!target) return;
    setActiveId(id);
    target.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "start",
    });
  };

  const links = items.map((item) => {
    const active = item.id === activeId;
    return (
      <a
        className={active ? "section-navigator-link active" : "section-navigator-link"}
        href={`#${item.id}`}
        aria-current={active ? "location" : undefined}
        key={item.id}
        onClick={(event) => jumpToSection(event, item.id)}
      >
        <span>{item.label}</span>
        {item.detail && <small>{item.detail}</small>}
      </a>
    );
  });

  return (
    <div className={`section-navigator-layout section-navigator-layout-${pageWidth}`} data-page-width={pageWidth}>
      {pageWidth === "contained" && (
        <nav className="section-navigator-rail" aria-label={label}>
          <p>On this page</p>
          {links}
        </nav>
      )}
      {pageWidth === "full" ? (
        <nav className="section-navigator-topbar" aria-label={label}>
          {links}
        </nav>
      ) : (
        <nav className="section-navigator-mobile section-navigator-topbar" aria-label={`${label}, compact`}>
          {links}
        </nav>
      )}
      <div ref={contentRef} className="section-navigator-content">
        {children}
      </div>
    </div>
  );
}
