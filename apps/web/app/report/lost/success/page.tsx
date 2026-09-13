import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AuthGuard } from '@/components/auth/auth-guard';

export default function Page() {
  return (
    <AuthGuard>
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <CheckCircle2 className="h-14 w-14 text-amber-500" />
      <h1 className="font-display text-2xl font-bold text-ink-900">Report published</h1>
      <p className="max-w-xs text-sm text-ink-400">
        We&apos;re already checking for possible matches in the background. You&apos;ll be notified the moment
        something turns up.
      </p>
      <div className="mt-2 flex w-full flex-col gap-2">
        <Link href="/matches">
          <Button className="w-full">View possible matches</Button>
        </Link>
        <Link href="/">
          <Button variant="ghost" className="w-full">
            Back to home
          </Button>
        </Link>
      </div>
    </div>
    </AuthGuard>
  );
}