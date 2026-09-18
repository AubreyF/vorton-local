"use client";
import { type ReactNode } from "react";
import { InstallationSwitcher } from "./installation-switcher";
import { ThemeControls } from "./theme-controls";
import "./workspace-shell.css";
import "./fonts.css";
import "./theme-preview.css";
import "./menu-selection.css";

export function ApplicationHeader({profile, labels, children, actions}: {profile: string; labels?: Record<string,string>; children: ReactNode; actions?: ReactNode}) {
  return <header className="topbar"><InstallationSwitcher profile={profile} labels={labels} actions={<><ThemeControls inline/>{actions}</>}/>{children}</header>;
}
