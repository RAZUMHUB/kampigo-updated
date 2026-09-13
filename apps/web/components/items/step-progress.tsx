import { clsx } from 'clsx';

export function StepProgress({
  step,
  totalSteps,
}: {
  step: number;
  totalSteps: number;
}) {
  const percentage = Math.round((step / totalSteps) * 100);

  return (
    <div
      className="w-full"
      role="progressbar"
      aria-valuenow={step}
      aria-valuemin={1}
      aria-valuemax={totalSteps}
    >
      <div className="mb-2 flex items-center justify-between text-xs font-medium">
        <span className="text-ink-400">
          Step {step} of {totalSteps}
        </span>
        <span className="text-ink-500">{percentage}% complete</span>
      </div>

      <div className="flex gap-1.5">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <div
            key={index}
            className={clsx(
              'h-1.5 flex-1 rounded-full transition-colors',
              index < step ? 'bg-ink-700' : 'bg-ink-100',
            )}
          />
        ))}
      </div>
    </div>
  );
}
