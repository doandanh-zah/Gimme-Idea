import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface CategoryData {
  name: string;
  value: number;
  fill: string;
}

interface ActivityData {
  name: string;
  ideas: number;
  feedback: number;
}

const StatsDashboard: React.FC = () => {
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
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
        
        // Group by category
        const categoryMap: Record<string, number> = {};
        ideas.forEach((idea: any) => {
          const cat = idea.category || 'Other';
          categoryMap[cat] = (categoryMap[cat] || 0) + 1;
        });
        
        // Convert to chart data and sort by value
        const catData: CategoryData[] = Object.entries(categoryMap)
          .map(([name, value]) => ({
            name: name.length > 8 ? name.substring(0, 8) : name,
            value,
            fill: name === 'DeFi' ? '#ffd700' : '#4c1d95'
          }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 5);
        
        setCategoryData(catData);
        
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
        setCategoryData([]);
        setActivityData([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, []);

  // Find dominant category
  const dominantCategory = categoryData.length > 0 ? categoryData[0] : null;
  const dominancePercent = dominantCategory && totalIdeas > 0 
    ? Math.round((dominantCategory.value / totalIdeas) * 100) 
    : 0;

  if (loading) {
    return (
      <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
        <div className="glass-panel rounded-2xl p-6 lg:col-span-2 h-80 animate-pulse bg-white/5" />
        <div className="glass-panel rounded-2xl p-6 h-80 animate-pulse bg-white/5" />
      </div>
    );
  }

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
      
      {/* Main Activity Chart */}
      <div className="glass-panel rounded-2xl p-6 lg:col-span-2 relative overflow-hidden group">
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

      {/* Category Distribution */}
      <div className="glass-panel rounded-2xl p-6 relative">
        <h3 className="text-xl font-display font-bold text-white mb-6">Active Sectors</h3>
        <div className="h-64 w-full">
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={true} vertical={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="#fff" tick={{fontSize: 10, fontFamily: 'JetBrains Mono'}} width={55} />
                <Tooltip 
                  cursor={{fill: 'transparent'}}
                  contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(value: number) => [`${value} ideas`, 'Count']}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#ffd700' : '#4c1d95'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500 text-sm">
              No data available
            </div>
          )}
        </div>
        {dominantCategory && (
          <div className="mt-4 p-4 bg-white/5 rounded-xl border border-white/5">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Dominance</span>
              <span className="text-gold font-mono">{dominantCategory.name} ({dominancePercent}%)</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsDashboard;