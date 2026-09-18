"use client";
import { useEffect, useState } from "react";

export function InstalledVersion() {
  const [version, setVersion] = useState<string | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/version", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Version unavailable");
        const data = await response.json();
        if (
          typeof data.version !== "string" ||
          !/^\d+\.\d+\.\d+(?:-[\w.]+)?$/.test(data.version)
        )
          throw new Error("Invalid version");
        setVersion(data.version);
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);
  return (
    <p
      className="installed-version"
      style={{
        padding: "12px 10px 4px",
        margin: 0,
        fontSize: "12px",
        color: "var(--aub-text-dim)",
      }}
      aria-label="Installed Vorton version"
    >
      {version ? `Vorton ${version}` : "Vorton · version unavailable"}
    </p>
  );
}
