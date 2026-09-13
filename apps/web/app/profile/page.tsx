'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  Bell,
  ChevronRight,
  LogOut,
  ShieldCheck,
  User,
} from 'lucide-react';
import { api } from '@/lib/api-client';
import { WalletPanel } from '@/components/wallet/wallet-panel';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AuthGuard } from '@/components/auth/auth-guard';

export default function ProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const hasAccessToken = api.hasAccessToken();

  const handleLogout = () => {
    api.clearTokens();
    queryClient.clear();
    router.replace('/auth');
  };

  const { data: profile, isLoading } = useQuery<any>({
    queryKey: ['me'],
    queryFn: () => api.get('/users/me'),
    enabled: hasAccessToken,
  });

  return (
    <AuthGuard>
    <div className="px-4 py-6 sm:px-6 md:px-8 md:py-10">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-8">
          <p className="mb-2 text-sm font-medium text-ink-400">
            Your account
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink-900 md:text-4xl">
            Profile
          </h1>
        </header>

        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="flex flex-col gap-5">
            <div className="rounded-card border border-ink-100 bg-surface-raised p-6 shadow-sm">
              {isLoading ? (
                <Skeleton className="h-20 w-full" />
              ) : (
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-ink-700 text-surface">
                    <User className="h-6 w-6" />
                  </div>

                  <div className="min-w-0">
                    <h2 className="truncate font-display text-xl font-bold text-ink-900">
                      {profile?.displayName ?? 'Campus user'}
                    </h2>
                    <p className="mt-1 truncate text-sm text-ink-400">
                      {profile?.university?.name ?? 'Your university'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <WalletPanel />
          </section>

          <section className="flex flex-col gap-4">
            <Card className="group flex items-center gap-4 transition hover:border-ink-200">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-50">
                <Bell className="h-5 w-5 text-ink-500" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink-800">
                  Notification preferences
                </p>
                <p className="mt-1 text-xs leading-5 text-ink-400">
                  Manage match, chat, and university alert notifications.
                </p>
              </div>

              <ChevronRight className="h-5 w-5 text-ink-300" />
            </Card>

            <Card className="group flex items-center gap-4 transition hover:border-ink-200">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-50">
                <ShieldCheck className="h-5 w-5 text-ink-500" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink-800">
                  Report a concern
                </p>
                <p className="mt-1 text-xs leading-5 text-ink-400">
                  Flag a suspicious post or user to your university admin.
                </p>
              </div>

              <ChevronRight className="h-5 w-5 text-ink-300" />
            </Card>

            <button
              type="button"
              onClick={handleLogout}
              className="mt-2 flex items-center justify-center gap-2 rounded-xl border border-red-100 bg-surface-raised py-3.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </section>
        </div>
      </div>
    </div>
    </AuthGuard>
  );
}
