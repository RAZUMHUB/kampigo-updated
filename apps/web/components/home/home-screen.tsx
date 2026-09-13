'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Search,
  PackageSearch,
  PackagePlus,
  Sparkles,
  Clock,
  ArrowRight,
  GraduationCap,
  Car,
  ShoppingBag,
  ArrowUpRight,
  Clock3,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { api } from '@/lib/api-client';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';

interface Profile {
  displayName: string;
  university: { name: string };
}

interface DashboardResponse {
  stats: {
    lostItems: number;
    returnedItems: number;
    students: number;
    activeRides: number;
    clothesListings: number;
  };
  recentActivity: unknown[];
  quickActions: unknown[];
}

export function HomeScreen() {
  const hasAccessToken = api.hasAccessToken();

  const { data: profile, isLoading: profileLoading } = useQuery<Profile>({
    queryKey: ['me'],
    queryFn: () => api.get('/users/me'),
    enabled: hasAccessToken,
  });

  const { data: activeReports, isLoading: reportsLoading } = useQuery<any[]>({
    queryKey: ['me', 'lost-items'],
    queryFn: () => api.get('/users/me/lost-items'),
    enabled: hasAccessToken,
  });


  const { data: dashboard } = useQuery<DashboardResponse>({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/dashboard'),
  });

  return (
    <div className="px-4 py-6 sm:px-6 md:py-10 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <section className="overflow-hidden rounded-[2rem] border border-ink-100 bg-surface-raised shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[1.25fr_0.75fr]">
            <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-12">
              {profileLoading ? (
                <div className="flex flex-col gap-3">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-12 w-72 max-w-full" />
                </div>
              ) : (
                <>
                  <p className="mb-3 text-sm font-medium text-ink-400">
                    {profile?.university?.name ?? 'Your university'}
                  </p>

                  <h1 className="max-w-2xl font-display text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl lg:text-5xl">
                    Everything Students Need.<br />One App.
                  </h1>

                  <p className="mt-4 max-w-xl text-sm leading-6 text-ink-400 sm:text-base">
                    Lost something? Found something? Need a ride or clothes for an event? Campigo brings essential campus services together in one place.
                  </p>
                </>
              )}

              <div className="mt-6 flex flex-wrap gap-2.5 sm:gap-3">
                <span className="rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-medium">
                  🔍 Lost &amp; Found
                </span>

                <span className="rounded-full border border-violet-100 bg-violet-50 px-4 py-2 text-sm font-medium">
                  👕 Clothes Rental
                </span>

                <span className="rounded-full border border-amber-100 bg-amber-50 px-4 py-2 text-sm font-medium">
                  🚗 Ride Sharing
                </span>
              </div>

              <Link
                href="/search"
                className="mt-7 flex w-full max-w-2xl items-center gap-3 rounded-2xl border border-ink-100 bg-surface px-4 py-3.5 text-ink-400 shadow-sm transition hover:border-ink-200 hover:bg-white"
              >
                <Search className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm">
                  Search items, rides or clothes...
                </span>
              </Link>
            </div>

            <div className="grid gap-3 border-t border-ink-100 bg-ink-50/70 p-6 sm:grid-cols-2 lg:grid-cols-1 lg:border-l lg:border-t-0 lg:p-8">

              <Card className="border-0 bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-xl">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-blue-100">
                      Campigo
                    </p>

                    <h3 className="mt-2 text-xl font-bold">
                      Your Campus Super App
                    </h3>

                    <p className="mt-2 text-sm text-blue-100">
                      Lost & Found, Clothes Rental and Ride Sharing in one place.
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white/15 p-3">
                    <GraduationCap className="h-8 w-8" />
                  </div>
                </div>
              </Card>


              <div className="grid grid-cols-3 gap-3">

                <Card className="p-3 text-center sm:p-4">
                  <p className="text-xl font-bold text-blue-600 sm:text-2xl">{dashboard?.stats.lostItems ?? '--'}</p>
                  <p className="mt-1 text-xs text-ink-500">
                    Lost Items
                  </p>
                </Card>

                <Card className="p-3 text-center sm:p-4">
                  <p className="text-xl font-bold text-emerald-600 sm:text-2xl">{dashboard?.stats.returnedItems ?? '--'}</p>
                  <p className="mt-1 text-xs text-ink-500">
                    Returned
                  </p>
                </Card>

                <Card className="p-3 text-center sm:p-4">
                  <p className="text-xl font-bold text-violet-600 sm:text-2xl">{dashboard?.stats.students ?? '--'}</p>
                  <p className="mt-1 text-xs text-ink-500">
                    Students
                  </p>
                </Card>

              </div>

              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-ink-900">
                    Quick Services
                  </h3>

                  <p className="text-sm text-ink-500">
                    Everything you need around your campus.
                  </p>
                </div>
              </div>

              <ActionCard
                href="/report/lost"
                icon={<PackageSearch className="h-6 w-6" />}
                title="Report Lost Item"
                description="Tell us what went missing and start automatic matching."
              />

              <ActionCard
                href="/report/found"
                icon={<PackagePlus className="h-6 w-6 text-amber-500" />}
                title="Report Found Item"
                description="Found something on campus? Help return it safely."
              />

              <ActionCard
                href="/ride-sharing"
                icon={<Car className="h-6 w-6 text-blue-500" />}
                title="Ride Sharing"
                description="Find or offer rides around your campus."
                
              />

              <ActionCard
                href="/clothes-rental"
                icon={<ShoppingBag className="h-6 w-6 text-violet-500" />}
                title="Clothes Rental"
                description="Rent outfits for college events and special occasions."
                
              />
            </div>
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-2">
          <section className="flex min-w-0 flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-ink-900">
                <Sparkles className="h-5 w-5 text-amber-500" />
                Possible Matches
              </h2>

              <Link
                href="/matches"
                className="flex items-center gap-1 text-sm font-medium text-ink-500 transition hover:text-ink-800"
              >
                See all
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <MatchesPreview />
          </section>

          <section className="flex min-w-0 flex-col gap-4">
            <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-ink-900">
              <Clock className="h-5 w-5 text-ink-400" />
              Your Active Reports
            </h2>

            {reportsLoading ? (
              <div className="flex flex-col gap-2">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : !activeReports || activeReports.length === 0 ? (
              <EmptyState
                title="No active reports yet"
                description="Reports you file will show up here so you can track their status."
              />
            ) : (
              <div className="flex flex-col gap-3">
                {activeReports.map((item) => (
                  <Card
                    key={item.id}
                    className="flex items-center justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-ink-800">
                        {item.title}
                      </p>
                      <p className="text-xs text-ink-400">{item.status}</p>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>

        <section className="flex flex-col gap-5">
          <div>
            <h2 className="font-display text-2xl font-bold text-ink-900">
              Explore Campus Services
            </h2>

            <p className="mt-1 text-sm text-ink-500">
              Everything you need during your campus life.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <ActionCard
              href="/search"
              icon={<PackageSearch className="h-6 w-6 text-blue-600" />}
              title="Lost & Found"
              description="Search or recover lost belongings."
            />

            <ActionCard
              href="/ride-sharing"
              icon={<Car className="h-6 w-6 text-amber-600" />}
              title="Ride Sharing"
              description="Offer or find rides around campus."
            />

            <ActionCard
              href="/clothes-rental"
              icon={<ShoppingBag className="h-6 w-6 text-violet-600" />}
              title="Clothes Rental"
              description="Rent outfits for campus events."
            />

            <Card className="flex items-start gap-4">
              <span className="rounded-xl bg-emerald-100 p-3">
                <ShieldCheck className="h-6 w-6 text-emerald-700" />
              </span>

              <div>
                <h3 className="font-semibold text-ink-900">
                  Safe Campus
                </h3>

                <p className="mt-1 text-sm text-ink-500">
                  Helping students through trusted campus services.
                </p>
              </div>
            </Card>

          </div>
        </section>

      </div>
    </div>
  );
}

function ActionCard({
  href,
  icon,
  title,
  description,
  badge,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: string;
}) {
  return (
    <Link href={href} className="group block">
      <Card className="flex h-full items-start gap-4 transition group-hover:-translate-y-0.5 group-hover:border-ink-200 group-hover:shadow-md">
        <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-white text-ink-700 shadow-sm">
          {icon}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-ink-900">{title}</p>

            {badge && (
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700">
                {badge}
              </span>
            )}
          </div>

          <p className="mt-1 text-sm leading-5 text-ink-400">
            {description}
          </p>
        </div>

        <ArrowRight className="mt-1 h-4 w-4 flex-shrink-0 text-ink-300 transition group-hover:translate-x-1 group-hover:text-ink-600" />
      </Card>
    </Link>
  );
}

function MatchesPreview() {
  const hasAccessToken = api.hasAccessToken();


  const { data, isLoading } = useQuery<any[]>({
    queryKey: ['matches', 'preview'],
    queryFn: async () => {
      const lostItems = await api.get<Array<{ id: string }>>('/users/me/lost-items');

      if (lostItems.length === 0) {
        return [];
      }

      const matchGroups = await Promise.all(
        lostItems.map((item) => api.get<any[]>(`/matches/for-lost-item/${item.id}`))
      );

      return matchGroups.flat().slice(0, 3);
    },
    enabled: hasAccessToken,
  });

  if (isLoading) {
    return <Skeleton className="h-32 w-full" />;
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        title="No matches yet"
        description="We'll notify you the moment something matching your report turns up."
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {data.map((match) => (
        <Link
          key={match.id}
          href="/matches"
          className="block"
        >
          <Card className="flex items-center justify-between gap-4 transition hover:border-ink-200 hover:shadow-md">
            <div className="min-w-0">
              <p className="truncate font-medium text-ink-800">
                {match.foundItem?.title ?? 'Possible found item'}
              </p>
              <p className="mt-1 text-xs text-ink-400">
                {match.tier ?? 'Possible match'}
              </p>
            </div>

            <ArrowRight className="h-4 w-4 flex-shrink-0 text-ink-300" />
          </Card>
        </Link>
      ))}
    </div>
  );
}
