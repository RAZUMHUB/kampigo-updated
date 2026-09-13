'use client';

import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  FileSearch,
  PackageCheck,
  PackageSearch,
  ShieldCheck,
} from 'lucide-react';
import { api } from '@/lib/api-client';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AuthGuard } from '@/components/auth/auth-guard';

const METRIC_ICONS = [
  PackageSearch,
  PackageCheck,
  AlertTriangle,
  ShieldCheck,
  FileSearch,
];

export default function AdminPage() {
  const hasAccessToken = api.hasAccessToken();

  const { data, isLoading } = useQuery<any>({
    queryKey: ['admin', 'overview'],
    queryFn: () => api.get('/admin/university/overview'),
    enabled: hasAccessToken,
  });

  const metrics = [
    { label: 'Lost reports', value: data?.lostCount },
    { label: 'Found reports', value: data?.foundCount },
    { label: 'Active alerts', value: data?.activeAlerts },
    { label: 'Pending claims', value: data?.pendingClaims },
    { label: 'Open content reports', value: data?.openReports },
  ];

  return (
    <AuthGuard>
      <main className="px-4 py-6 sm:px-6 md:px-8 md:py-10">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-7 max-w-2xl md:mb-9">
          <p className="mb-2 text-sm font-medium text-ink-400">
            University overview
          </p>

          <h1 className="font-display text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
            University Admin
          </h1>

          <p className="mt-3 text-sm leading-6 text-ink-400 sm:text-base">
            Review the current lost and found activity across your university.
          </p>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {metrics.map((metric, index) => {
            const Icon = METRIC_ICONS[index];

            return (
              <Card
                key={metric.label}
                className="flex min-w-0 items-start justify-between gap-4 p-5 transition hover:border-ink-200 hover:shadow-md sm:p-6"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink-400">
                    {metric.label}
                  </p>

                  <div className="mt-3">
                    {isLoading ? (
                      <Skeleton className="h-9 w-16" />
                    ) : (
                      <p className="font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
                        {metric.value ?? 0}
                      </p>
                    )}
                  </div>
                </div>

                <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-ink-50 text-ink-600">
                  <Icon className="h-5 w-5" />
                </span>
              </Card>
            );
          })}
        </section>

        <section className="mt-6 rounded-card border border-ink-100 bg-surface-raised p-5 shadow-sm sm:p-6">
          <h2 className="font-display text-lg font-semibold text-ink-900">
            Campus activity
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-400">
            These metrics are loaded from the university administration
            overview and reflect the current reporting and claim activity.
          </p>
        </section>
      </div>
    </main>
    </AuthGuard>
  );
}