import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../AppContext';
import { Layout } from '../../components/Layout';
import { Search, ArrowRight, FileText, User, Activity, ShieldCheck, AlertCircle, MoreVertical, ExternalLink } from 'lucide-react';
import { PATIENT_ID } from '../../mockData';

export const Patient: React.FC = () => {
  const { patientData, trends, textSize } = useApp();
  const navigate = useNavigate();
  const [patientId, setPatientId] = useState(PATIENT_ID);
  const [isLoaded, setIsLoaded] = useState(true); // Default to true for demo speed

  const handleLoadPatient = () => {
    setIsLoaded(true);
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8 animate-slide-up">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h2 className={`font-black text-slate-900 tracking-tight ${textSize === 'large' ? 'text-4xl' : 'text-3xl'}`}>
              Clinical Dashboard
            </h2>
            <p className="text-slate-500 mt-2 text-lg">Comprehensive patient overview and AI insights.</p>
          </div>

          <div className="flex gap-4 p-1.5 bg-slate-100 rounded-2xl border border-slate-200 shadow-inner w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-transparent text-sm font-bold text-slate-700 placeholder-slate-400 focus:outline-none"
                placeholder="Search Patient ID..."
              />
            </div>
            <button
              onClick={handleLoadPatient}
              className="px-6 py-2 bg-white text-blue-600 rounded-xl font-bold shadow-sm hover:shadow-md transition-all active:scale-95"
            >
              Load
            </button>
          </div>
        </div>

        {isLoaded ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column - Patient Meta & AI Summary */}
            <div className="lg:col-span-8 space-y-8">
              {/* Patient Profile Card */}
              <div className="glass-card p-8 border-slate-200 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 opacity-50" />
                <div className="flex items-center gap-6 relative z-10">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                    <User className="w-10 h-10" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-2xl font-bold text-slate-900">Johnathan Doe</h3>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-bold uppercase tracking-widest">ID: {PATIENT_ID}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
                      <span>68 years • Male</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300" />
                      <span>Last Visit: Oct 12, 2025</span>
                    </div>
                  </div>
                  <button className="ml-auto p-2 text-slate-400 hover:text-slate-600 transition-colors">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* AI Clinical Summary */}
              <div className="glass-card border-indigo-100 bg-indigo-50/10 p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <h4 className="text-xl font-bold text-slate-800">AI Intake Analysis</h4>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">Verified Clinical Data</span>
                </div>

                {patientData && patientData.summary.bullets.length > 0 ? (
                  <div className="space-y-8">
                    <div>
                      <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Chief Complaint & History</h5>
                      <ul className="grid gap-3">
                        {patientData.summary.bullets.map((bullet, index) => (
                          <li key={index} className="flex items-start gap-4 p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                            <div className="mt-1.5 w-2 h-2 rounded-full bg-indigo-500" />
                            <span className="text-slate-700 font-medium leading-relaxed">{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h5 className="text-xs font-bold text-red-400 uppercase tracking-widest px-1">Pertinent Positives</h5>
                        <div className="flex flex-wrap gap-2">
                          {patientData.summary.keyPositives.map((item, index) => (
                            <span key={index} className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs font-bold border border-red-100">
                              + {item}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h5 className="text-xs font-bold text-green-400 uppercase tracking-widest px-1">Pertinent Negatives</h5>
                        <div className="flex flex-wrap gap-2">
                          {patientData.summary.keyNegatives.map((item, index) => (
                            <span key={index} className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-bold border border-green-100">
                              - {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 font-medium">Patient has not completed the recent intake form.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Status, Trends, Actions */}
            <div className="lg:col-span-4 space-y-8">
              {/* Quick Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <MetricSlot label="Pain" value={patientData?.summary.painLevel || 'N/A'} color="red" />
                <MetricSlot label="Wellbeing" value={patientData?.summary.wellbeing || 'N/A'} color="blue" />
              </div>

              {/* Recent Timeline Card */}
              <div className="glass-card p-6 border-slate-200">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Health Trend</h4>
                  <Activity className="w-4 h-4 text-slate-400" />
                </div>
                <div className="space-y-4">
                  {trends.slice(-4).reverse().map((entry, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                      <div>
                        <p className="text-xs font-bold text-slate-900">
                          {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium">Assessment</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-xs font-black text-red-500">{entry.painLevel}</div>
                          <div className="text-[8px] text-slate-300 uppercase font-black">Pain</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-black text-blue-500">{entry.wellbeing}</div>
                          <div className="text-[8px] text-slate-300 uppercase font-black">Well</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="w-full mt-6 py-3 text-xs font-bold text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors flex items-center justify-center gap-2">
                  View Full History <ExternalLink className="w-3 h-3" />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-4">
                <button
                  onClick={() => navigate('/doctor/session')}
                  className="btn-primary w-full py-4 text-lg shadow-blue-200 flex items-center justify-center gap-3"
                >
                  Start Session
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  onClick={() => navigate('/doctor/soap')}
                  className="btn-secondary w-full py-4 text-slate-700 flex items-center justify-center gap-3"
                >
                  <FileText className="w-5 h-5" />
                  Generate SOAP
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-24 text-center glass-card border-slate-200 shadow-xl max-w-2xl mx-auto">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-8">
              <Search className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-4">No Patient Loaded</h3>
            <p className="text-slate-500 mb-10">Enter a valid Patient ID above to view the clinical profile and AI insights.</p>
            <div className="flex justify-center gap-3">
              <div className="px-4 py-2 bg-slate-100 rounded-lg text-sm font-bold text-slate-500">Suggested: DEMO-001</div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

const MetricSlot: React.FC<{ label: string; value: string | number; color: 'red' | 'blue' | 'green' }> = ({ label, value, color }) => {
  const colors = {
    red: 'bg-red-50 text-red-600 border-red-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    green: 'bg-green-50 text-green-600 border-green-100',
  };

  return (
    <div className={`p-4 rounded-2xl border ${colors[color]} flex flex-col items-center justify-center text-center`}>
      <span className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-60">{label}</span>
      <span className="text-2xl font-black">{value}</span>
      <span className="text-[10px] font-bold opacity-40">TARGET: {color === 'red' ? '<3' : '>8'}</span>
    </div>
  );
}

