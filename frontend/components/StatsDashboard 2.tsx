import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { ACTIVITY_DATA, CHART_DATA } from '../constants';

const StatsDashboard: React.FC = () => {
  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
      
      {/* Main Activity Chart */}
      <div className="glass-panel rounded-2xl p-6 lg:col-span-2 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-display font-bold text-white">Feedback Velocity</h3>
          <div className="flex gap-2 text-xs">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gold"></span> Feedback</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500"></span> Projects</span>
          </div>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={ACTIVITY_DATA}>
              <defs>
                <linearGradient id="colorFeedback" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ffd700" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ffd700" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorProjects" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
              <XAxis dataKey="name" stroke="#666" tick={{fontSize: 12}} axisLine={false} tickLine={false} />
              <YAxis stroke="#666" tick={{fontSize: 12}} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px' }}
                itemStyle={{ color: '#fff' }}
              />
              <Area type="monotone" dataKey="feedback" stroke="#ffd700" fillOpacity={1} fill="url(#colorFeedback)" />
              <Area type="monotone" dataKey="projects" stroke="#8884d8" fillOpacity={1} fill="url(#colorProjects)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Distribution */}
      <div className="glass-panel rounded-2xl p-6 relative">
        <h3 className="text-xl font-display font-bold text-white mb-6">Active Sectors</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={CHART_DATA} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={true} vertical={false} />
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" stroke="#fff" tick={{fontSize: 12, fontFamily: 'JetBrains Mono'}} width={60} />
              <Tooltip 
                 cursor={{fill: 'transparent'}}
                 contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px' }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {CHART_DATA.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.name === 'DeFi' ? '#ffd700' : '#4c1d95'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 p-4 bg-white/5 rounded-xl border border-white/5">
           <div className="flex justify-between text-sm">
             <span className="text-gray-400">Dominance</span>
             <span className="text-gold font-mono">DeFi (40%)</span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default StatsDashboard;