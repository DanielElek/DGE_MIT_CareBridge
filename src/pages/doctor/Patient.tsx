import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../AppContext';
import { Layout } from '../../components/Layout';
import { Search, User, Calendar, ChevronDown, ChevronUp, LogOut, ArrowRight, Clock, Heart, Play, Info, ExternalLink, X, Activity } from 'lucide-react';
import { MOCK_CLINICAL_PATIENT, mockTrends } from '../../mockData';

const ReportModal: React.FC<{ isOpen: boolean; onClose: () => void; report: any }> = ({ isOpen, onClose, report }) => {
  if (!isOpen || !report) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl relative animate-scale-up overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Clinical Report</span>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">{report.date}</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">{report.title}</h2>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-2xl transition-all text-slate-400">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-thin">
          <section>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Report</h3>
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
              <p className="text-sm text-slate-700 leading-relaxed font-semibold">
                {report.details} The patient, Michael Oxlong, presents with a complex clinical manifestation of chronic lumbar degeneration, specifically focused on the L4-L5 and L5-S1 segments. Durante today's evaluation, he reported a persistent dull ache that intensifies into a sharp, lancinating sensation (7/10) upon axial rotation or lateral bending.
                <br /><br />
                The onset of current symptoms appears to be correlated with increased mechanical loading earlier this week. Clinical observation reveals significant paraspinal guarding and a reduction in fluid movement during transitional tasks. While baseline neurological functions remain intact, the subjective level of discomfort is impacting his sleep architecture and overall mobility.
                <br /><br />
                Initial conservative management has included myofascial release and controlled mobilization, which provided immediate symptomatic reduction. However, the patient expresses significant concern regarding his functional capacity for upcoming travel. We have emphasized the necessity of strict adherence to ergonomic modifications and a progressive stabilization protocol. Ongoing monitoring for any distal neurological deficit is mandatory.
              </p>
            </div>
          </section>

          <section className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Clinical Findings</h3>
              <ul className="space-y-2">
                {[
                  'Neurological exam within normal limits.',
                  'No acute inflammation detected.',
                  'Patient responsive to palpation in lumbar region.'
                ].map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-[11px] font-bold text-slate-600 bg-white p-2 rounded-lg border border-slate-50 shadow-sm">
                    <div className="w-1 h-1 rounded-full bg-blue-500" /> {f}
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Treatment Plan</h3>
              <ul className="space-y-2">
                {[
                  'Scheduled for MRI imaging.',
                  'Physical therapy twice weekly.',
                  'Medication adjustment: OTC Ibuprofen 400mg PRN.'
                ].map((s, i) => (
                  <li key={i} className="flex items-center gap-2 text-[11px] font-bold text-slate-600 bg-white p-2 rounded-lg border border-slate-50 shadow-sm">
                    <div className="w-1 h-1 rounded-full bg-blue-500" /> {s}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Physician Notes</h3>
            <p className="text-xs text-slate-500 italic bg-blue-50/50 p-4 rounded-2xl border border-blue-50 font-medium">
              "The patient's mobility has shown improvement over the last quarter, though recent lower back pain requires careful monitoring during upcoming travel."
            </p>
          </section>
        </div>

        {/* Modal Footer */}
        <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Record ID: PR-{report.id}-CLINICAL</p>
          <button onClick={onClose} className="btn-primary py-3 px-12 text-xs font-black bg-slate-800 hover:bg-black uppercase tracking-widest">CANCEL</button>
        </div>
      </div>
    </div>
  );
};

const InsightPanel: React.FC<{
  title: string;
  data: number[];
  color: string;
  unit: string;
  max: number;
  inverted?: boolean;
  description: string;
  isLoading?: boolean;
}> = ({ title, data, color, unit, max, inverted, description, isLoading }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const chartHeight = 60;
  const chartWidth = 300;
  const paddingX = 10;

  const getX = (i: number) => paddingX + (i / (data.length - 1)) * (chartWidth - paddingX * 2);
  const getY = (val: number) => chartHeight - (val / max) * chartHeight;

  const points = data.map((val, i) => `${getX(i)},${getY(val)}`).join(' ');
  const areaPoints = `${getX(0)},${chartHeight} ${points} ${getX(data.length - 1)},${chartHeight}`;

  const lastValue = data[data.length - 1];
  const prevValue = data[data.length - 8] || data[0]; // Simple 7-day delta approximation
  const delta = lastValue - prevValue;
  const isPositive = delta > 0;
  const trendColor = inverted ? (isPositive ? 'text-rose-500' : 'text-emerald-500') : (isPositive ? 'text-emerald-500' : 'text-rose-500');

  // Map color strings to tailwind colors for gradient IDs and strokes
  const colorMap: Record<string, { stroke: string; stop: string; shadow: string }> = {
    '#3b82f6': { stroke: '#3b82f6', stop: '#3b82f6', shadow: 'shadow-blue-500/10' }, // Sleep
    '#8b5cf6': { stroke: '#8b5cf6', stop: '#8b5cf6', shadow: 'shadow-indigo-500/10' }, // Well-being
    '#ef4444': { stroke: '#ef4444', stop: '#ef4444', shadow: 'shadow-rose-500/10' }, // Pain
  };
  const theme = colorMap[color] || colorMap['#3b82f6'];
  const gradientId = `grad-${title.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div className={`group relative bg-white rounded-[2rem] border border-slate-100 p-6 transition-all duration-300 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] hover:border-slate-200 ${isLoading ? 'opacity-50 grayscale' : ''}`}>
      {/* Header Info */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{title}</h4>
            <div className="invisible group-hover:visible transition-all">
              <div className="relative group/tooltip">
                <Info className="w-3 h-3 text-slate-300 hover:text-slate-900 transition-colors cursor-help" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-slate-900 text-white text-[9px] font-bold rounded-xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all shadow-xl z-50 pointer-events-none">
                  {description}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tighter">{lastValue}<span className="text-sm text-slate-400 ml-0.5 font-bold tracking-normal">{unit}</span></span>
            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-lg bg-slate-50 border border-slate-100 ${trendColor}`}>
              {delta === 0 ? '±0' : (delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1))}
            </span>
          </div>
        </div>
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center bg-slate-50 transition-colors group-hover:bg-white`}>
          {title === "Sleep Quality" && <Clock className="w-5 h-5 text-blue-500" />}
          {title === "Well-being" && <Heart className="w-5 h-5 text-indigo-500" />}
          {title === "Pain Level" && <Activity className="w-5 h-5 text-rose-500" />}
        </div>
      </div>

      {/* Main Sparkline */}
      <div className="relative h-[80px] mt-4 flex items-end">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={theme.stop} stopOpacity="0.15" />
              <stop offset="100%" stopColor={theme.stop} stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* Area Fill */}
          <polyline
            fill={`url(#${gradientId})`}
            points={areaPoints}
            className="transition-all duration-700 ease-in-out"
          />

          {/* Line */}
          <polyline
            fill="none"
            stroke={theme.stroke}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
            className="transition-all duration-700 ease-in-out drop-shadow-sm"
          />

          {/* Last Point Halo */}
          <circle
            cx={getX(data.length - 1)}
            cy={getY(lastValue)}
            r="6"
            fill={theme.stroke}
            className="opacity-10 animate-pulse"
          />
          <circle
            cx={getX(data.length - 1)}
            cy={getY(lastValue)}
            r="2.5"
            fill={theme.stroke}
            stroke="white"
            strokeWidth="1.5"
          />

          {/* Invisible hover zones for simple tooltip simulation */}
          {data.map((val, i) => (
            <rect
              key={i}
              x={getX(i) - 5}
              y="0"
              width="10"
              height={chartHeight}
              fill="transparent"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              className="cursor-pointer"
            />
          ))}

          {/* Simple Hover Indicator */}
          {hoveredIndex !== null && (
            <g>
              <line
                x1={getX(hoveredIndex)}
                y1="0"
                x2={getX(hoveredIndex)}
                y2={chartHeight}
                stroke="#e2e8f0"
                strokeWidth="1"
                strokeDasharray="4,2"
              />
              <circle cx={getX(hoveredIndex)} cy={getY(data[hoveredIndex])} r="3" fill={theme.stroke} stroke="white" strokeWidth="1.5" />
            </g>
          )}
        </svg>

        {/* Hover Text Labels */}
        {hoveredIndex !== null && (
          <div
            className="absolute -top-4 bg-slate-900 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md pointer-events-none transition-all shadow-lg"
            style={{ left: `${(getX(hoveredIndex) / chartWidth) * 100}%`, transform: 'translateX(-50%)' }}
          >
            {data[hoveredIndex]}{unit}
          </div>
        )}
      </div>

      {/* Bottom Subtitle */}
      <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center text-[9px] font-bold text-slate-400">
        <span className="uppercase tracking-widest">7D Avg</span>
        <span className="text-slate-700">{(data.reduce((a, b) => a + b, 0) / data.length).toFixed(1)}{unit}</span>
      </div>

      {/* Loading Shimmer */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] rounded-[2rem] flex items-center justify-center z-10">
          <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-blue-500 animate-spin" />
        </div>
      )}
    </div>
  );
};


