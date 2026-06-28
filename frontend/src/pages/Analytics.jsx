import { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Star, CheckCircle, Database, Copy, BarChart2 } from 'lucide-react';

const COLORS = ['#10b981', '#0ea5e9', '#6366f1', '#ef4444'];

function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:5000');
      const response = await axios.get(`${API_URL}/api/analytics`);
      setData(response.data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('Backend not connected. Ensure the Node server is running on localhost:5000.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center mt-12"><div className="skeleton mx-auto" style={{height: '400px', width: '100%', maxWidth: '1000px'}}></div></div>;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center mt-20 p-8 text-center animate-fade-in card glass-panel mx-auto" style={{ maxWidth: '600px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
        <Database size={64} className="text-danger mb-4" style={{ color: '#ef4444' }} />
        <h2 className="text-white mb-2">Connection Error</h2>
        <p className="text-muted mb-6" style={{ fontSize: '1.1rem' }}>{error}</p>
        <div className="bg-black bg-opacity-30 p-4 rounded text-left text-sm text-muted w-full border border-white border-opacity-10">
          <strong>Troubleshooting:</strong>
          <ul className="mt-2 space-y-1 list-disc pl-5">
            <li>Ensure MySQL server is running (e.g., XAMPP, Docker)</li>
            <li>Check if <code>backend/.env</code> has the correct DB credentials</li>
            <li>Run <code>npm start</code> in the backend directory</li>
          </ul>
        </div>
      </div>
    );
  }

  // Handle empty state gracefully even if connected
  if (data && data.totalGenerations === 0) {
    return (
      <div className="text-center mt-12 p-12 card glass-panel mx-auto" style={{ maxWidth: '600px' }}>
        <h3 className="text-white mb-2">No Data Yet</h3>
        <p className="text-muted">The database is connected, but there are no generations to analyze yet. Start generating content to see your metrics!</p>
      </div>
    );
  }

  return (
    <div className="analytics-page animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <h2>Analytics Dashboard</h2>
        <div className="flex items-center gap-4">
          <span className="text-success text-sm flex items-center gap-2 bg-success bg-opacity-10 px-4 py-2 rounded-full border border-success border-opacity-20 font-medium">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span> Live DB Sync
          </span>
        </div>
      </div>
      
      {/* Top KPIs */}
      <div className="grid grid-4 mb-8">
        <div className="card glass-panel hover-glow flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <p className="text-muted font-medium">Total Generations</p>
            <div className="bg-primary bg-opacity-20 p-2 rounded-lg text-primary"><TrendingUp size={20} /></div>
          </div>
          <h1 className="mb-0 text-white" style={{ fontSize: '2.5rem' }}>{data.totalGenerations}</h1>
        </div>
        
        <div className="card glass-panel hover-glow flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <p className="text-muted font-medium">Average Rating</p>
            <div className="bg-warning bg-opacity-20 p-2 rounded-lg" style={{ color: '#fbbf24', background: 'rgba(251, 191, 36, 0.15)' }}><Star size={20} /></div>
          </div>
          <h1 className="mb-0 text-white" style={{ fontSize: '2.5rem' }}>{data.averageRating}</h1>
        </div>

        <div className="card glass-panel hover-glow flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <p className="text-muted font-medium">Quality Score</p>
            <div className="bg-success bg-opacity-20 p-2 rounded-lg text-success"><CheckCircle size={20} /></div>
          </div>
          <h1 className="mb-0 text-white flex items-baseline gap-1" style={{ fontSize: '2.5rem' }}>
            {data.qualityScore}<span className="text-muted text-xl">%</span>
          </h1>
        </div>

        <div className="card glass-panel hover-glow flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <p className="text-muted font-medium text-sm">Actions Tracked</p>
            <div className="bg-secondary bg-opacity-20 p-2 rounded-lg text-secondary"><Copy size={16} /></div>
          </div>
          <div className="flex flex-col gap-2 mt-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted">Copies:</span>
              <span className="text-white font-bold">{data.copyCount || 0}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted">Downloads:</span>
              <span className="text-white font-bold">{data.downloadCount || 0}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted">Exports:</span>
              <span className="text-white font-bold">{data.exportCount || 0}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-2 mb-8 gap-6">
        {/* Usage Trends */}
        <div className="card glass-panel">
          <h3 className="mb-6 flex items-center gap-2"><BarChart2 size={20} className="text-primary"/> Usage Trends (Last 7 Days)</h3>
          {data.trends && data.trends.length > 0 ? (
            <div style={{ height: '300px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#64748b" 
                    tick={{fill: '#64748b', fontSize: 12}}
                    tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { weekday: 'short' })}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis stroke="#64748b" tick={{fill: '#64748b', fontSize: 12}} allowDecimals={false} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{fill: 'rgba(255,255,255,0.02)'}}
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}
                    labelFormatter={(val) => new Date(val).toLocaleDateString()}
                  />
                  <Bar dataKey="count" fill="url(#colorUv)" radius={[6, 6, 0, 0]} maxBarSize={40} />
                  <defs>
                    <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.8}/>
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center text-muted py-8 flex items-center justify-center h-full">Not enough data to display trends yet.</div>
          )}
        </div>

        {/* Rating Distribution */}
        <div className="card glass-panel">
          <h3 className="mb-6 flex items-center gap-2"><Star size={20} className="text-warning" style={{color: '#fbbf24'}}/> Rating Distribution</h3>
          {data.ratingDistribution && data.ratingDistribution.length > 0 ? (
            <div style={{ height: '300px', width: '100%', position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.ratingDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {data.ratingDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    itemStyle={{ color: 'white' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                <span className="text-3xl font-bold text-white">{data.ratingDistribution[0] ? Math.round((data.ratingDistribution[0].value / data.ratingDistribution.reduce((a, b) => a + b.value, 0)) * 100) : 0}%</span>
                <span className="block text-xs text-muted uppercase tracking-wider mt-1">5 Stars</span>
              </div>
            </div>
          ) : (
            <div className="text-center text-muted py-8 flex items-center justify-center h-full">Rate some generations to see the distribution.</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Analytics;
