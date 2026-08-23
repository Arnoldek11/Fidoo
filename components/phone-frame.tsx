import type { ReactNode } from "react";

export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-64 rounded-[2.5rem] border-8 border-neutral-900 bg-neutral-900 shadow-xl">
      <div className="relative overflow-hidden rounded-[2rem] bg-muted">
        <div className="absolute top-2 left-1/2 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-neutral-900" />
        <div className="px-3 pt-10 pb-8">{children}</div>
      </div>
    </div>
  );
}