export const Patient: React.FC = () => {
  const { currentClinicalPatient, setCurrentClinicalPatient, clinicalNotes, setClinicalNotes } = useApp();
  const navigate = useNavigate();
  const [lookupCode, setLookupCode] = useState('');
  const [error, setError] = useState('');
  const [expandedSummary, setExpandedSummary] = useState(false);
  const [expandedTimeline, setExpandedTimeline] = useState<string | null>(null);
  const [selectedRange, setSelectedRange] = useState(7);
  const [isChartLoading, setIsChartLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);

  const handleRangeChange = (days: number) => {
    if (days === selectedRange) return;
    setIsChartLoading(true);
    setSelectedRange(days);
    setTimeout(() => setIsChartLoading(false), 300);
  };

  const filteredTrends = mockTrends.slice(-selectedRange);
  const visibleTimeline = currentClinicalPatient?.timeline.slice(0, 3) || [];

  const handleLoad = () => {
    if (lookupCode.trim().toUpperCase() === 'DEMO-001') {
      setCurrentClinicalPatient(MOCK_CLINICAL_PATIENT);
      setError('');
    } else {
      setError('Invalid code. Try DEMO-001 for this demo.');
    }
  };

  const handleReset = () => {
    setCurrentClinicalPatient(null);
    setLookupCode('');
  };

  if (!currentClinicalPatient) {
    return (
      <Layout hideHeader>
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
          <div className="w-full max-w-md animate-slide-up">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-200">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">CareBridge Clinical</h1>
              <p className="text-slate-500 mt-2">Enter patient secure code to access record.</p>
            </div>

            <div className="glass-card p-8 border-slate-200">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Patient Secure Code</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      className="input-field pl-12 h-14 text-xl font-bold tracking-widest uppercase placeholder:normal-case placeholder:font-medium placeholder:text-slate-300"
                      placeholder="e.g. DEMO-001"
                      value={lookupCode}
                      onChange={(e) => setLookupCode(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleLoad()}
                    />
                  </div>
                  {error && <p className="text-red-500 text-xs mt-2 font-bold flex items-center gap-1"> {error}</p>}
                </div>

                <button
                  onClick={handleLoad}
                  className="btn-primary w-full h-14 text-lg flex items-center justify-center gap-2 group"
                >
                  Load Patient Record
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout hideHeader>
      <div className="min-h-screen bg-slate-50 flex flex-col">
        {/* Slim Clinical Header */}
        <header className="h-16 shrink-0 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-[100] backdrop-blur-md bg-white/90">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 pr-6">
              <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-200">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-black tracking-tighter text-slate-900 leading-none">CareBridge</h1>
                <p className="text-[8px] font-black uppercase tracking-widest text-blue-600 leading-tight">Clinical Portal</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={handleReset} className="btn-secondary h-10 px-4 py-0 flex items-center gap-2 border-slate-200 text-sm font-bold">
              <LogOut className="w-4 h-4" /> Load Next
            </button>
            <button
              onClick={() => navigate('/doctor/treatment')}
              className="btn-primary h-10 px-6 py-0 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-sm shadow-lg shadow-blue-100 font-black"
            >
              <Play className="w-4 h-4 fill-current" /> START TREATMENT
            </button>
          </div>
        </header>

        {/* Main Dashboard Area */}
        <main className="flex-1 overflow-hidden p-6">
          <div className="max-w-[1500px] mx-auto grid grid-cols-1 lg:grid-cols-10 gap-6 h-full items-start">

            {/* Left Column: Summary & Notes (~70%) */}
            <div className="lg:col-span-7 flex flex-col gap-6 h-full min-h-0">
              {/* Profile Bar */}
              <div className="glass-card p-6 border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center text-slate-400 border border-slate-300">
                    <User className="w-10 h-10" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2">
                      {currentClinicalPatient.name} <span className="text-xl font-medium text-slate-400 ml-2 tracking-normal">{currentClinicalPatient.code}</span>
                    </h2>
                    <div className="flex items-center gap-4 text-sm font-bold text-slate-500 uppercase tracking-wider">
                      <span>{currentClinicalPatient.age} Years • {currentClinicalPatient.sex}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                      <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-slate-400" /> Last Visit: {currentClinicalPatient.lastVisit}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Patient Input Summary */}
              <div className="glass-card border-indigo-100 flex flex-col min-h-0">
                <div className="px-6 py-4 border-b border-indigo-50 flex items-center justify-between bg-indigo-50/10">
                  <h3 className="text-xs font-black text-indigo-700 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Latest Patient Summary
                  </h3>
                  <span className="text-[10px] font-bold text-indigo-400 bg-white px-2 py-0.5 rounded border border-indigo-100">Submitted via Patient App • {currentClinicalPatient.latestSummary.createdAt}</span>
                </div>
                <div className="p-6">
                  <div className={`text-slate-700 font-medium leading-relaxed transition-all duration-300 ${expandedSummary ? '' : 'line-clamp-6'}`}>
                    {currentClinicalPatient.latestSummary.text}
                  </div>
                  <button
                    onClick={() => setExpandedSummary(!expandedSummary)}
                    className="mt-4 flex items-center gap-1.5 text-blue-600 font-black text-xs hover:text-blue-800 transition-colors uppercase tracking-widest bg-blue-50 px-3 py-2 rounded-lg"
                  >
                    {expandedSummary ? <><ChevronUp className="w-4 h-4" /> Collapse Summary</> : <><ChevronDown className="w-4 h-4" /> Show Full Summary</>}
                  </button>
                </div>
              </div>

              {/* Premium Longitudinal Health Insights */}
              <div className="flex flex-col gap-6">
                <div className="flex items-end justify-between px-2">
                  <div className="space-y-1">
                    <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">Longitudinal Insights</h3>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Clinical Trends</h2>
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <div className="flex items-center gap-6">
                      <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest hidden md:block">Last updated: Today 12:03</span>
                      <div className="flex bg-slate-100 p-1.5 rounded-[1.25rem] border border-slate-200 relative group">
                        {[7, 30, 90].map((days) => (
                          <button
                            key={days}
                            onClick={() => handleRangeChange(days)}
                            className={`relative z-10 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${selectedRange === days ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                          >
                            {days}D
                            {selectedRange === days && (
                              <div className="absolute inset-0 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.05)] rounded-xl -z-10 animate-scale-up" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Sleep Chart */}
                  <InsightPanel
                    title="Sleep Quality"
                    data={filteredTrends.map(t => t.sleepHours)}
                    color="#3b82f6"
                    unit="h"
                    max={12}
                    description="Total restorative sleep duration and quality assessment metrics."
                    isLoading={isChartLoading}
                  />
                  {/* Wellbeing Chart */}
                  <InsightPanel
                    title="Well-being"
                    data={filteredTrends.map(t => t.wellbeing)}
                    color="#8b5cf6"
                    unit="/10"
                    max={10}
                    description="Patient-reported psychological state and daily comfort scores."
                    isLoading={isChartLoading}
                  />
                  {/* Pain Level Chart */}
                  <InsightPanel
                    title="Pain Level"
                    data={filteredTrends.map(t => t.painLevel)}
                    color="#ef4444"
                    unit="/10"
                    max={10}
                    inverted
                    description="Subjective pain severity reports. Downward trends indicate clinical progress."
                    isLoading={isChartLoading}
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Timeline (~30%) */}
            <div className="lg:col-span-3 flex flex-col gap-6 h-full min-h-0">
              {/* Treatment Timeline */}
              <div className="glass-card flex-1 flex flex-col min-h-0 max-h-[calc(100vh-200px)]">
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur-md z-10">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-[0.22em] flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-500" /> Treatment Timeline
                  </h3>
                </div>
                <div className="flex-1 overflow-y-auto p-0 scrollbar-thin">
                  <div className="grid grid-cols-1">
                    {visibleTimeline.map((item: any, idx: number) => (
                      <div key={item.id} className={`group hover:bg-slate-50/50 transition-all border-b border-slate-50 last:border-none cursor-pointer overflow-hidden ${expandedTimeline === item.id ? 'bg-blue-50/30' : ''}`} onClick={() => setExpandedTimeline(expandedTimeline === item.id ? null : item.id)}>
                        <div className="p-5 flex items-start gap-4">
                          <div className="w-2 relative flex flex-col items-center h-full mt-1.5 shrink-0">
                            <div className={`w-2 h-2 rounded-full border border-white z-10 transition-transform group-hover:scale-125 ${expandedTimeline === item.id ? 'bg-blue-600 ring-4 ring-blue-100' : 'bg-slate-400'}`} />
                            {idx !== visibleTimeline.length - 1 && <div className="absolute top-2 w-px h-[200px] bg-slate-100 group-hover:bg-blue-50" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] mb-1.5 block">{item.date}</span>
                            <h4 className="font-black text-slate-900 leading-tight text-xs mb-1 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{item.title}</h4>
                            <p className="text-[10px] font-bold text-slate-500 line-clamp-1 italic">{item.notes}</p>
                          </div>
                        </div>
                        <div className={`px-11 pb-5 transition-all duration-500 ease-in-out overflow-hidden ${expandedTimeline === item.id ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                          <div className="bg-white rounded-2xl p-4 border border-blue-100 shadow-sm space-y-3">
                            <div>
                              <p className="text-[9px] font-black text-blue-600 mb-2 uppercase tracking-[0.2em]">Encounter Details</p>
                              <p className="text-[11px] text-slate-600 leading-relaxed font-bold">{item.details}</p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedReport(item);
                              }}
                              className="w-full h-8 bg-slate-50 hover:bg-blue-600 hover:text-white border border-slate-200 hover:border-blue-600 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all group/btn shadow-sm"
                            >
                              Open Full Report
                              <ExternalLink className="w-3 h-3 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </main>

        <footer className="h-10 shrink-0 bg-slate-100/50 border-t border-slate-200 flex items-center justify-center">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">© 2026 Clinical Intelligence Demo • Session Securely Logged • HIPAA Compliant Environment</p>
        </footer>
      </div>

      {/* Full Report Backdrop & Modal */}
      {selectedReport && (
        <ReportModal
          isOpen={!!selectedReport}
          onClose={() => setSelectedReport(null)}
          report={selectedReport}
        />
      )}
    </Layout>
  );
};
