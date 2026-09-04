import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DevnetProgramAdmin } from '@/components/devnet-program-admin';

export const metadata: Metadata = {
  title: 'Devnet program admin',
  robots: { index: false, follow: false },
};

export default function DevnetAdminPage() {
  if (process.env.NODE_ENV === 'production' && process.env.ENABLE_DEVNET_ADMIN !== 'true') {
    notFound();
  }

  return <DevnetProgramAdmin />;
}
