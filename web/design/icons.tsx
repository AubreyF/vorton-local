import type { ReactNode, SVGProps } from "react";

type IconProps = Omit<SVGProps<SVGSVGElement>, "height" | "width"> & {
  size?: number | string;
};

function StrokeIcon({
  children,
  size = 18,
  strokeWidth = 1.75,
  ...props
}: IconProps & { children: ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      focusable="false"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      viewBox="0 0 24 24"
      width={size}
      {...props}
    >
      {children}
    </svg>
  );
}

export function SunIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M19.07 4.93l-1.41 1.41M6.34 17.66l-1.41 1.41" />
    </StrokeIcon>
  );
}

export function MoonIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </StrokeIcon>
  );
}

export function StarshipIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M12 3l1.55 5.45L19 10l-5.45 1.55L12 17l-1.55-5.45L5 10l5.45-1.55L12 3z" />
      <path d="M18.5 15.5l.7 2.3 2.3.7-2.3.7-.7 2.3-.7-2.3-2.3-.7 2.3-.7.7-2.3z" />
    </StrokeIcon>
  );
}

export function CampingIcon(props: IconProps) {
  return (
    <StrokeIcon {...props} strokeWidth={1.55}>
      <path d="M2.5 20h19" />
      <path d="M4.5 20 11 6l6.5 14M11 6v14M8.1 20l2.9-6 3 6" />
      <path d="M18.9 4.2a3.15 3.15 0 0 0 1.45 5.9 4.25 4.25 0 1 1-1.45-5.9z" />
      <path d="M5.1 6.2v2.2M4 7.3h2.2" />
    </StrokeIcon>
  );
}

export function EnergyIcon(props: IconProps) {
  return (
    <StrokeIcon {...props} strokeWidth={1.55}>
      <path d="M13.2 2.8 5.8 13h5.4l-.4 8.2L18.2 11h-5.4l.4-8.2z" />
      <path d="M3 20.5h3M18 20.5h3" />
    </StrokeIcon>
  );
}

export function VocabularyIcon(props: IconProps) {
  return (
    <StrokeIcon {...props} strokeWidth={1.55}>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5v-16z" />
      <path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5v-16z" />
      <path d="M7 7h2M7 10h2M15 7h2M15 10h2" />
    </StrokeIcon>
  );
}

export function ExportIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M12 3v11" />
      <path d="m8 10 4 4 4-4" />
      <path d="M5 16v4h14v-4" />
    </StrokeIcon>
  );
}

export function RolodexIcon(props: IconProps) {
  return <StrokeIcon {...props}><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 2v4M16 2v4M15 11h3M15 15h3"/><circle cx="9" cy="11" r="2"/><path d="M5.5 18v-1a3.5 3.5 0 0 1 7 0v1"/></StrokeIcon>;
}
