import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../AppContext';
import { Layout } from '../../components/Layout';
import { Search, Calendar, ChevronDown, ChevronUp, LogOut, ArrowRight, Clock, Heart, Play, Info, ExternalLink, X, Activity } from 'lucide-react';
import { MonogramAvatar } from '../../components/MonogramAvatar';
import { MOCK_CLINICAL_PATIENT, mockTrends } from '../../mockData';

const ReportModal: React.FC<{ isOpen: boolean; onClose: () => void; report: any }> = ({ isOpen, onClose, report }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';

      const handleWheel = (e: WheelEvent) => {
        if (scrollRef.current) {
          // If the mouse is anywhere in the modal area or overlay, route it
          // Actually, the requirement says "Scrolling anywhere ... must scroll the report content"
          // We apply the delta directly to the scroller
          scrollRef.current.scrollTop += e.deltaY;
          e.preventDefault();
        }
      };

      // Add wheel event listener globally with passive: false to allow preventDefault
      window.addEventListener('wheel', handleWheel, { passive: false });

      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('wheel', handleWheel);
      };
    }
  }, [isOpen]);

  if (!isOpen || !report) return null;

  return (
    <div className="fixed inset-0 z-[200] flex justify-center items-start pt-6 px-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-primary/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />

      {/* Modal Container */}
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl relative animate-scale-up overflow-hidden flex flex-col max-h-[calc(100vh-48px)]">
        {/* Modal Header */}
        <div className="p-8 border-b border-border flex items-center justify-between bg-white sticky top-0 z-10 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black text-accent-600 uppercase tracking-[0.2em]">Clinical Report</span>
              <span className="w-1.5 h-1.5 rounded-full bg-border" />
              <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.1em]">{report.date}</span>
            </div>
            <h2 className="text-2xl font-black text-text-strong tracking-tight">{report.title}</h2>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-surface-muted rounded-2xl transition-all text-text-muted">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Content - Scrollable Region */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-thin overflow-x-hidden"
        >
          <section>
            <h3 className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-4">Report Details</h3>
            <div className="bg-background rounded-2xl p-6 border border-border">
              <p className="text-[14px] text-text leading-relaxed font-semibold">
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
              <h3 className="text-[12px] font-black text-text-muted uppercase tracking-widest">Clinical Findings</h3>
              <ul className="space-y-2">
                {[
                  'Neurological exam within normal limits.',
                  'No acute inflammation detected.',
                  'Patient responsive to palpation in lumbar region.'
                ].map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-[14px] font-bold text-text bg-white p-3 rounded-lg border border-border shadow-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent-500 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="text-[12px] font-black text-text-muted uppercase tracking-widest">Treatment Plan</h3>
              <ul className="space-y-2">
                {[
                  'Scheduled for MRI imaging.',
                  'Physical therapy twice weekly.',
                  'Medication adjustment: OTC Ibuprofen 400mg PRN.'
                ].map((s, i) => (
                  <li key={i} className="flex items-center gap-3 text-[14px] font-bold text-text bg-white p-3 rounded-lg border border-border shadow-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent-500 shrink-0" /> {s}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section>
            <h3 className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-4">Physician Notes</h3>
            <p className="text-[13px] text-text-muted italic bg-accent-500/5 p-4 rounded-2xl border border-accent-500/10 font-medium">
              "The patient's mobility has shown improvement over the last quarter, though recent lower back pain requires careful monitoring during upcoming travel."
            </p>
          </section>
        </div>

        {/* Modal Footer */}
        <div className="p-8 border-t border-border bg-background/50 flex items-center justify-between shrink-0">
          <p className="text-[9px] font-bold text-text-muted uppercase tracking-[0.2em]">Record ID: PR-{report.id}-CLINICAL</p>
          <button onClick={onClose} className="btn-secondary py-3 px-12 text-xs font-black uppercase tracking-widest">CLOSE REPORT</button>
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
  const trendColor = inverted ? (isPositive ? 'text-danger' : 'text-primary') : (isPositive ? 'text-primary' : 'text-danger');

  // Map color strings to theme tokens
  const colorMap: Record<string, { stroke: string; stop: string; shadow: string }> = {
    '#137353': { stroke: '#137353', stop: '#137353', shadow: 'shadow-primary/20' }, // Sleep (Forest Green)
    '#22785e': { stroke: '#22785e', stop: '#22785e', shadow: 'shadow-accent-500/20' }, // Alternative accent
    '#22C58B': { stroke: '#22C58B', stop: '#22C58B', shadow: 'shadow-accent-500/20' }, // Well-being (Emerald)
    '#D64545': { stroke: '#D64545', stop: '#D64545', shadow: 'shadow-danger/20' }, // Pain (Muted Red)
  };
  const theme = colorMap[color] || colorMap['#137353'];
  const gradientId = `grad-${title.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div className={`group relative bg-white rounded-[2rem] border border-border p-6 transition-all duration-300 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] hover:border-border ${isLoading ? 'opacity-50 grayscale' : ''}`}>
      {/* Header Info */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">{title}</h4>
            <div className="invisible group-hover:visible transition-all">
              <div className="relative group/tooltip">
                <div className="p-2bg-surface-muted rounded-lg"><Info className="w-3 h-3 text-text-muted/50 hover:text-text-strong transition-colors cursor-help" /></div>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-primary text-white text-[9px] font-bold rounded-xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all shadow-xl z-50 pointer-events-none">
                  {description}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-primary" />
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-text-strong tracking-tighter">{lastValue}<span className="text-sm text-text-muted ml-0.5 font-bold tracking-normal">{unit}</span></span>
            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-lg bg-surface-muted border border-border ${trendColor}`}>
              {delta === 0 ? '±0' : (delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1))}
            </span>
          </div>
        </div>
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center bg-surface-muted transition-colors group-hover:bg-white`}>
          {title === "Sleep Quality" && <Clock className="w-5 h-5 text-primary-600" />}
          {title === "Well-being" && <Heart className="w-5 h-5 text-accent-500" />}
          {title === "Pain Level" && <Activity className="w-5 h-5 text-danger" />}
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
                stroke="var(--border)"
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
            className="absolute -top-4 bg-primary text-white text-[8px] font-black px-1.5 py-0.5 rounded-md pointer-events-none transition-all shadow-lg"
            style={{ left: `${(getX(hoveredIndex) / chartWidth) * 100}%`, transform: 'translateX(-50%)' }}
          >
            {data[hoveredIndex]}{unit}
          </div>
        )}
      </div>

      {/* Bottom Subtitle */}
      <div className="mt-4 pt-4 border-t border-border flex justify-between items-center text-[9px] font-bold text-text-muted">
        <span className="uppercase tracking-widest">7D Avg</span>
        <span className="text-text-strong">{(data.reduce((a, b) => a + b, 0) / data.length).toFixed(1)}{unit}</span>
      </div>

      {/* Loading Shimmer */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] rounded-[2rem] flex items-center justify-center z-10">
          <div className="w-8 h-8 rounded-full border-2 border-border border-t-primary animate-spin" />
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
        <div className="min-h-screen flex items-center justify-center p-6 bg-background">
          <div className="w-full max-w-md animate-slide-up">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-primary/20">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-black text-text-strong tracking-tight">CareBridge Clinical</h1>
              <p className="text-text-muted mt-2">Enter patient secure code to access record.</p>
            </div>

            <div className="glass-card p-8 border-border">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">Patient Secure Code</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                    <input
                      type="text"
                      className="input-field pl-12 h-14 text-xl font-bold tracking-widest uppercase placeholder:normal-case placeholder:font-medium placeholder:text-text-muted/30"
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
      <div className="min-h-screen bg-background flex flex-col">
        {/* Slim Clinical Header */}
        <header className="h-16 shrink-0 bg-white border-b border-border flex items-center justify-between px-6 sticky top-0 z-[100] backdrop-blur-md bg-white/90">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 pr-6">
              <div className="p-2 bg-primary rounded-xl shadow-lg shadow-primary/20">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-black tracking-tighter text-text-strong leading-none">CareBridge</h1>
                <p className="text-[8px] font-black uppercase tracking-widest text-accent-500 leading-tight">Clinical Portal</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={handleReset} className="btn-secondary h-10 px-4 py-0 flex items-center gap-2 border-border text-sm font-bold">
              <LogOut className="w-4 h-4" /> Load Next
            </button>
            <button
              onClick={() => navigate('/doctor/treatment')}
              className="btn-primary h-10 px-6 py-0 flex items-center gap-2 bg-primary hover:bg-primary-900 border-none text-sm shadow-lg shadow-primary/20 font-black"
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
              <div className="glass-card p-6 border-border flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 bg-surface-muted rounded-2xl overflow-hidden flex items-center justify-center text-text-muted/50 border border-border">
                    <MonogramAvatar name={currentClinicalPatient.name} className="w-full h-full text-2xl" />
                  </div>
                  <div>
                    <h2 className="headline-type text-text-strong mb-1">
                      {currentClinicalPatient.name} <span className="text-xl font-medium text-text-muted/50 ml-2 tracking-normal uppercase text-[14px] font-black tracking-[0.2em]">{currentClinicalPatient.code}</span>
                    </h2>
                    <div className="flex items-center gap-4 text-sm font-bold text-text-muted uppercase tracking-wider">
                      <span>{currentClinicalPatient.age} Years • {currentClinicalPatient.sex}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-border" />
                      <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-text-muted" /> Last Visit: {currentClinicalPatient.lastVisit}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Patient Input Summary */}
              <div className="glass-card border-accent-500/10 flex flex-col min-h-0 overflow-hidden">
                <div className="px-6 py-4 border-b border-accent-500/5 flex items-center justify-between bg-accent-500/5">
                  <h3 className="text-sm font-black text-accent-700 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Clock className="w-4 h-4 text-accent-500" /> Latest Patient Summary
                  </h3>
                  <span className="text-[10px] font-bold text-accent-500 bg-white px-2 py-0.5 rounded border border-accent-500/10">Submitted via Patient App • {currentClinicalPatient.latestSummary.createdAt}</span>
                </div>
                <div className="p-6">
                  <div className={`text-text font-medium leading-relaxed transition-all duration-300 ${expandedSummary ? '' : 'line-clamp-6'}`}>
                    {currentClinicalPatient.latestSummary.text}
                  </div>
                  <button
                    onClick={() => setExpandedSummary(!expandedSummary)}
                    className="mt-4 flex items-center gap-1.5 text-accent-600 font-black text-xs hover:text-accent-800 transition-colors uppercase tracking-widest bg-accent-500/10 px-3 py-2 rounded-lg"
                  >
                    {expandedSummary ? <><ChevronUp className="w-4 h-4" /> Collapse Summary</> : <><ChevronDown className="w-4 h-4" /> Show Full Summary</>}
                  </button>
                </div>
              </div>

              {/* Premium Longitudinal Health Insights */}
              <div className="flex flex-col gap-6">
                <div className="flex items-end justify-between px-2">
                  <div className="space-y-1">
                    <h3 className="text-[11px] font-black text-accent-500 uppercase tracking-[0.3em]">Longitudinal Insights</h3>
                    <h2 className="headline-type text-text-strong">Clinical Trends</h2>
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <div className="flex items-center gap-6">
                      <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest hidden md:block">Last updated: Today 12:03</span>
                      <div className="flex bg-surface-muted p-1.5 rounded-[1.25rem] border border-border relative group">
                        {[7, 30, 90].map((days) => (
                          <button
                            key={days}
                            onClick={() => handleRangeChange(days)}
                            className={`relative z-10 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${selectedRange === days ? 'text-accent-600' : 'text-text-muted hover:text-text'}`}
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
                    color="#137353"
                    unit="h"
                    max={12}
                    description="Total restorative sleep duration and quality assessment metrics."
                    isLoading={isChartLoading}
                  />
                  {/* Wellbeing Chart */}
                  <InsightPanel
                    title="Well-being"
                    data={filteredTrends.map(t => t.wellbeing)}
                    color="#22C58B"
                    unit="/10"
                    max={10}
                    description="Patient-reported psychological state and daily comfort scores."
                    isLoading={isChartLoading}
                  />
                  {/* Pain Level Chart */}
                  <InsightPanel
                    title="Pain Level"
                    data={filteredTrends.map(t => t.painLevel)}
                    color="#D64545"
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
              <div className="glass-card flex-1 flex flex-col min-h-0 max-h-[calc(100vh-200px)] overflow-hidden">
                <div className="px-6 py-5 border-b border-border flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur-md z-10">
                  <h3 className="text-sm font-black text-accent-700 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-accent-500" /> Treatment Timeline
                  </h3>
                </div>
                <div className="flex-1 overflow-y-auto p-0 scrollbar-thin">
                  <div className="grid grid-cols-1">
                    {visibleTimeline.map((item: any, idx: number) => (
                      <div key={item.id} className={`group hover:bg-surface-muted transition-all border-b border-border last:border-none cursor-pointer relative overflow-hidden ${expandedTimeline === item.id ? 'bg-accent-500/5' : ''}`} onClick={() => setExpandedTimeline(expandedTimeline === item.id ? null : item.id)}>
                        {/* Persistent Vertical Line Connector */}
                        <div className={`absolute left-[27px] w-0.5 bg-slate-200/60 group-hover:bg-accent-500/30 transition-colors z-0
                          ${idx === 0 ? 'top-[31px] bottom-0' : idx === visibleTimeline.length - 1 ? 'top-0 h-[31px]' : 'top-0 bottom-0'}
                        `} />

                        <div className="p-5 flex items-start gap-4 relative z-10">
                          <div className="w-4 shrink-0 mt-2 flex justify-center">
                            {/* Dot */}
                            <div className={`w-2.5 h-2.5 rounded-full border-2 border-white z-10 transition-all duration-300 relative
                              ${expandedTimeline === item.id ? 'bg-accent-500 ring-4 ring-accent-500/20 scale-110 shadow-lg' : 'bg-slate-300 group-hover:bg-accent-500'}
                            `} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[12px] font-medium text-text-muted tracking-wide mb-1.5 block">{item.date}</span>
                            <h4 className="text-[16px] font-semibold leading-[1.3] text-text-strong mb-1 group-hover:text-accent-600 transition-colors tracking-tight">{item.title}</h4>
                            <p className="text-[14px] font-normal leading-[1.45] text-text-muted line-clamp-1 italic">{item.notes}</p>
                          </div>
                        </div>
                        <div className={`px-11 pb-5 transition-all duration-500 ease-in-out overflow-hidden ${expandedTimeline === item.id ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                          <div className="bg-white rounded-2xl p-4 border border-accent-500/10 shadow-sm space-y-3">
                            <div>
                              <p className="text-[9px] font-black text-accent-600 mb-2 uppercase tracking-[0.2em]">Encounter Details</p>
                              <p className="text-[11px] text-text font-bold">{item.details}</p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedReport(item);
                              }}
                              className="w-full h-8 bg-surface-muted hover:bg-accent-600 hover:text-white border border-border hover:border-accent-600 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all group/btn shadow-sm"
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

        <footer className="h-10 shrink-0 bg-surface-muted border-t border-border flex items-center justify-center">
          <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest">© 2026 Clinical Intelligence Demo • Session Securely Logged • HIPAA Compliant Environment</p>
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
