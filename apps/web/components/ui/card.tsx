import { clsx } from 'clsx';
import { HTMLAttributes } from 'react';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx('rounded-card border border-ink-100 bg-surface-raised p-4 shadow-sm', className)}
      {...props}
    />
  );
}
