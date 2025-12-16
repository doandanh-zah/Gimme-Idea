import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface ActivityData {
  name: string;
  ideas: number;
  feedback: number;
}

const StatsDashboard: React.FC = () => {
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalIdeas, setTotalIdeas] = useState(0);
  const [totalFeedback, setTotalFeedback] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch all ideas to calculate stats
        const response = await axios.get(`${API_URL}/projects?type=idea&limit=1000`);
        const ideas = response.data.data || [];
        
        setTotalIdeas(ideas.length);
        
        // Calculate total feedback
        const feedbackSum = ideas.reduce((sum: number, idea: any) => sum + (idea.feedbackCount || 0), 0);
        setTotalFeedback(feedbackSum);
        
        // Group by day of week (based on creation date)
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayMap: Record<string, { ideas: number; feedback: number }> = {};
        days.forEach(day => { dayMap[day] = { ideas: 0, feedback: 0 }; });
        
        ideas.forEach((idea: any) => {
          if (idea.createdAt) {
            const date = new Date(idea.createdAt);
            const dayName = days[date.getDay()];
            dayMap[dayName].ideas += 1;
            dayMap[dayName].feedback += idea.feedbackCount || 0;
          }
        });
        
        // Convert to chart data starting from Monday
        const orderedDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const actData: ActivityData[] = orderedDays.map(day => ({
          name: day,
          ideas: dayMap[day].ideas,
          feedback: dayMap[day].feedback
        }));
        
        setActivityData(actData);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
        // Fallback empty data
        setActivityData([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="w-full p-6">
        <div className="glass-panel rounded-2xl p-6 h-80 animate-pulse bg-white/5" />
      </div>
    );
  }

  return (
    <div className="w-full p-6">
      
      {/* Main Activity Chart */}
      <div className="glass-panel rounded-2xl p-6 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-display font-bold text-white">Idea & Feedback Velocity</h3>
            <p className="text-xs text-gray-500 mt-1">{totalIdeas} ideas • {totalFeedback} feedback</p>
          </div>
          <div className="flex gap-4 text-xs">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gold"></span> Ideas</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500"></span> Feedback</span>
          </div>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={activityData}>
              <defs>
                <linearGradient id="colorIdeas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ffd700" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ffd700" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorFeedback" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
              <XAxis dataKey="name" stroke="#666" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
              <YAxis stroke="#666" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px', fontSize: '12px' }}
                itemStyle={{ color: '#fff' }}
              />
              <Area type="monotone" dataKey="ideas" stroke="#ffd700" fillOpacity={1} fill="url(#colorIdeas)" name="Ideas" />
              <Area type="monotone" dataKey="feedback" stroke="#8884d8" fillOpacity={1} fill="url(#colorFeedback)" name="Feedback" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default StatsDashboard;