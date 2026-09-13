import Link from 'next/link';
import { AuthGuard } from '@/components/auth/auth-guard';
import {
  ArrowRight,
  PackagePlus,
  PackageSearch,
} from 'lucide-react';

export default function Page() {
  return (
    <AuthGuard>
      <div className="px-4 py-8 sm:px-6 md:px-8 md:py-12">
      <div className="mx-auto w-full max-w-5xl">
        <header className="mx-auto mb-10 max-w-2xl text-center">
          <p className="mb-2 text-sm font-medium text-ink-400">
            Create a report
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink-900 md:text-5xl">
            What are you reporting?
          </h1>
          <p className="mt-4 text-sm leading-6 text-ink-400 md:text-base">
            Choose the right report type and we will guide you through the next steps.
          </p>
        </header>

        <div className="grid gap-5 md:grid-cols-2">
          <Link
            href="/report/lost"
            className="group rounded-card border border-ink-100 bg-surface-raised p-6 shadow-sm transition hover:-translate-y-1 hover:border-ink-200 hover:shadow-lg md:p-8"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-ink-50 text-ink-700">
              <PackageSearch className="h-6 w-6" />
            </div>

            <h2 className="mt-8 font-display text-2xl font-bold text-ink-900">
              I lost something
            </h2>

            <p className="mt-3 text-sm leading-6 text-ink-400">
              Report a missing item and let the system search for possible matches automatically.
            </p>

            <div className="mt-8 flex items-center gap-2 text-sm font-semibold text-ink-700">
              Report lost item
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          <Link
            href="/report/found"
            className="group rounded-card border border-ink-100 bg-surface-raised p-6 shadow-sm transition hover:-translate-y-1 hover:border-amber-400 hover:shadow-lg md:p-8"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-400/15 text-amber-600">
              <PackagePlus className="h-6 w-6" />
            </div>

            <h2 className="mt-8 font-display text-2xl font-bold text-ink-900">
              I found something
            </h2>

            <p className="mt-3 text-sm leading-6 text-ink-400">
              Share a found item safely and help reconnect it with its verified owner.
            </p>

            <div className="mt-8 flex items-center gap-2 text-sm font-semibold text-amber-600">
              Report found item
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        </div>
      </div>
    </div>
    </AuthGuard>
  );
}