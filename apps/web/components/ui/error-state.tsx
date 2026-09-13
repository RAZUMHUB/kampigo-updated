import { AlertTriangle } from 'lucide-react';
import { Button } from './button';

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-card border border-red-200 bg-red-50 px-6 py-8 text-center"
    >
      <AlertTriangle className="h-6 w-6 text-red-600" />
      <p className="text-sm text-red-700">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
