"use client";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { LoadProgress } from "./load-progress";
import "./loading-indicator.css";

type Progress = { completed: number; total: number };

/** Shared AubOS surface spinner; progress counts completed work, never elapsed time. */
export function LoadingIndicator({
  label,
  detail,
  compact = false,
  progress,
  activity,
}: {
  label: string;
  detail?: string;
  compact?: boolean;
  progress?: Progress;
  activity?: LoadProgress;
}) {
  const container = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const node = container.current;
    if (!node || compact) return;
    // Size from the actual placement, whether startup has no header or the
    // loader sits inside navigation, page padding, or an embedded view.
    const parents: HTMLElement[] = [];
    for (let parent = node.parentElement; parent; parent = parent.parentElement) {
      parents.push(parent);
    }
    const measure = () => {
      const top = Math.max(0, node.getBoundingClientRect().top + window.scrollY);
      const bottom = parents.reduce(
        (total, parent) => total + (parseFloat(getComputedStyle(parent).paddingBottom) || 0),
        0,
      );
      node.style.setProperty("--aub-loading-inset", `${top + bottom}px`);
    };
    measure();
    const observer = new ResizeObserver(measure);
    parents.forEach((parent) => observer.observe(parent));
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
      node.style.removeProperty("--aub-loading-inset");
    };
  }, [compact]);
  const [clock, setClock] = useState({ label, seconds: 0 });
  const elapsed = clock.label === label ? clock.seconds : 0;
  useEffect(() => {
    const started = Date.now();
    const timer = setInterval(
      () =>
        setClock({ label, seconds: Math.floor((Date.now() - started) / 1000) }),
      1000,
    );
    return () => clearInterval(timer);
  }, [label]);
  const stage = activity
    ? {
        waiting: "Waiting for the server",
        downloading: "Downloading records",
        checking: "Checking records",
        preparing: "Preparing view",
      }[activity.phase]
    : detail;
  const download =
    activity?.phase === "downloading" && activity.total
      ? { completed: activity.loaded, total: activity.total }
      : undefined;
  const candidate = download ?? progress;
  const measured =
    candidate &&
    Number.isFinite(candidate.completed) &&
    Number.isFinite(candidate.total) &&
    candidate.total > 0 &&
    candidate.completed >= 0 &&
    candidate.completed <= candidate.total
      ? candidate
      : undefined;
  return (
    <div
      ref={container}
      className={`aub-loading${compact ? " aub-loading--compact" : ""}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <span className="aub-loading__spinner" aria-hidden="true" />
      <p className="aub-loading__label">{label}</p>
      {stage && <p className="aub-loading__detail">{stage}</p>}
      {measured && (
        <>
          <progress
            className="aub-loading__progress"
            aria-label={download ? `${label}: download` : label}
            value={measured.completed}
            max={measured.total}
          />
          <span className="aub-loading__detail">
            {download
              ? `${Math.floor((measured.completed / measured.total) * 100)}% downloaded · ${formatBytes(measured.completed)} of ${formatBytes(measured.total)}`
              : `${measured.completed} of ${measured.total} steps complete`}
          </span>
        </>
      )}
      {!measured &&
        activity?.phase === "downloading" &&
        activity.loaded > 0 && (
          <span className="aub-loading__detail">
            {formatBytes(activity.loaded)} received
          </span>
        )}
      {elapsed >= 10 && (
        <span className="aub-loading__detail" aria-hidden="true">
          {elapsed}s elapsed
        </span>
      )}
      {elapsed >= 30 && (
        <p className="aub-loading__detail">
          {activity?.phase === "waiting"
            ? "The server has not responded yet."
            : "Still loading. You can keep this page open."}
        </p>
      )}
    </div>
  );
}

function formatBytes(bytes: number) {
  return bytes >= 1_000_000
    ? `${(bytes / 1_000_000).toFixed(1)} MB`
    : `${Math.round(bytes / 1000)} KB`;
}
