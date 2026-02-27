import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../AppContext';
import { Layout } from '../../components/Layout';
import { Share2, Printer, TrendingUp, AlertCircle, CheckCircle2, Calendar, Clock, Gauge, Moon, Smile, ArrowRight, Sparkles } from 'lucide-react';

export const Summary: React.FC = () => {
  const { patientData, textSize, setRole } = useApp();
  const navigate = useNavigate();

  if (!patientData || !patientData.summary.bullets.length) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto px-4 py-12 animate-slide-up">
          <div className="glass-card p-12 text-center border-amber-200 bg-amber-50/30">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-amber-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">No summary available yet</h2>
            <p className="text-slate-600 mb-8">Please describe your symptoms first so our AI can generate a professional summary for your doctor.</p>
            <button
              onClick={() => navigate('/patient/complaint')}
              className="btn-primary flex items-center gap-2 mx-auto"
            >
              Start New Intake
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const handleShareWithDoctor = () => {
    setRole('doctor');
    navigate('/doctor/patient');
  };

  const handlePrint = () => {
    navigate('/print?type=patientSummary');
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8 animate-slide-up">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
              <Sparkles className="w-3 h-3" /> AI Analysis Complete
            </div>
            <h2 className={`font-bold text-slate-900 ${textSize === 'large' ? 'text-4xl' : 'text-3xl'}`}>
              Doctor-Ready Summary
            </h2>
            <p className="text-slate-500 mt-2 text-lg">Professional overview of your current condition.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={handlePrint} className="btn-secondary flex items-center gap-2">
              <Printer className="w-4 h-4" /> Print
            </button>
            <button onClick={handleShareWithDoctor} className="btn-primary flex items-center gap-2 shadow-blue-200">
              <Share2 className="w-4 h-4" /> Share with Doctor
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Main Summary Card */}
          <div className="glass-card p-8 border-slate-200">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-6">Clinical Narrative</h3>
            <ul className="space-y-4">
              {patientData.summary.bullets.map((bullet, index) => (
                <li key={index} className="flex items-start gap-4">
                  <div className="mt-1.5 w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                  <span className={`text-slate-700 font-medium ${textSize === 'large' ? 'text-xl' : 'text-lg'}`}>
                    {bullet}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Key Positives */}
            <div className="glass-card p-6 border-red-100 bg-red-50/10">
              <div className="flex items-center gap-2 mb-4 text-red-600">
                <AlertCircle className="w-5 h-5" />
                <h3 className="font-bold uppercase tracking-wider text-sm">Key Positives (Present)</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {patientData.summary.keyPositives.map((item, index) => (
                  <span key={index} className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-bold border border-red-200">
                    {item}
                  </span>
                ))}
              </div>
            </div>

            {/* Key Negatives */}
            <div className="glass-card p-6 border-green-100 bg-green-50/10">
              <div className="flex items-center gap-2 mb-4 text-green-600">
                <CheckCircle2 className="w-5 h-5" />
                <h3 className="font-bold uppercase tracking-wider text-sm">Key Negatives (Absent)</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {patientData.summary.keyNegatives.map((item, index) => (
                  <span key={index} className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-bold border border-green-200">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <MetricCard
              icon={<Calendar className="w-5 h-5 text-indigo-500" />}
              label="Onset"
              value={patientData.summary.onset}
              subValue="Estimated"
            />
            <MetricCard
              icon={<Clock className="w-5 h-5 text-orange-500" />}
              label="Duration"
              value={patientData.summary.duration}
              subValue="Self-reported"
            />
            <MetricCard
              icon={<Gauge className="w-5 h-5 text-red-500" />}
              label="Pain Level"
              value={`${patientData.summary.painLevel}/10`}
              subValue="Current focus"
            />
            <MetricCard
              icon={<Smile className="w-5 h-5 text-teal-500" />}
              label="Wellbeing"
              value={`${patientData.summary.wellbeing}/10`}
              subValue="Overall state"
            />
          </div>

          {/* Discussion Suggestions */}
          <div className="glass-card p-8 bg-blue-600 text-white shadow-blue-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-white/20 rounded-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold">Suggested for Discussion</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                "Review treatment options for pain management",
                "Discuss physical therapy or exercises",
                "Consider imaging if symptoms persist",
                "Monitor sleep quality improvements"
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-white/10 rounded-xl border border-white/20">
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">{i + 1}</div>
                  <span className="font-medium text-blue-50">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 flex justify-center">
          <button onClick={() => navigate('/patient/trends')} className="group flex items-center gap-3 text-slate-400 hover:text-blue-600 font-bold transition-all">
            View your long-term health trends
            <TrendingUp className="w-5 h-5 group-hover:translate-x-1 transition-all" />
          </button>
        </div>
      </div>
    </Layout>
  );
};

const MetricCard: React.FC<{ icon: React.ReactNode; label: string; value: string; subValue: string }> = ({ icon, label, value, subValue }) => (
  <div className="glass-card p-5 border-slate-100 flex flex-col items-center text-center">
    <div className="p-2.5 bg-slate-50 rounded-xl mb-4">{icon}</div>
    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</div>
    <div className="text-xl font-bold text-slate-800 mb-1">{value}</div>
    <div className="text-[10px] text-slate-400">{subValue}</div>
  </div>
);

