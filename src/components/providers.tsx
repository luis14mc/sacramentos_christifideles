'use client';

import { SessionProvider } from 'next-auth/react';
import { PermissionsProvider } from '@/contexts/PermissionsContext';

export default function Providers({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SessionProvider>
      <PermissionsProvider>{children}</PermissionsProvider>
    </SessionProvider>
  );
}
