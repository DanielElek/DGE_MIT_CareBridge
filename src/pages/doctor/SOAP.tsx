import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../AppContext';
import { Layout } from '../../components/Layout';
import { Copy, CheckCircle2, XCircle, ShieldCheck, FileText, Download, Save, Zap, Hash } from 'lucide-react';

export const SOAP: React.FC = () => {
  const { doctorSession, updateSOAP, textSize } = useApp();
  const navigate = useNavigate();
  const [soap, setSOAP] = useState(doctorSession.soap);
  const [copied, setCopied] = useState(false);

  const handleSOAPChange = (field: keyof typeof soap, value: string) => {
    const updatedSOAP = { ...soap, [field]: value };
    setSOAP(updatedSOAP);
    updateSOAP(updatedSOAP);
  };

  const handleCopySOAP = () => {
    const text = `SUBJECTIVE:\n${soap.subjective}\n\nOBJECTIVE:\n${soap.objective}\n\nASSESSMENT:\n${soap.assessment}\n\nPLAN:\n${soap.plan}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8 animate-slide-up">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-500/10 text-primary rounded-full text-xs font-bold uppercase tracking-wider mb-3">
              <ShieldCheck className="w-3 h-3" /> HIPAA Compliant Local AI
            </div>
            <h2 className={`font-black text-text-strong tracking-tight ${textSize === 'large' ? 'text-4xl' : 'text-3xl'}`}>
              Clinical Note
            </h2>
            <p className="text-text-muted mt-2 text-lg">AI-Drafted SOAP Note based on session audio.</p>
          </div>

          <div className="flex gap-3">
            <button onClick={() => navigate('/doctor/session')} className="btn-secondary flex items-center gap-2 border-border text-text-muted">
              Back to Session
            </button>
            <button onClick={handleCopySOAP} className="btn-secondary flex items-center gap-2 border-border text-text-muted">
              {copied ? <CheckCircle2 className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button onClick={() => { }} className="btn-primary flex items-center gap-2 bg-primary hover:bg-primary-900 shadow-lg shadow-primary/20">
              <Save className="w-4 h-4" /> Finalize & Sign
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left - SOAP Note Editor */}
          <div className="lg:col-span-8 space-y-8">
            <div className="glass-card border-border overflow-hidden">
              <div className="grid grid-cols-1 divide-y divide-border">
                <SoapSection
                  id="subjective"
                  label="Subjective"
                  value={soap.subjective}
                  onChange={(val) => handleSOAPChange('subjective', val)}
                  hints={['History of lower back pain', 'Onset: 3 days ago', 'Sharp pain with movement']}
                />
                <SoapSection
                  id="objective"
                  label="Objective"
                  value={soap.objective}
                  onChange={(val) => handleSOAPChange('objective', val)}
                  hints={['Normal gait', 'Pain localized to L4-L5', 'Positive straight leg raise right']}
                />
                <SoapSection
                  id="assessment"
                  label="Assessment"
                  value={soap.assessment}
                  onChange={(val) => handleSOAPChange('assessment', val)}
                  hints={['Acute lumbar radiculopathy', 'Lumbar strain']}
                />
                <SoapSection
                  id="plan"
                  label="Plan"
                  value={soap.plan}
                  onChange={(val) => handleSOAPChange('plan', val)}
                  hints={['Prescribe NSAIDs', 'Physical therapy referral', 'Follow-up in 2 weeks']}
                />
              </div>
            </div>
          </div>

          {/* Right - AI Clinical Tools */}
          <div className="lg:col-span-4 space-y-8">
            {/* Clinical Codes */}
            <div className="glass-card p-6 border-accent-500/10 bg-accent-500/5">
              <div className="flex items-center gap-2 mb-6">
                <Hash className="w-4 h-4 text-primary" />
                <h4 className="text-xs font-bold text-text-strong uppercase tracking-widest">Suggested ICD-10 Codes</h4>
              </div>
              <div className="space-y-3">
                <CodeItem code="M54.50" desc="Low back pain, unspecified" />
                <CodeItem code="M54.16" desc="Radiculopathy, lumbar region" />
                <CodeItem code="S39.012" desc="Strain of muscle, fascia and tendon of lower back" />
              </div>
            </div>

            {/* Quality Checks */}
            <div className="glass-card p-6 border-border">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-xs font-bold text-text-muted uppercase tracking-widest">Note Quality</h4>
                <div className="w-8 h-8 rounded-full border-2 border-primary flex items-center justify-center text-[10px] font-bold text-primary">92%</div>
              </div>
              <div className="space-y-4">
                <QualityCheck label="Patient ID verified" checked />
                <QualityCheck label="Red flags discussed" checked />
                <QualityCheck label="Risk profile assessed" checked />
                <QualityCheck label="Billing compliance" checked />
              </div>
            </div>

            {/* Export Panel */}
            <div className="glass-card p-6 border-border">
              <h4 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4">Export Note</h4>
              <div className="grid grid-cols-2 gap-3">
                <button className="flex flex-col items-center justify-center p-4 bg-surface-muted rounded-xl hover:bg-white transition-all border border-border text-text-muted">
                  <FileText className="w-6 h-6 mb-2" />
                  <span className="text-[10px] font-bold uppercase">PDF</span>
                </button>
                <button className="flex flex-col items-center justify-center p-4 bg-surface-muted rounded-xl hover:bg-white transition-all border border-border text-text-muted">
                  <Download className="w-6 h-6 mb-2" />
                  <span className="text-[10px] font-bold uppercase">HL7/EMR</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

const SoapSection: React.FC<{ id: string; label: string; value: string; onChange: (v: string) => void; hints: string[] }> = ({ label, value, onChange, hints }) => (
  <div className="p-8 group hover:bg-surface-muted/50 transition-all">
    <div className="flex items-center justify-between mb-4">
      <span className="text-xs font-black text-text-muted uppercase tracking-[0.2em]">{label}</span>
      <button className="text-[10px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">Auto-correct</button>
    </div>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={4}
      className="w-full bg-transparent border-none p-0 focus:ring-0 text-text font-medium leading-relaxed resize-none text-lg min-h-[120px]"
      placeholder={`Enter ${label.toLowerCase()} notes...`}
    />
    <div className="mt-4 flex flex-wrap gap-2">
      {hints.map((hint, i) => (
        <button
          key={i}
          onClick={() => onChange(value + (value ? ' ' : '') + hint + '.')}
          className="px-2.5 py-1 bg-white border border-border rounded-lg text-[10px] font-bold text-text-muted hover:border-accent-500 hover:text-primary hover:bg-accent-500/5 transition-all shadow-sm"
        >
          + {hint}
        </button>
      ))}
    </div>
  </div>
);

const CodeItem: React.FC<{ code: string; desc: string }> = ({ code, desc }) => (
  <div className="p-3 bg-white rounded-xl border border-accent-500/10 shadow-sm hover:shadow-md transition-all cursor-pointer group">
    <div className="flex items-center justify-between mb-1">
      <span className="text-xs font-black text-primary">{code}</span>
      <div className="p-1 bg-accent-500/10 rounded-md opacity-0 group-hover:opacity-100 transition-all">
        <Zap className="w-3 h-3 text-accent-400" />
      </div>
    </div>
    <p className="text-[10px] font-medium text-text-muted leading-tight">{desc}</p>
  </div>
);

const QualityCheck: React.FC<{ label: string; checked: boolean }> = ({ label, checked }) => (
  <div className="flex items-center gap-3">
    {checked ? <CheckCircle2 className="w-4 h-4 text-primary" /> : <XCircle className="w-4 h-4 text-border" />}
    <span className={`text-[11px] font-bold ${checked ? 'text-text-strong' : 'text-text-muted'}`}>{label}</span>
  </div>
);

