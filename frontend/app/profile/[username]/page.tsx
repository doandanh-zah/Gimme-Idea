'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Profile } from '../../../components/Profile';
import { useAppStore } from '../../../lib/store';
import { WalletRouteBoundary } from '../../../components/wallet/WalletRouteBoundary';

function ProfileSkeleton() {
  return (
    <main className="min-h-screen px-4 pb-16 pt-28 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center gap-3 text-sm text-gray-400">
          <Loader2 className="h-4 w-4 animate-spin text-[#FFD700]" aria-hidden="true" />
          Loading profile
        </div>
        <section className="mt-6 overflow-hidden border border-white/10 bg-white/[0.03]">
          <div className="h-36 animate-pulse bg-white/10 sm:h-44" />
          <div className="p-5 sm:p-7">
            <div className="h-16 w-16 animate-pulse bg-white/10" />
            <div className="mt-5 h-8 w-56 animate-pulse bg-white/10" />
            <div className="mt-3 h-4 w-full max-w-xl animate-pulse bg-white/10" />
          </div>
        </section>
      </div>
    </main>
  );
}

export default function UserProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const openUserProfile = useAppStore((state) => state.openUserProfile);
  const isLoading = useAppStore((state) => state.isLoading);

  useEffect(() => {
    if (username) {
      // Fetch and set the viewed user profile
      openUserProfile({ username, wallet: '', avatar: '' });
    }
  }, [username, openUserProfile]);

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  return (
    <WalletRouteBoundary>
      <Profile />
    </WalletRouteBoundary>
  );
}
