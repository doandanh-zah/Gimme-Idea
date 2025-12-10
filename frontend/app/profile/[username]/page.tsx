'use client';

import React, { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Profile } from '../../../components/Profile';
import { useAppStore } from '../../../lib/store';

export default function UserProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const { openUserProfile, isLoading } = useAppStore();

  useEffect(() => {
    if (username) {
      // Fetch and set the viewed user profile
      openUserProfile({ username, wallet: '', avatar: '' });
    }
  }, [username, openUserProfile]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-white/10 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return <Profile />;
}
