'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Search,
  PlusCircle,
  Sparkles,
  User,
  PackageSearch,
  Car,
  ShoppingBag,
} from 'lucide-react';
import { clsx } from 'clsx';

const DESKTOP_NAV_ITEMS = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/search', label: 'Lost & Found', icon: Search },
  { href: '/ride-sharing', label: 'Ride Sharing', icon: Car },
  { href: '/clothes-rental', label: 'Clothes Rental', icon: ShoppingBag },
  { href: '/report', label: 'Report', icon: PlusCircle, primary: true },
  { href: '/profile', label: 'Profile', icon: User },
];

const MOBILE_NAV_ITEMS = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/report', label: 'Report', icon: PlusCircle, primary: true },
  { href: '/profile', label: 'Profile', icon: User },
];

function isPathActive(pathname: string, href: string) {
  if (href === '/') {
    return pathname === '/';
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function BottomNav() {
  const pathname = usePathname();

  if (pathname === '/auth') {
    return null;
  }

  return (
    <>
      <header className="sticky top-0 z-50 hidden border-b border-ink-100 bg-surface-raised/90 backdrop-blur-xl md:block">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-700 text-white">
              <PackageSearch className="h-5 w-5" />
            </span>

            <div>
              <p className="font-display text-base font-bold leading-tight text-ink-900">
                Campigo
              </p>
              <p className="text-xs text-ink-400">
                Everything Students Need. One App.
              </p>
            </div>
          </Link>

          <nav className="flex items-center gap-1" aria-label="Primary">
            {DESKTOP_NAV_ITEMS.map(({ href, label, icon: Icon, primary }) => {
              const isActive = isPathActive(pathname, href);

              if (primary) {
                return (
                  <Link
                    key={href}
                    href={href}
                    className="ml-2 flex items-center gap-2 rounded-xl bg-ink-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-ink-800"
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                );
              }

              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={isActive ? 'page' : undefined}
                  className={clsx(
                    'flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition',
                    isActive
                      ? 'bg-ink-50 text-ink-800'
                      : 'text-ink-400 hover:bg-ink-50 hover:text-ink-700',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <nav
        className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-w-lg items-end justify-between border-t border-ink-100 bg-surface-raised/95 px-4 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 backdrop-blur md:hidden"
        aria-label="Mobile primary"
      >
        {MOBILE_NAV_ITEMS.map(({ href, label, icon: Icon, primary }) => {
          const isActive = isPathActive(pathname, href);

          if (primary) {
            return (
              <Link
                key={href}
                href={href}
                className="-mt-6 flex flex-col items-center gap-1"
                aria-label={label}
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-ink-700 text-white shadow-lg shadow-ink-700/30 transition-transform active:scale-95">
                  <Icon className="h-6 w-6" strokeWidth={2.2} />
                </span>
                <span className="text-xs font-medium text-ink-700">
                  {label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={href}
              href={href}
              className="flex min-w-0 flex-1 flex-col items-center gap-1 px-2 py-1"
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon
                className={clsx(
                  'h-5 w-5',
                  isActive ? 'text-ink-700' : 'text-ink-300',
                )}
              />
              <span
                className={clsx(
                  'text-xs',
                  isActive
                    ? 'font-semibold text-ink-700'
                    : 'text-ink-400',
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
