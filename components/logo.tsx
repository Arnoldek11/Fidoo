import Image from "next/image";

type LogoProps = {
  className?: string;
};

/**
 * Full "fidoo" wordmark — the actual brand asset (public/brand/), not a
 * hand-drawn approximation. next/image handles resizing/format automatically;
 * callers control display size the same way as before, via `className`
 * (e.g. "h-4 w-auto"), relying on the real intrinsic aspect ratio (1249x433).
 */
export function Logo({ className }: LogoProps) {
  return (
    <Image
      src="/brand/fidoo-wordmark.png"
      alt="fidoo"
      width={1249}
      height={433}
      priority
      className={className}
    />
  );
}

/**
 * Icon-only mark: the connected "oo" loop on its own, for compact contexts
 * (collapsed sidebar, loading states). Cropped from the same source asset
 * as Logo, so it's always visually consistent with the wordmark.
 */
export function LogoMark({ className }: LogoProps) {
  return (
    <Image
      src="/brand/fidoo-oo-mark.png"
      alt="fidoo"
      width={535}
      height={336}
      className={className}
    />
  );
}
