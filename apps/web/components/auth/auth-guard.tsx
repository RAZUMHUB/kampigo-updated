'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';

export function AuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { authenticated } = useAuth();

  useEffect(() => {
    if (!authenticated) {
      router.replace('/auth');
      router.refresh();
    }
  }, [authenticated, router]);

  if (!authenticated) {
    return null;
  }

  return <>{children}</>;
}
