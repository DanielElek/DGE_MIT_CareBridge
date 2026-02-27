import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../AppContext';
import { Layout } from '../../components/Layout';
import { ArrowLeft, Activity, Info, Sparkles, Zap } from 'lucide-react';

export const Trends: React.FC = () => {
  const { trends, textSize } = useApp();
  const navigate = useNavigate();
  const [range, setRange] = useState<7 | 30 | 90>(7);

  const displayedTrends = useMemo(() => {
    return trends.slice(-range);
  }, [trends, range]);

  const stats = useMemo(() => {
    const avgPain = (displayedTrends.reduce((sum, t) => sum + t.painLevel, 0) / displayedTrends.length).toFixed(1);
    const avgSleep = (displayedTrends.reduce((sum, t) => sum + t.sleepHours, 0) / displayedTrends.length).toFixed(1);
    const avgWellbeing = (displayedTrends.reduce((sum, t) => sum + t.wellbeing, 0) / displayedTrends.length).toFixed(1);

    // Calculate trend percentage (comparing first half vs second half of displayed range)
    const mid = Math.floor(displayedTrends.length / 2);
    const firstHalfAvg = displayedTrends.slice(0, mid).reduce((sum, t) => sum + t.painLevel, 0) / mid;
    const secondHalfAvg = displayedTrends.slice(mid).reduce((sum, t) => sum + t.painLevel, 0) / (displayedTrends.length - mid);
    const painTrend = firstHalfAvg > secondHalfAvg ? 'decreasing' : 'increasing';

    return { avgPain, avgSleep, avgWellbeing, painTrend };
  }, [displayedTrends]);

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-8 animate-slide-up">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
              <Zap className="w-3 h-3" /> Health Analytics
            </div>
            <h2 className={`font-bold text-slate-900 ${textSize === 'large' ? 'text-4xl' : 'text-3xl'}`}>
              Your Health Trends
            </h2>
            <p className="text-slate-500 mt-2 text-lg">Visualizing your progress over time.</p>
          </div>

          <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
            {[7, 30, 90].map((r) => (
              <button
                key={r}
                onClick={() => setRange(r as any)}
                className={`px-6 py-2.5 rounded-xl font-bold transition-all duration-300 ${range === r ? 'bg-white text-blue-600 shadow-md' : 'text-slate-500 hover:text-slate-800'
                  }`}
              >
                {r} Days
              </button>
            ))}
          </div>
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <TrendStatCard
            title="Avg. Pain Level"
            value={stats.avgPain}
            unit="/10"
            label={stats.painTrend === 'decreasing' ? 'Improving' : 'Monitoring'}
            isGood={stats.painTrend === 'decreasing'}
          />
          <TrendStatCard
            title="Avg. Sleep"
            value={stats.avgSleep}
            unit="hrs"
            label="Rest quality"
            isGood={Number(stats.avgSleep) > 7}
          />
          <TrendStatCard
            title="Wellbeing"
            value={stats.avgWellbeing}
            unit="/10"
            label="Overall vibe"
            isGood={Number(stats.avgWellbeing) > 7}
          />
        </div>

        {/* Pain Chart */}
        <div className="glass-card p-8 mb-8 border-slate-200">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-50 rounded-lg"><Activity className="w-5 h-5 text-red-500" /></div>
              <h3 className="text-xl font-bold text-slate-800">Pain Intensity</h3>
            </div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Info className="w-4 h-4" /> Higher means more discomfort
            </div>
          </div>

          <div className="relative h-64 flex items-end gap-1 px-2">
            {displayedTrends.map((t, i) => (
              <div key={i} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                <div
                  className={`w-full max-w-[20px] rounded-t-lg transition-all duration-500 relative ${t.painLevel > 7 ? 'bg-gradient-to-t from-red-600 to-red-400' :
                    t.painLevel > 4 ? 'bg-gradient-to-t from-orange-500 to-orange-300' :
                      'bg-gradient-to-t from-blue-500 to-blue-300'
                    }`}
                  style={{ height: `${(t.painLevel / 10) * 100}%` }}
                >
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 glass-card px-2 py-1 text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 border-slate-200 shadow-md">
                    {t.painLevel}/10 • {new Date(t.date).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest border-t border-slate-100 pt-4">
            <span>{new Date(displayedTrends[0].date).toLocaleDateString()}</span>
            {range > 7 && <span>Mid Period</span>}
            <span>Today</span>
          </div>
        </div>

        {/* Wellbeing Chart */}
        <div className="glass-card p-8 border-slate-200">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-50 rounded-lg"><Sparkles className="w-5 h-5 text-teal-500" /></div>
              <h3 className="text-xl font-bold text-slate-800">General Wellbeing</h3>
            </div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Info className="w-4 h-4" /> Higher means feeling better
            </div>
          </div>

          <div className="relative h-64 flex items-end gap-1 px-2">
            {displayedTrends.map((t, i) => (
              <div key={i} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                <div
                  className="w-full max-w-[20px] rounded-t-lg transition-all duration-500 relative bg-gradient-to-t from-teal-600 to-teal-400"
                  style={{ height: `${(t.wellbeing / 10) * 100}%` }}
                >
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 glass-card px-2 py-1 text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 border-slate-200 shadow-md">
                    {t.wellbeing}/10 • {new Date(t.date).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest border-t border-slate-100 pt-4">
            <span>{new Date(displayedTrends[0].date).toLocaleDateString()}</span>
            {range > 7 && <span>Mid Period</span>}
            <span>Today</span>
          </div>
        </div>

        <div className="mt-10 flex border-t border-slate-100 pt-10">
          <button
            onClick={() => navigate('/patient/summary')}
            className="btn-secondary flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Summary
          </button>
        </div>
      </div>
    </Layout>
  );
};

const TrendStatCard: React.FC<{ title: string; value: string; unit: string; label: string; isGood: boolean }> = ({ title, value, unit, label, isGood }) => (
  <div className="glass-card p-6 border-slate-200 flex flex-col">
    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{title}</span>
    <div className="flex items-baseline gap-1 mb-3">
      <span className="text-4xl font-black text-slate-800 tracking-tight">{value}</span>
      <span className="text-slate-400 font-bold">{unit}</span>
    </div>
    <div className={`mt-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${isGood ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
      }`}>
      {isGood ? <CheckCircle2 className="w-3 h-3" /> : <Activity className="w-3 h-3" />}
      {label}
    </div>
  </div>
);

const CheckCircle2 = ({ className }: { className: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></svg>
);

