import { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export function FeatureBadge({ children }: Props) {
  return (
    <span className="rounded-full border bg-muted px-3 py-1 text-xs font-medium">
      {children}
    </span>
  );
}
