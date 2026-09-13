import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AuthGuard } from '@/components/auth/auth-guard';

export default function Page() {
  return (
    <AuthGuard>
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
        <CheckCircle2 className="h-14 w-14 text-amber-500" />
        <h1 className="font-display text-2xl font-bold text-ink-900">Listing published!</h1>
        <p className="max-w-xs text-sm text-ink-400">
          Your item is now visible to students at your university.
        </p>
        <Link href="/clothes-rental/my-listings" className="w-full">
          <Button className="w-full">View my listings</Button>
        </Link>
      </div>
    </AuthGuard>
  );
}
