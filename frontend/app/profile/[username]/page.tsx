'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Profile } from '../../../components/Profile';
import { useAppStore } from '../../../lib/store';
import { createUsernameSlug } from '../../../lib/slug-utils';

export default function UserProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const { openUserProfile, viewedUser } = useAppStore();
  const [isResolving, setIsResolving] = useState(true);

  useEffect(() => {
    if (!username) return;

    setIsResolving(true);
    void openUserProfile({ username, wallet: '', avatar: '' })
      .finally(() => setIsResolving(false));
  }, [username, openUserProfile]);

  const hasResolvedTarget = Boolean(
    viewedUser && (
      viewedUser.username === username
      || viewedUser.slug === username
      || createUsernameSlug(viewedUser.username) === username
    )
  );

  if (isResolving) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-white/10 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!hasResolvedTarget) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        Profile not found
      </div>
    );
  }

  return <Profile />;
}
