'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  api,
  AUTH_CHANGED_EVENT,
} from '@/lib/api-client';

type AuthContextValue = {
  authenticated: boolean;
};

const AuthContext = createContext<AuthContextValue>({
  authenticated: false,
});

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [authenticated, setAuthenticated] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const sync = () => {
      setAuthenticated(api.hasAccessToken());
    };

    sync();

    window.addEventListener(
      AUTH_CHANGED_EVENT,
      sync,
    );

    return () => {
      window.removeEventListener(
        AUTH_CHANGED_EVENT,
        sync,
      );
    };
  }, []);

  const value = useMemo(
    () => ({
      authenticated,
    }),
    [authenticated],
  );

  if (!mounted) {
    return null;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
