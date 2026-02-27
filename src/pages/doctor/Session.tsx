import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../AppContext';
import { Layout } from '../../components/Layout';
import { Mic, Square, ArrowRight, Zap, MessageSquare, AlertTriangle, ShieldCheck, ListChecks } from 'lucide-react';

interface TranscriptLine {
  speaker: 'Doctor' | 'Patient';
  text: string;
  time: string;
}

export const Session: React.FC = () => {
  const { patientData, textSize } = useApp();
  const navigate = useNavigate();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [hasRecording, setHasRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  const simulationLines: TranscriptLine[] = [
    { speaker: 'Doctor', text: 'Good morning, John. I see you\'ve been having some lower back pain.', time: '0:02' },
    { speaker: 'Patient', text: 'Yes, it started about three days ago after I tried to move some boxes.', time: '0:08' },
    { speaker: 'Doctor', text: 'Is it a sharp pain or more of a dull ache?', time: '0:15' },
    { speaker: 'Patient', text: 'It\'s sharp when I move, but mostly just a tight, dull ache when I sit still.', time: '0:22' },
    { speaker: 'Doctor', text: 'Understood. Have you noticed any numbness in your legs?', time: '0:30' },
    { speaker: 'Patient', text: 'A little bit on the right side, just down to the knee.', time: '0:38' },
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(t => t + 1);

        // Simulate transcript appearing
        const currentLineIndex = Math.floor(recordingTime / 8);
        if (currentLineIndex < simulationLines.length && !transcript.some(l => l.text === simulationLines[currentLineIndex].text)) {
          setTranscript(prev => [...prev, simulationLines[currentLineIndex]]);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording, recordingTime, transcript]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  const handleStartRecording = () => {
    setIsRecording(true);
  };

  const handleStopRecording = async () => {
    setIsRecording(false);
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsProcessing(false);
    setHasRecording(true);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Layout>
      <div className="max-w-[1600px] mx-auto px-4 py-8 animate-slide-up">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h2 className={`font-black text-slate-900 tracking-tight ${textSize === 'large' ? 'text-4xl' : 'text-3xl'}`}>
              Interactive Session
            </h2>
            <p className="text-slate-500 mt-2 text-lg">AI-Augmented consultation with real-time analysis.</p>
          </div>

          <div className="flex items-center gap-6 bg-slate-100 p-2 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-3 px-4">
              <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-slate-300'}`} />
              <span className="font-mono font-black text-xl text-slate-700">{formatTime(recordingTime)}</span>
            </div>
            {isRecording ? (
              <button onClick={handleStopRecording} className="flex items-center gap-2 px-6 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg active:scale-95">
                <Square className="w-4 h-4 fill-white" /> Stop
              </button>
            ) : hasRecording ? (
              <button onClick={() => navigate('/doctor/soap')} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg active:scale-95">
                Analyze & Generate SOAP <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={handleStartRecording} className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg active:scale-95">
                <Mic className="w-4 h-4" /> Record Session
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Transcript Panel */}
          <div className="lg:col-span-8 flex flex-col h-[700px]">
            <div className="glass-card flex-1 border-slate-200 overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-500 font-bold text-xs uppercase tracking-widest">
                  <MessageSquare className="w-4 h-4" /> Live Transcription
                </div>
                <div className="flex items-center gap-4 text-[10px] font-bold">
                  <span className="flex items-center gap-1.5 text-green-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" /> Mic Active
                  </span>
                  <span className="text-slate-400">EN-US</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-thin">
                {transcript.length === 0 && !isRecording && (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-40 grayscale">
                    <Mic className="w-16 h-16 mb-4" />
                    <p className="font-bold">Waiting for session to begin...</p>
                    <p className="text-sm">Click "Record" to start capturing audio.</p>
                  </div>
                )}

                {transcript.map((line, i) => (
                  <div key={i} className={`flex gap-4 animate-slide-up ${line.speaker === 'Doctor' ? 'opacity-60' : ''}`}>
                    <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold ${line.speaker === 'Doctor' ? 'bg-slate-100 text-slate-500' : 'bg-blue-100 text-blue-600'
                      }`}>
                      {line.speaker[0]}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-slate-400">{line.speaker}</span>
                        <span className="text-[10px] text-slate-300">{line.time}</span>
                      </div>
                      <p className="text-slate-700 font-medium leading-relaxed">{line.text}</p>
                    </div>
                  </div>
                ))}
                <div ref={transcriptEndRef} />
              </div>

              <div className="p-4 border-t border-slate-100 bg-white">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 rounded-lg text-indigo-500 animate-pulse"><Zap className="w-4 h-4" /></div>
                  <p className="text-xs font-medium text-slate-500">AI is listening and flags potential clinical themes in real-time...</p>
                </div>
              </div>
            </div>
          </div>

          {/* AI Suggestions / Sidebars */}
          <div className="lg:col-span-4 space-y-6">
            {/* Dynamic AI Insights */}
            <div className="glass-card p-6 border-indigo-100 bg-indigo-50/10">
              <div className="flex items-center gap-2 mb-6 text-indigo-600">
                <ShieldCheck className="w-5 h-5" />
                <h4 className="font-bold uppercase tracking-wider text-xs">Real-time Insights</h4>
              </div>

              <div className="space-y-4">
                <InsightItem
                  icon={<Zap className="w-4 h-4" />}
                  active={transcript.length > 3}
                  title="Neuropathic Flags"
                  desc="Patient mentioned 'numbness' down to the knee. Correlate with Radiculopathy."
                />
                <InsightItem
                  icon={<ListChecks className="w-4 h-4" />}
                  active={transcript.length > 1}
                  title="History Gap"
                  desc="Onset clarified as '3 days ago'. Ask about previous episodes."
                />
                <InsightItem
                  icon={<AlertTriangle className="w-4 h-4 text-orange-500" />}
                  active={false}
                  title="Red Flag Monitor"
                  desc="No mentions of saddle anesthesia or bowel/bladder issues yet."
                />
              </div>
            </div>

            {/* Patient Snapshot */}
            <div className="glass-card p-6 border-slate-200">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Patient Snapshot</h4>
              <div className="flex items-center gap-4 mb-6 p-3 bg-slate-50 rounded-xl">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-slate-200 shadow-sm font-black text-indigo-600">JD</div>
                <div>
                  <p className="font-bold text-slate-800 text-sm">John Doe</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">68y • Male • Lumbar Sx</p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-600 px-1">Recent Intake Notes:</p>
                {patientData?.summary.bullets.slice(0, 2).map((b, i) => (
                  <div key={i} className="text-[11px] leading-relaxed text-slate-500 font-medium p-2 border-l-2 border-slate-100">
                    {b}
                  </div>
                ))}
              </div>
            </div>

            {/* Processing Overlay if needed */}
            {isProcessing && (
              <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-6">
                <div className="glass-card p-12 text-center max-w-sm border-white/20 bg-white/80 shadow-2xl animate-scale-up">
                  <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-8 border-4 border-indigo-50 shadow-inner">
                    <Zap className="w-10 h-10 text-indigo-600 animate-pulse" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-2">Analyzing Session</h3>
                  <p className="text-slate-600 font-medium mb-8">Generating structured clinical hints based on the audio history...</p>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 animate-progress" style={{ width: '100%' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

const InsightItem: React.FC<{ icon: React.ReactNode; title: string; desc: string; active: boolean }> = ({ icon, title, desc, active }) => (
  <div className={`p-4 rounded-xl border transition-all duration-500 ${active ? 'bg-white border-indigo-200 shadow-sm opacity-100 scale-100' : 'bg-slate-50 border-slate-100 opacity-40 grayscale translate-y-2'
    }`}>
    <div className="flex items-center gap-2 mb-2 text-indigo-600">
      {icon}
      <span className="text-xs font-bold">{title}</span>
    </div>
    <p className="text-[11px] font-medium text-slate-600 leading-normal">{desc}</p>
  </div>
);

