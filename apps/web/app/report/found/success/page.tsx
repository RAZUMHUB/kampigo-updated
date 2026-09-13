import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AuthGuard } from '@/components/auth/auth-guard';

export default function Page() {
  return (
    <AuthGuard>
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <CheckCircle2 className="h-14 w-14 text-amber-500" />
      <h1 className="font-display text-2xl font-bold text-ink-900">Thank you!</h1>
      <p className="max-w-xs text-sm text-ink-400">
        Your found item report is live. We&apos;ll check it against active lost item reports automatically.
      </p>
      <Link href="/" className="w-full">
        <Button className="w-full">Back to home</Button>
      </Link>
    </div>
    </AuthGuard>
  );
}