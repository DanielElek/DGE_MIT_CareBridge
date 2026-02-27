import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../AppContext';
import { Layout } from '../../components/Layout';
import {
    Mic, Square, Play, Pause, RotateCcw, Save, ArrowLeft,
    Clock, Trash2,
    ChevronRight, Sparkles, Loader2, Check, AlertCircle, Mail
} from 'lucide-react';

// --- TYPES ---
type SessionStep =
    | "recording_initial"
    | "ready_to_analyze_initial"
    | "analyzing_initial"
    | "followup_questions_ready"
    | "recording_followup"
    | "ready_to_analyze_followup"
    | "analyzing_followup"
    | "final_ready";

interface AIQuestion {
    id: string;
    question: string;
    priority?: "High" | "Medium" | "Low";
    checked?: boolean;
}

interface SOAPDraft {
    S: string;
    O: string;
    A: string;
    P: string;
}

// --- MOCK AI FUNCTIONS ---
const localAI = {
    analyzeInitial: async (_audioUrl: string) => {
        await new Promise(r => setTimeout(r, 3000));
        return {
            summary: "AI Summary (Initial Conversation): Patient confirms sharp L4-L5 lumbar pain following lifting incident. Pain is localized but increases with rotation. Patient denies saddle anesthesia. Conservative management with Ibuprofen (400mg) provides partial relief. Sleep is disrupted.",
            questions: [
                { id: 'q1', question: "Any numbness in the feet or toes?", priority: "High" },
                { id: 'q2', question: "Have you noticed any weakness when walking or standing?", priority: "High" },
                { id: 'q3', question: "Is the pain worse in the morning or evening?", priority: "Medium" },
                { id: 'q4', question: "Does the pain radiate down either leg?", priority: "Medium" },
                { id: 'q5', question: "Have you had similar back issues in the past?", priority: "Low" }
            ] as AIQuestion[]
        };
    },
    analyzeFollowup: async (_audioUrl: string) => {
        await new Promise(r => setTimeout(r, 3500));
        return {
            summary: "AI Summary (After Follow-up): Patient confirms no numbness or motor weakness. Pain is worse in the evening after daily activity. Radiation is absent. This is a first-time acute episode. Clinical findings strongly support a localized mechanical lumbar strain without radiculopathy."
        };
    },
    generateSOAP: async (_summaryText: string): Promise<SOAPDraft> => {
        await new Promise(r => setTimeout(r, 2000));
        return {
            S: "Patient reports 4-day history of sharp L4-L5 pain. No radiculopathy. Relieved slightly by NSAIDs. First episode.",
            O: "Point tenderness at L4. Lumbar flexion limited to 40 degrees. Deep tendon reflexes intact.",
            A: "Acute mechanical low back pain / lumbar strain. No red flags noted.",
            P: "Physical therapy referral. Ergonomic education. Review in 2 weeks. NSAIDs as needed."
        };
    }
};

const WaveformAnimated: React.FC<{ isRecording: boolean }> = ({ isRecording }) => (
    <div className="relative w-full h-32 flex items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50/50 to-indigo-50/50 border border-white shadow-inner group-hover:border-blue-200 transition-all duration-500">
        <svg viewBox="0 0 200 60" preserveAspectRatio="none" className={`w-full h-full scale-y-110 transition-opacity duration-700 ${isRecording ? 'opacity-90' : 'opacity-30'}`}>
            <defs>
                <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                    <stop offset="50%" stopColor="#2563eb" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.2" />
                </linearGradient>
            </defs>
            <path
                d="M -200 30 Q -175 10 -150 30 Q -125 50 -100 30 Q -75 10 -50 30 Q -25 50 0 30 Q 25 10 50 30 Q 75 50 100 30 Q 125 10 150 30 Q 175 50 200 30"
                fill="none"
                stroke="url(#waveGradient)"
                strokeWidth="1.5"
                className={isRecording ? 'animate-wave-1' : ''}
            />
            <path
                d="M -200 30 Q -175 22 -150 30 Q -125 38 -100 30 Q -75 22 -50 30 Q -25 38 0 30 Q 25 22 50 30 Q 75 38 100 30 Q 125 22 150 30 Q 175 38 200 30"
                fill="none"
                stroke="#60a5fa"
                strokeWidth="1"
                className={isRecording ? 'animate-wave-2' : ''}
            />
            <path
                d="M -200 30 Q -175 5 -150 30 Q -125 55 -100 30 Q -75 5 -50 30 Q -25 55 0 30 Q 25 5 50 30 Q 75 55 100 30 Q 125 5 150 30 Q 175 55 200 30"
                fill="none"
                stroke="#2563eb"
                strokeWidth="2"
                className={isRecording ? 'animate-wave-3' : ''}
            />
        </svg>
        {!isRecording && (
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-[80%] h-[1px] bg-blue-200/50 rounded-full" />
            </div>
        )}
        {isRecording && (
            <div className="absolute top-4 right-4 flex items-center gap-2 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-full border border-blue-100 shadow-sm animate-pulse">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">Live</span>
            </div>
        )}
    </div>
);

