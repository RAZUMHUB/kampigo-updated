'use client';

import { useQuery } from '@tanstack/react-query';
import {
  CalendarDays,
  MapPin,
  PackageSearch,
  Sparkles,
} from 'lucide-react';
import { api } from '@/lib/api-client';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AuthGuard } from '@/components/auth/auth-guard';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { MatchTierBadge } from '@/components/matches/match-tier-badge';

interface LostItem {
  id: string;
  title?: string;
}

interface FoundItem {
  id?: string;
  title?: string;
  description?: string;
  brand?: string;
  primaryColor?: string;
  nearbyLandmark?: string;
  floorOrZone?: string;
  foundDate?: string;
}

type MatchTier = 'HIGHLY_LIKELY' | 'POSSIBLE' | 'WEAK';

interface Match {
  id: string;
  tier: MatchTier;
  foundItem: FoundItem;
}

export default function MatchesPage() {
  const {
    data: lostItems,
    isLoading: itemsLoading,
    isError: itemsError,
    refetch: refetchItems,
  } = useQuery<LostItem[]>({
    queryKey: ['me', 'lost-items'],
    queryFn: () => api.get('/users/me/lost-items'),
  });

  return (
    <AuthGuard>
    <main className="px-4 py-6 sm:px-6 md:px-8 md:py-10">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-7 max-w-2xl md:mb-9">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-600">
            Automatic matching
          </p>

          <h1 className="font-display text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
            Your possible matches.
          </h1>

          <p className="mt-3 text-sm leading-6 text-ink-400 sm:text-base">
            We compare your lost reports with found items across your campus.
          </p>
        </header>

        {itemsLoading && <MatchesPageSkeleton />}

        {itemsError && (
          <ErrorState
            message="Couldn't load your lost reports."
            onRetry={() => refetchItems()}
          />
        )}

        {!itemsLoading &&
          !itemsError &&
          (!lostItems || lostItems.length === 0) && (
            <EmptyState
              icon={<Sparkles className="h-8 w-8 text-ink-300" />}
              title="No matches to show yet"
              description="Report a lost item and we'll automatically surface possible matches here."
            />
          )}

        {!itemsLoading &&
          !itemsError &&
          lostItems &&
          lostItems.length > 0 && (
            <div className="grid gap-5 lg:grid-cols-2 lg:gap-6">
              {lostItems.map((item) => (
                <MatchesForItem
                  key={item.id}
                  lostItemId={item.id}
                  title={item.title || 'Untitled lost report'}
                />
              ))}
            </div>
          )}
      </div>
    </main>
    </AuthGuard>
  );
}

function MatchesForItem({
  lostItemId,
  title,
}: {
  lostItemId: string;
  title: string;
}) {
  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery<Match[]>({
    queryKey: ['matches', 'for-lost-item', lostItemId],
    queryFn: () =>
      api.get(`/matches/for-lost-item/${lostItemId}`),
  });

  if (isLoading) {
    return <Skeleton className="h-64 w-full rounded-card" />;
  }

  if (isError) {
    return (
      <section className="rounded-card border border-ink-100 bg-surface-raised p-5 shadow-sm">
        <p className="mb-4 truncate text-sm font-semibold text-ink-800">
          {title}
        </p>

        <ErrorState
          message="Couldn't load matches for this report."
          onRetry={() => refetch()}
        />
      </section>
    );
  }

  const matches = data ?? [];

  return (
    <section className="flex min-w-0 flex-col rounded-card border border-ink-100 bg-surface-raised p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex min-w-0 items-start justify-between gap-3 border-b border-ink-100 pb-4">
        <div className="min-w-0">
          <p className="text-xs font-medium text-ink-400">
            Matches for
          </p>

          <h2 className="mt-1 truncate font-display text-lg font-semibold text-ink-900">
            {title}
          </h2>
        </div>

        <div className="flex flex-shrink-0 items-center gap-1.5 rounded-full bg-ink-50 px-3 py-1.5">
          <Sparkles className="h-3.5 w-3.5 text-amber-600" />

          <span className="text-xs font-semibold text-ink-600">
            {matches.length}
          </span>
        </div>
      </div>

      {matches.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-ink-100 px-5 py-10 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink-50">
            <PackageSearch className="h-5 w-5 text-ink-300" />
          </div>

          <p className="mt-4 text-sm font-semibold text-ink-700">
            No possible match yet
          </p>

          <p className="mt-1 max-w-xs text-xs leading-5 text-ink-400">
            We will keep comparing this lost report with found items.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {matches.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function MatchCard({ match }: { match: Match }) {
  const item = match.foundItem;

  const location =
    item.nearbyLandmark ||
    item.floorOrZone ||
    'Location not provided';

  return (
    <Card className="flex min-w-0 flex-col gap-3 overflow-hidden p-4 transition duration-200 hover:border-ink-200 hover:shadow-md">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-ink-50">
          <PackageSearch className="h-5 w-5 text-ink-500" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-ink-900">
            {item.title || 'Untitled found report'}
          </p>

          {(item.brand || item.primaryColor) && (
            <p className="mt-1 truncate text-xs font-medium text-ink-400">
              {[item.brand, item.primaryColor]
                .filter(Boolean)
                .join(' · ')}
            </p>
          )}
        </div>

        <div className="flex-shrink-0">
          <MatchTierBadge tier={match.tier} />
        </div>
      </div>

      {item.description && (
        <p className="line-clamp-2 text-sm leading-6 text-ink-400">
          {item.description}
        </p>
      )}

      <div className="flex flex-col gap-2 border-t border-ink-100 pt-3 text-xs text-ink-400">
        <div className="flex min-w-0 items-center gap-2">
          <MapPin className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">{location}</span>
        </div>

        {item.foundDate && (
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 flex-shrink-0" />
            <span>{formatDate(item.foundDate)}</span>
          </div>
        )}
      </div>
    </Card>
  );
}

function MatchesPageSkeleton() {
  return (
    <div className="grid gap-5 lg:grid-cols-2 lg:gap-6">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton
          key={index}
          className="h-64 w-full rounded-card"
        />
      ))}
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}
