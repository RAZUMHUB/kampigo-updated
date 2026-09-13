"use client";

import { ReactNode } from "react";

type FadeInProps = {
  children: ReactNode;
  delay?: number;
};

export function FadeIn({
  children,
  delay = 0,
}: FadeInProps) {
  return (
    <div
      className="animate-in fade-in slide-in-from-bottom-4 duration-500"
      style={{
        animationDelay: `${delay}ms`,
        animationFillMode: "both",
      }}
    >
      {children}
    </div>
  );
}
