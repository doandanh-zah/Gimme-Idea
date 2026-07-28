'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AlertTriangle, Ban, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api-client';

const AdminDashboard = dynamic(() => import('./AdminDashboardContent'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
      <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
    </div>
  ),
});

function AdminGateMessage({
  icon,
  title,
  message,
  actionLabel,
  onAction,
}: {
  icon: 'auth' | 'denied';
  title: string;
  message: string;
  actionLabel: string;
  onAction: () => void;
}) {
  const Icon = icon === 'auth' ? AlertTriangle : Ban;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
      <div className="w-full max-w-sm mx-4">
        <div className="bg-[#111] border border-red-500/20 rounded-2xl p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-full bg-red-500/10 border border-red-500/20">
              <Icon className="w-8 h-8 text-red-400" />
            </div>
          </div>
          <h1 className="text-xl font-bold text-white mb-2">{title}</h1>
          <p className="text-sm text-gray-500 mb-6">{message}</p>
          <button
            onClick={onAction}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 rounded-lg transition-colors"
          >
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardShell() {
  const { user, isLoading: authLoading } = useAuth();
  const userId = user?.id;
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    const checkAdminStatus = async () => {
      if (authLoading) return;

      if (!userId) {
        setIsAdmin(false);
        return;
      }

      const response = await apiClient.getAdminStatus();
      if (!cancelled) {
        setIsAdmin(response.success && response.data?.isAdmin === true);
      }
    };

    checkAdminStatus();

    return () => {
      cancelled = true;
    };
  }, [authLoading, userId]);

  if (authLoading || isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <AdminGateMessage
        icon="auth"
        title="Authentication Required"
        message="You must be logged in to access the admin panel."
        actionLabel="Go to Login"
        onAction={() => router.push('/auth/login')}
      />
    );
  }

  if (!isAdmin) {
    return (
      <AdminGateMessage
        icon="denied"
        title="Access Denied"
        message="You do not have admin privileges to access this panel."
        actionLabel="Go Home"
        onAction={() => router.push('/')}
      />
    );
  }

  return <AdminDashboard />;
}
