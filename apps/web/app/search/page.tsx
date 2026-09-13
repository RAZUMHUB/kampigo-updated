'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search as SearchIcon } from 'lucide-react';
import { api } from '@/lib/api-client';
import { Skeleton } from '@/components/ui/skeleton';
import { AuthGuard } from '@/components/auth/auth-guard';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Card } from '@/components/ui/card';
import { clsx } from 'clsx';

type Tab = 'lost' | 'found';

export default function SearchPage() {
  const [tab, setTab] = useState<Tab>('lost');
  const [query, setQuery] = useState('');

  const { data, isLoading, isError, refetch } = useQuery<{
    items: any[];
    total: number;
  }>({
    queryKey: ['search', tab, query],
    queryFn: () => api.get(`/search/${tab}?q=${encodeURIComponent(query)}`),
  });


  if (data) {
    console.log("Search Items:", data.items);
  }

  return (
    <AuthGuard>
    <div className="px-4 py-6 sm:px-6 md:px-8 md:py-10">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-8 max-w-2xl">
          <p className="mb-2 text-sm font-medium text-ink-400">
            Campus network
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink-900 md:text-4xl">
            Find what you are looking for.
          </h1>
          <p className="mt-3 text-sm leading-6 text-ink-400 md:text-base">
            Search lost and found reports shared across your university.
          </p>
        </header>

        <div className="rounded-card border border-ink-100 bg-surface-raised p-4 shadow-sm md:p-6">
          <div className="flex items-center gap-3 rounded-xl border border-ink-200 bg-surface px-4 py-3">
            <SearchIcon className="h-5 w-5 flex-shrink-0 text-ink-300" />
            <input
              className="w-full bg-transparent text-sm text-ink-900 outline-none placeholder:text-ink-300 md:text-base"
              placeholder="Search by title, brand, description..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="mt-4 flex gap-2">
            <TabButton active={tab === 'lost'} onClick={() => setTab('lost')}>
              Lost Items
            </TabButton>
            <TabButton active={tab === 'found'} onClick={() => setTab('found')}>
              Found Items
            </TabButton>
          </div>
        </div>

        <section className="mt-8">
          {isLoading && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
            </div>
          )}

          {isError && (
            <ErrorState
              message="Couldn't load results."
              onRetry={() => refetch()}
            />
          )}

          {!isLoading && !isError && (!data || data.items.length === 0) && (
            <EmptyState
              title="No results"
              description="Try a different search term, or check back later. New reports are added all the time."
            />
          )}

          {!isLoading && data && data.items.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {data.items.map((item) => (
                <Card
                  key={item.id}
                  className="flex items-center gap-4 transition hover:-translate-y-0.5 hover:border-ink-200 hover:shadow-md"
                >
                  <div className="h-16 w-16 flex-shrink-0 rounded-xl bg-ink-50" />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink-800">
                      {item.title}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-ink-400">
                      {item.description}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
    </AuthGuard>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'rounded-full px-5 py-2 text-sm font-medium transition',
        active
          ? 'bg-ink-700 text-surface shadow-sm'
          : 'bg-ink-50 text-ink-500 hover:bg-ink-100',
      )}
    >
      {children}
    </button>
  );
}
