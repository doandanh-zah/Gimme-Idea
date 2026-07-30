import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { Activity, RefreshCcw } from 'lucide-react';
import { apiClient } from '../lib/api-client';
import { queryKeys } from '../lib/query-keys';

interface ActivityData {
  name: string;
  ideas: number;
  feedback: number;
}

const fallbackActivity: ActivityData[] = [
  { name: 'Mon', ideas: 0, feedback: 0 },
  { name: 'Tue', ideas: 0, feedback: 0 },
  { name: 'Wed', ideas: 0, feedback: 0 },
  { name: 'Thu', ideas: 0, feedback: 0 },
  { name: 'Fri', ideas: 0, feedback: 0 },
  { name: 'Sat', ideas: 0, feedback: 0 },
  { name: 'Sun', ideas: 0, feedback: 0 },
];

const StatsDashboard: React.FC = () => {
  const statsQuery = useQuery({
    queryKey: queryKeys.ideaVelocity,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const response = await apiClient.getIdeaVelocityStats();
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch stats');
      }
      return response.data;
    },
  });

  const activityData = ((statsQuery.data?.activity || []) as ActivityData[]).length
    ? ((statsQuery.data?.activity || []) as ActivityData[])
    : fallbackActivity;
  const totalIdeas = statsQuery.data?.totalIdeas || 0;
  const totalFeedback = statsQuery.data?.totalFeedback || 0;

  if (statsQuery.isLoading) {
    return (
      <div className="w-full">
        <div className="h-80 animate-pulse border border-white/10 bg-white/[0.04]" />
      </div>
    );
  }

  if (statsQuery.isError) {
    return (
      <div className="flex min-h-[320px] flex-col justify-between border border-white/10 bg-[#0a0a0a] p-5">
        <div>
          <div className="mb-4 flex h-10 w-10 items-center justify-center border border-white/10 text-[#FFD700]">
            <Activity className="h-5 w-5" aria-hidden="true" />
          </div>
          <h3 className="font-display text-2xl font-bold text-white">Signal dashboard paused</h3>
          <p className="mt-3 max-w-md text-sm leading-6 text-gray-500">
            Activity data could not be loaded right now. The landing page stays available while
            the live signal service catches up.
          </p>
        </div>
        <button
          type="button"
          onClick={() => statsQuery.refetch()}
          className="btn-ghost mt-6 w-fit"
        >
          <RefreshCcw className="h-4 w-4" aria-hidden="true" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="relative overflow-hidden border border-white/10 bg-[#0a0a0a] p-4 sm:p-5">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <div className="ui-eyebrow mb-3">Network signal</div>
            <h3 className="font-display text-2xl font-bold text-white">
              Idea and feedback velocity
            </h3>
            <p className="mt-2 text-xs text-gray-500">
              {totalIdeas} ideas / {totalFeedback} feedback events this week
            </p>
          </div>
          <div className="flex gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 bg-[#FFD700]" aria-hidden="true" />
              Ideas
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 bg-[#9945FF]" aria-hidden="true" />
              Feedback
            </span>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={activityData} margin={{ top: 12, right: 12, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id="colorIdeas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FFD700" stopOpacity={0.34} />
                  <stop offset="95%" stopColor="#FFD700" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorFeedback" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#9945FF" stopOpacity={0.32} />
                  <stop offset="95%" stopColor="#9945FF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="#666"
                tick={{ fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                stroke="#666"
                tick={{ fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#050505',
                  border: '1px solid rgba(255,255,255,0.16)',
                  borderRadius: '6px',
                  fontSize: '12px',
                }}
                itemStyle={{ color: '#fff' }}
                labelStyle={{ color: '#8a8a8a' }}
              />
              <Area
                type="monotone"
                dataKey="ideas"
                stroke="#FFD700"
                fillOpacity={1}
                fill="url(#colorIdeas)"
                name="Ideas"
              />
              <Area
                type="monotone"
                dataKey="feedback"
                stroke="#9945FF"
                fillOpacity={1}
                fill="url(#colorFeedback)"
                name="Feedback"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default StatsDashboard;
