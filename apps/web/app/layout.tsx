import type { Metadata, Viewport } from 'next';
import { QueryProvider } from '@/lib/query-provider';
import { AuthProvider } from '@/components/auth/auth-provider';
import { BottomNav } from '@/components/layout/bottom-nav';
import './globals.css';
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'Campigo',
  description: 'A private lost and found network for your university.',
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#282f4d',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn("font-sans", inter.variable)}>
      <body>
        <QueryProvider>
          <AuthProvider>
            <div className="min-h-dvh">
            <BottomNav />
            <main className="mx-auto min-h-dvh w-full max-w-7xl pb-24 md:pb-10">
              {children}
            </main>
          </div>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
