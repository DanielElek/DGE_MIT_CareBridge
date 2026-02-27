import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../AppContext';
import { Layout } from '../../components/Layout';
import { Search, User, Calendar, ChevronDown, ChevronUp, Save, LogOut, ArrowRight, Clock, FileText, Heart, Play, Info, ExternalLink, X } from 'lucide-react';
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
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Encounter Summary</h3>
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
              <p className="text-sm text-slate-700 leading-relaxed font-semibold">{report.details}</p>
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
          <button className="btn-primary py-3 px-8 text-xs font-black">EXPORT TO EMS</button>
        </div>
      </div>
    </div>
  );
};

const TrendChart: React.FC<{
  title: string;
  data: number[];
  color: string;
  unit: string;
  max: number;
  inverted?: boolean;
  description: string;
}> = ({ title, data, color, unit, max, inverted, description }) => {
  const chartHeight = 80;
  const chartWidth = 280;
  const paddingLeft = 25;
  const points = data.map((val, i) => {
    const x = paddingLeft + (i / (data.length - 1)) * (chartWidth - paddingLeft);
    const y = chartHeight - (val / max) * chartHeight;
    return `${x},${y}`;
  }).join(' ');

  const lastValue = data[data.length - 1];
  const avgValue = (data.reduce((a, b) => a + b, 0) / data.length).toFixed(1);
  const gridLines = [0, 0.5, 1]; // 0, 5, 10

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5 group/info relative">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</span>
          <Info className="w-3 h-3 text-slate-300 hover:text-blue-500 cursor-help transition-colors" />

          {/* Light Tooltip */}
          <div className="absolute bottom-full left-0 mb-2 w-56 p-4 bg-white/95 backdrop-blur-md border border-blue-100 rounded-2xl text-[10px] opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible transition-all z-50 shadow-[0_10px_30px_rgba(0,0,0,0.08)] pointer-events-none">
            <p className="font-black mb-1.5 uppercase tracking-wider text-blue-600">Clinical Guide</p>
            <p className="text-slate-600 leading-relaxed mb-3 font-semibold">{description}</p>
            <div className="pt-2.5 border-t border-slate-100 flex justify-between items-center">
              <span className="text-slate-400 font-black uppercase tracking-[0.15em] text-[8px]">Period Average</span>
              <span className="text-xs font-black text-slate-900 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">{avgValue}{unit}</span>
            </div>
            {/* Tooltip Arrow */}
            <div className="absolute top-full left-4 -mt-1 border-[6px] border-transparent border-t-white drop-shadow-[0_1px_0_rgba(191,219,254,1)]" />
          </div>
        </div>
        <span className={`text-xs font-black ${inverted && lastValue > 7 ? 'text-red-500' : 'text-slate-900'}`}>{lastValue}{unit}</span>
      </div>
      <div className="h-28 bg-white rounded-2xl border border-slate-100 flex items-end p-2 overflow-hidden relative shadow-sm">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full overflow-visible">
          {/* Grid Lines & Y-Axis Labels */}
          {gridLines.map((line, i) => (
            <g key={i}>
              <line
                x1={paddingLeft}
                y1={chartHeight - (line * chartHeight)}
                x2={chartWidth}
                y2={chartHeight - (line * chartHeight)}
                stroke="#f1f5f9"
                strokeWidth="1"
              />
              <text
                x="0"
                y={chartHeight - (line * chartHeight) + 3}
                className="text-[8px] fill-slate-300 font-bold"
              >
                {Math.round(line * max)}
              </text>
            </g>
          ))}

          <polyline
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
            className="transition-all duration-700"
          />
          <circle cx={chartWidth} cy={chartHeight - (lastValue / max) * chartHeight} r="3" fill={color} className="animate-pulse" />
        </svg>
      </div>
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
  const [selectedReport, setSelectedReport] = useState<any>(null);

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

              {/* Unified Health Trends Section */}
              <div className="glass-card flex-col border-blue-100 shadow-blue-50 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" /> Longitudinal Health Insights
                  </h3>
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    {[7, 30, 90].map((days) => (
                      <button
                        key={days}
                        onClick={() => setSelectedRange(days)}
                        className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${selectedRange === days ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        {days}D
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Sleep Chart */}
                  <TrendChart
                    title="Sleep Quality"
                    data={filteredTrends.map(t => t.sleepHours)}
                    color="#3b82f6"
                    unit="h"
                    max={12}
                    description="Measures total restorative sleep duration and quality metrics over time."
                  />
                  {/* Wellbeing Chart */}
                  <TrendChart
                    title="Well-being"
                    data={filteredTrends.map(t => t.wellbeing)}
                    color="#8b5cf6"
                    unit="/10"
                    max={10}
                    description="Self-reported psychological and physical state based on daily check-ins."
                  />
                  {/* Pain Level Chart */}
                  <TrendChart
                    title="Pain Level"
                    data={filteredTrends.map(t => t.painLevel)}
                    color="#ef4444"
                    unit="/10"
                    max={10}
                    inverted
                    description="Subjective pain scale rating. Decreasing trends indicate positive treatment response."
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