export const Treatment: React.FC = () => {
    const { currentClinicalPatient, textSize } = useApp();
    const navigate = useNavigate();

    // --- WORKFLOW STATE ---
    const [sessionStep, setSessionStep] = useState<SessionStep>("recording_initial");
    const [initialRecording, setInitialRecording] = useState<{ url: string; blob: Blob } | null>(null);
    const [followupRecording, setFollowupRecording] = useState<{ url: string; blob: Blob } | null>(null);
    const [aiSummary, setAiSummary] = useState<string | null>(null);
    const [aiQuestions, setAiQuestions] = useState<AIQuestion[]>([]);
    const [soapDraft, setSoapDraft] = useState<SOAPDraft | null>(null);

    // UI Feedback States
    const [isSaving, setIsSaving] = useState(false);
    const [emailInput, setEmailInput] = useState("");

    // Recording Engine State
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const sessionStepRef = useRef<SessionStep>("recording_initial");

    const isLarge = textSize === 'large';

    useEffect(() => {
        sessionStepRef.current = sessionStep;
    }, [sessionStep]);

    useEffect(() => {
        if (!currentClinicalPatient) {
            navigate('/doctor/patient');
        } else if (currentClinicalPatient.email) {
            setEmailInput(currentClinicalPatient.email);
        }
    }, [currentClinicalPatient, navigate]);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    const startTimer = () => {
        timerRef.current = setInterval(() => {
            setElapsedTime(prev => prev + 1);
        }, 1000);
    };

    const stopTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                const url = URL.createObjectURL(blob);
                setAudioUrl(url);

                if (sessionStepRef.current === "recording_initial") {
                    setInitialRecording({ url, blob });
                    setSessionStep("ready_to_analyze_initial");
                } else if (sessionStepRef.current === "recording_followup") {
                    setFollowupRecording({ url, blob });
                    setSessionStep("ready_to_analyze_followup");
                }
            };

            mediaRecorder.start();
            setIsRecording(true);
            setIsPaused(false);
            startTimer();
        } catch (err) {
            console.error('Error accessing microphone:', err);
        }
    };

    const pauseRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.pause();
            setIsPaused(true);
            stopTimer();
        }
    };

    const resumeRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.resume();
            setIsPaused(false);
            startTimer();
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            setIsRecording(false);
            setIsPaused(false);
            stopTimer();
        }
    };

    const resetRecording = () => {
        setAudioUrl(null);
        setElapsedTime(0);
        if (sessionStep === "ready_to_analyze_initial") setSessionStep("recording_initial");
        if (sessionStep === "ready_to_analyze_followup") setSessionStep("recording_followup");
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // --- WORKFLOW HANDLERS ---
    const handleAnalyzeInitial = async () => {
        if (!initialRecording) return;
        setSessionStep("analyzing_initial");
        try {
            const result = await localAI.analyzeInitial(initialRecording.url);
            setAiSummary(result.summary);
            setAiQuestions(result.questions);
            setSessionStep("followup_questions_ready");
            setAudioUrl(null);
            setElapsedTime(0);
        } catch (e) {
            setSessionStep("ready_to_analyze_initial");
            alert("Analysis failed. Please retry.");
        }
    };

    const handleAnalyzeFollowup = async () => {
        if (!followupRecording) return;
        setSessionStep("analyzing_followup");
        try {
            const result = await localAI.analyzeFollowup(followupRecording.url);
            setAiSummary(result.summary);
            setSessionStep("final_ready");
            setAudioUrl(null);
            setElapsedTime(0);

            // AUTOMATIC SOAP GENERATION
            const soapResult = await localAI.generateSOAP(result.summary);
            setSoapDraft(soapResult);
        } catch (e) {
            setSessionStep("ready_to_analyze_followup");
            alert("Analysis update failed. Please retry.");
        }
    };

    const handleCommitRecord = () => {
        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
            alert("Session committed to patient record.");
        }, 1500);
    };

    const handleSendEmail = () => {
        if (!emailInput) {
            alert("No email address found for this patient.");
            return;
        }
        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
            alert(`Summary emailed to ${emailInput}`);
        }, 1500);
    };

    if (!currentClinicalPatient) return null;

    const isFinalStep = sessionStep === "final_ready";

    return (
        <Layout hideHeader>
            <div className={`h-screen bg-[#FDFDFF] flex flex-col text-slate-800 overflow-hidden font-sans ${isLarge ? 'text-lg' : 'text-sm'}`}>

                {/* Superior Clinical Header */}
                <header className="h-14 shrink-0 bg-white/80 backdrop-blur-xl border-b border-slate-100 flex items-center justify-between px-8 z-20 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => navigate('/doctor/patient')}
                            className="p-1.5 hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded-lg transition-all group"
                        >
                            <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
                        </button>
                        <div className="flex flex-col">
                            <h1 className={`${isLarge ? 'text-lg' : 'text-sm'} font-bold text-slate-900 flex items-center gap-2`}>
                                Treatment Session <ChevronRight className="w-3 h-3 text-slate-300" />
                                <span className="text-slate-500 font-medium">{currentClinicalPatient.name}</span>
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {!isFinalStep && (
                            <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-full border border-slate-100">
                                <div className={`w-1.5 h-1.5 rounded-full ${isRecording ? (isPaused ? 'bg-amber-400' : 'bg-red-500 animate-pulse') : 'bg-slate-300'}`} />
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                                    {isRecording ? (isPaused ? 'Paused' : 'Recording Live') : 'Standby Mode'}
                                </span>
                            </div>
                        )}
                        {isFinalStep && (
                            <div className="flex items-center gap-2">
                                <button
                                    className="h-9 px-5 bg-white border border-slate-200 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-blue-600 hover:text-blue-600 transition-all flex items-center gap-2"
                                    onClick={handleSendEmail}
                                    disabled={isSaving}
                                >
                                    <Mail className="w-3.5 h-3.5" /> Send to Patient
                                </button>
                                <button
                                    className="h-9 px-5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
                                    onClick={handleCommitRecord}
                                    disabled={isSaving}
                                >
                                    {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                    Save Encounter
                                </button>
                            </div>
                        )}
                    </div>
                </header>

                {/* Workspace */}
                <main className="flex-1 p-6 lg:p-10 overflow-hidden flex justify-center ">
                    <div className="w-full max-w-[1440px] flex flex-col lg:flex-row gap-8 overflow-hidden">

                        {/* LEFT: Master Recorder Card (Hidden in Final Step) */}
                        {!isFinalStep && (
                            <div className="w-full lg:w-[360px] flex flex-col gap-6 shrink-0 animate-slide-up">
                                <div className="bg-white border border-slate-100 p-8 shadow-[0_20px_50px_rgba(0,0,0,0.03)] flex flex-col overflow-hidden relative group rounded-[2.5rem]">

                                    <WaveformAnimated isRecording={isRecording && !isPaused} />

                                    <div className="mt-10 text-center relative">
                                        <div className={`${isLarge ? 'text-7xl' : 'text-6xl'} font-black tabular-nums tracking-tighter mb-1 text-slate-900 drop-shadow-sm`}>
                                            {formatTime(elapsedTime)}
                                        </div>
                                        <div className="flex items-center justify-center gap-2">
                                            <Clock className="w-3.5 h-3.5 text-blue-500/50" />
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                                                {sessionStep.includes("followup") ? "Follow-up Session" : "Encounter duration"}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Controls Area */}
                                    <div className="mt-12 flex flex-col items-center gap-6 relative z-10 w-full">
                                        {isRecording ? (
                                            <div className="flex items-center justify-center gap-6">
                                                <button
                                                    onClick={isPaused ? resumeRecording : pauseRecording}
                                                    className={`w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all duration-300 hover:scale-110 ${isPaused
                                                        ? 'bg-blue-600 border-blue-600 shadow-xl shadow-blue-200 text-white'
                                                        : 'bg-white border-slate-100 hover:border-blue-200 text-slate-600 shadow-sm'
                                                        }`}
                                                >
                                                    {isPaused ? <Play className="w-6 h-6 fill-current" /> : <Pause className="w-6 h-6" />}
                                                </button>
                                                <button
                                                    onClick={stopRecording}
                                                    className="w-20 h-20 rounded-full bg-slate-900 hover:bg-black flex items-center justify-center shadow-2xl shadow-slate-200 hover:scale-105 active:scale-95 transition-all outline-none"
                                                >
                                                    <Square className="w-8 h-8 fill-blue-500" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="w-full space-y-4 animate-fade-in">
                                                {sessionStep === "recording_initial" && (
                                                    <button
                                                        onClick={startRecording}
                                                        className="w-full h-16 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl flex items-center justify-center gap-4 hover:shadow-2xl hover:shadow-blue-600/30 transition-all group overflow-hidden relative"
                                                    >
                                                        <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                                                        <Mic className="w-5 h-5 relative z-10" />
                                                        <span className="text-[11px] font-black uppercase tracking-[0.2em] relative z-10">Start Recording</span>
                                                    </button>
                                                )}

                                                {sessionStep === "ready_to_analyze_initial" && (
                                                    <div className="space-y-3">
                                                        <button
                                                            onClick={handleAnalyzeInitial}
                                                            className="w-full h-14 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-3"
                                                        >
                                                            <Sparkles className="w-4 h-4" /> Analyze (Local AI)
                                                        </button>
                                                        <button onClick={resetRecording} className="w-full text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2 hover:text-blue-600 transition-colors">
                                                            <RotateCcw className="w-3 h-3" /> Redo Recording
                                                        </button>
                                                    </div>
                                                )}

                                                {sessionStep === "followup_questions_ready" && (
                                                    <button
                                                        onClick={() => { setSessionStep("recording_followup"); startRecording(); }}
                                                        className="w-full h-14 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-3"
                                                    >
                                                        <Mic className="w-4 h-4" /> Start Follow-up Session
                                                    </button>
                                                )}

                                                {sessionStep === "ready_to_analyze_followup" && (
                                                    <div className="space-y-3">
                                                        <button
                                                            onClick={handleAnalyzeFollowup}
                                                            className="w-full h-14 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-3"
                                                        >
                                                            <Sparkles className="w-4 h-4" /> Update Summary (Local AI)
                                                        </button>
                                                        <button onClick={resetRecording} className="w-full text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2 hover:text-blue-600 transition-colors">
                                                            <RotateCcw className="w-3 h-3" /> Redo Follow-up
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {audioUrl && !isRecording && !sessionStep.includes("analyzing") && (
                                        <div className="mt-10 p-6 rounded-3xl bg-slate-50/80 border border-slate-100 animate-slide-up shadow-sm">
                                            <div className="flex items-center justify-between mb-4">
                                                <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1.5">
                                                    <Sparkles className="w-3 h-3" /> Preview Audio
                                                </span>
                                                <button onClick={resetRecording} className="p-1.5 hover:bg-red-50 text-red-400 rounded-lg transition-colors">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                            <audio controls src={audioUrl} className="w-full h-8 brightness-110 filter hue-rotate-180 opacity-80" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* RIGHT: Primary Clinical Content Card */}
                        <div className="flex-1 flex flex-col gap-6 overflow-hidden animate-slide-up animate-delay-1">

                            <div className="bg-white border border-slate-100 flex-1 flex flex-col overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.02)] rounded-[2.5rem]">
                                <div className="flex-1 overflow-hidden flex flex-col xl:flex-row">
                                    {/* Summary Section */}
                                    <div className={`${isFinalStep ? 'flex-[1.5]' : 'flex-[3]'} border-r border-slate-50 flex flex-col overflow-hidden bg-white relative`}>

                                        {/* Embedded Loading State */}
                                        {sessionStep.includes("analyzing") && (
                                            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-20 flex flex-col items-center justify-center">
                                                <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Neural AI Analyzing...</p>
                                            </div>
                                        )}

                                        <div className="px-10 py-5 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between shrink-0">
                                            <h3 className="text-xl font-black text-blue-600 tracking-tight uppercase">Summary</h3>
                                            <div className="bg-white px-3 py-1 rounded-lg border border-slate-100 shadow-sm">
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Encounter Analysis</span>
                                            </div>
                                        </div>
                                        <div className="flex-1 overflow-y-auto p-10 scrollbar-thin">
                                            <div className={`leading-[1.8] transition-all duration-700 font-medium ${isLarge ? 'text-xl' : 'text-base'} ${aiSummary ? 'text-slate-800' : 'text-slate-600'}`}>
                                                {aiSummary || currentClinicalPatient.latestSummary.text}
                                            </div>
                                        </div>
                                    </div>

                                    {/* SOAP / Topics Section */}
                                    <div className={`${isFinalStep ? 'flex-[2.5]' : 'flex-[2]'} flex flex-col overflow-hidden bg-slate-50/20 relative`}>

                                        {!isFinalStep && (
                                            <>
                                                {/* Embedded Loading State overlay */}
                                                {sessionStep.includes("analyzing") && (
                                                    <div className="absolute inset-0 bg-slate-50/20 backdrop-blur-[1px] z-10" />
                                                )}

                                                <div className="px-10 py-6 border-b border-slate-50/50 bg-white">
                                                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">
                                                        {aiQuestions.length > 0 ? "Neural Insights: Follow-up" : "Topics to Cover"}
                                                    </p>
                                                </div>
                                                <div className="flex-1 overflow-y-auto p-8 scrollbar-thin">
                                                    <ul className="space-y-6">
                                                        {(aiQuestions.length > 0 ? aiQuestions : currentClinicalPatient.suggestedTopics || []).map((topic: any, idx: number) => (
                                                            <li
                                                                key={topic.id}
                                                                className="group flex items-start gap-4 animate-fade-in"
                                                                style={{ animationDelay: `${idx * 0.1}s` }}
                                                            >
                                                                <div className="mt-2 w-1.5 h-1.5 rounded-full bg-blue-500/40 shrink-0 group-hover:bg-blue-600 group-hover:scale-125 transition-all" />
                                                                <div className="flex flex-col gap-1 flex-1">
                                                                    <p className={`font-bold leading-relaxed transition-all ${isLarge ? 'text-lg' : 'text-[11px]'} text-slate-700 group-hover:text-slate-900`}>
                                                                        {topic.question || topic.text}
                                                                    </p>
                                                                </div>
                                                            </li>
                                                        ))}
                                                    </ul>

                                                    {aiQuestions.length > 0 && sessionStep === "followup_questions_ready" && (
                                                        <div className="mt-8 p-6 bg-blue-100/30 border border-dashed border-blue-200 rounded-[2rem] text-center animate-bounce-short">
                                                            <AlertCircle className="w-5 h-5 text-blue-500 mx-auto mb-2" />
                                                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Phase 2: Target questions</p>
                                                            <p className="text-[11px] font-bold text-slate-400 leading-tight mt-1">Please address these questions in the follow-up recording phase.</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </>
                                        )}

                                        {isFinalStep && soapDraft && (
                                            <div className="flex flex-col h-full animate-fade-in">
                                                <div className="px-10 py-5 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between shrink-0">
                                                    <h3 className="text-xl font-black text-blue-600 tracking-tight uppercase">Clinical SOAP Documentation</h3>
                                                    <div className="bg-white px-3 py-1 rounded-lg border border-slate-100 shadow-sm">
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Final Report</span>
                                                    </div>
                                                </div>
                                                <div className="flex-1 overflow-y-auto p-8 scrollbar-thin">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {(['S', 'O', 'A', 'P'] as const).map(key => (
                                                            <div key={key} className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm hover:border-blue-100 transition-all">
                                                                <div className="flex items-center gap-3 mb-4">
                                                                    <span className="w-6 h-6 bg-blue-600 text-white rounded-xl flex items-center justify-center text-[11px] font-black">{key}</span>
                                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                                        {key === 'S' ? 'Subjective' : key === 'O' ? 'Objective' : key === 'A' ? 'Assessment' : 'Plan'}
                                                                    </span>
                                                                </div>
                                                                <textarea
                                                                    className="w-full h-40 bg-transparent border-none outline-none text-[13px] font-bold text-slate-700 leading-relaxed scrollbar-thin resize-none"
                                                                    value={soapDraft[key]}
                                                                    onChange={(e) => setSoapDraft({ ...soapDraft, [key]: e.target.value })}
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="p-8 border-t border-slate-100 text-center flex items-center justify-center bg-white/50">
                                            {isFinalStep ? (
                                                <div className="flex items-center gap-3 text-emerald-600 bg-emerald-50 px-5 py-2.5 rounded-full border border-emerald-100">
                                                    <Check className="w-4 h-4" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Documentation Ready</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-3 text-slate-400">
                                                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                                    <span className="text-[9px] font-black uppercase tracking-widest">Sequence Integrity: Valid</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </main>
            </div>
        </Layout>
    );
};
