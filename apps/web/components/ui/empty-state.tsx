import { ReactNode } from 'react';

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-ink-200 px-6 py-12 text-center">
      {icon}
      <p className="font-display text-lg font-semibold text-ink-800">{title}</p>
      {description && <p className="max-w-xs text-sm text-ink-400">{description}</p>}
      {action}
    </div>
  );
}
