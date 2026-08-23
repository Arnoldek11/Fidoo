import type { SVGProps } from "react";

/**
 * Full "fidoo" wordmark, matching the two-tone brand mark: dark "fid" +
 * coral connected "oo" (the loop evokes the relationship between a
 * restaurant and its regulars). Colors follow the theme tokens directly
 * (not currentColor) so the mark stays on-brand in any context, light or
 * dark, rather than inheriting whatever text color happens to be nearby.
 */
export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="-12 -12 300 124"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="fidoo"
      role="img"
      {...props}
    >
      {/* f */}
      <rect x="0" y="0" width="18" height="100" rx="9" fill="var(--foreground)" />
      <rect x="0" y="31" width="40" height="18" rx="9" fill="var(--foreground)" />
      {/* i */}
      <rect x="52" y="40" width="18" height="60" rx="9" fill="var(--foreground)" />
      <circle cx="61" cy="18" r="11" fill="var(--foreground)" />
      {/* d */}
      <circle cx="112" cy="70" r="21" stroke="var(--foreground)" strokeWidth="18" />
      <rect x="142" y="0" width="18" height="100" rx="9" fill="var(--foreground)" />
      {/* oo — the connected loop */}
      <circle cx="202" cy="70" r="21" stroke="var(--primary)" strokeWidth="18" />
      <circle cx="246" cy="70" r="21" stroke="var(--primary)" strokeWidth="18" />
    </svg>
  );
}

/**
 * Icon-only mark: the connected "oo" loop on its own, for compact
 * contexts (collapsed sidebar, app icon source, loading states). Kept
 * currentColor-driven since this one does need to work as a knockout
 * (e.g. white on a solid coral favicon background).
 */
export function LogoMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="fidoo"
      role="img"
      {...props}
    >
      <circle cx="37" cy="50" r="16" stroke="currentColor" strokeWidth="15" />
      <circle cx="61" cy="50" r="16" stroke="currentColor" strokeWidth="15" />
    </svg>
  );
}
