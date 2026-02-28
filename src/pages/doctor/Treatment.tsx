import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../AppContext';
import { Layout } from '../../components/Layout';
import {
    Mic, Square, Play, Pause, RotateCcw, Save, ArrowLeft,
    Clock, Trash2,
    ChevronRight, Sparkles, Loader2, Check, AlertCircle, Mail,
    ChevronUp, ChevronDown
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
// ConsentModal removed for inline flow

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
    <div className="relative w-full h-32 flex items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-accent-500/5 to-primary-900/5 border border-white shadow-inner group-hover:border-accent-500/20 transition-all duration-500">
        <svg viewBox="0 0 200 60" preserveAspectRatio="none" className={`w-full h-full scale-y-110 transition-opacity duration-700 ${isRecording ? 'opacity-90' : 'opacity-30'}`}>
            <defs>
                <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#22C58B" stopOpacity="0.2" />
                    <stop offset="50%" stopColor="#137353" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#22C58B" stopOpacity="0.2" />
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
                stroke="#22C58B"
                strokeWidth="1"
                className={isRecording ? 'animate-wave-2' : ''}
            />
            <path
                d="M -200 30 Q -175 5 -150 30 Q -125 55 -100 30 Q -75 5 -50 30 Q -25 55 0 30 Q 25 5 50 30 Q 75 55 100 30 Q 125 5 150 30 Q 175 55 200 30"
                fill="none"
                stroke="#137353"
                strokeWidth="2"
                className={isRecording ? 'animate-wave-3' : ''}
            />
        </svg>
        {!isRecording && (
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-[80%] h-[1px] bg-accent-500/20 rounded-full" />
            </div>
        )}
        {isRecording && (
            <div className="absolute top-4 right-4 flex items-center gap-2 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-full border border-accent-500/10 shadow-sm animate-pulse">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                <span className="text-[9px] font-black uppercase tracking-widest text-text-muted">Live</span>
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

    // Consent & Alternative Note State
    const [consentChecked, setConsentChecked] = useState(true);
    const [showSummary, setShowSummary] = useState(false);
    const [soapManual, setSoapManual] = useState<SOAPDraft>({ S: '', O: '', A: '', P: '' });

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const sessionStepRef = useRef<SessionStep>("recording_initial");

    const isLarge = textSize === 'large';

    useEffect(() => {
        sessionStepRef.current = sessionStep;
    }, [sessionStep]);

    useEffect(() => {
        if (isRecording && !consentChecked) {
            stopRecording();
        }
    }, [consentChecked]);

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
        if (!consentChecked) return;

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

    const handleAnalyzeTypedNotes = async () => {
        const fullNotes = `Subjective: ${soapManual.S}\nObjective: ${soapManual.O}\nAssessment: ${soapManual.A}\nPlan: ${soapManual.P}`;
        if (!fullNotes.trim()) return;
        setSessionStep("analyzing_initial");
        try {
            await new Promise(r => setTimeout(r, 2500));
            // Simulate AI summary based on notes
            const summary = `Manual Entry Summary: ${fullNotes.substring(0, 150)}${fullNotes.length > 150 ? '...' : ''} [Clinical analysis completed based on manual practitioner input]`;
            setAiSummary(summary);

            // Generate SOAP draft immediately for a fast manual workflow
            const soapResult = await localAI.generateSOAP(summary);
            setSoapDraft(soapResult);

            setSessionStep("final_ready");
            setAudioUrl(null);
            setElapsedTime(0);
        } catch (e) {
            setSessionStep("recording_initial");
            alert("Analysis of notes failed. Please check the content and try again.");
        }
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
                            className="p-1.5 hover:bg-surface-muted border border-transparent hover:border-border rounded-lg transition-all group"
                        >
                            <ArrowLeft className="w-4 h-4 text-text-muted group-hover:text-accent-600" />
                        </button>
                        <div className="flex flex-col">
                            <h1 className={`${isLarge ? 'text-lg' : 'text-sm'} font-bold text-text-strong flex items-center gap-2`}>
                                Treatment Session <ChevronRight className="w-3 h-3 text-border" />
                                <span className="text-text font-medium">{currentClinicalPatient.name}</span>
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
                                    className="h-9 px-5 bg-white border border-border text-text-muted rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-accent-600 hover:text-accent-600 transition-all flex items-center gap-2"
                                    onClick={handleSendEmail}
                                    disabled={isSaving}
                                >
                                    <Mail className="w-3.5 h-3.5" /> Send to Patient
                                </button>
                                <button
                                    className="h-9 px-5 bg-primary hover:bg-primary-900 text-white shadow-lg shadow-primary/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
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
                <main className="flex-1 p-6 lg:p-10 overflow-hidden flex justify-center">
                    <div className="w-full max-w-[1440px] flex flex-col lg:flex-row gap-8 overflow-hidden">

                        {/* LEFT: Controls & Recording (Hidden in Final Step) */}
                        {!isFinalStep && (
                            <div className="w-full lg:w-[360px] flex flex-col gap-6 shrink-0 animate-slide-up">
                                <div className="bg-white border border-slate-100 p-8 shadow-[0_20px_50px_rgba(0,0,0,0.03)] flex flex-col overflow-hidden relative group rounded-[2.5rem]">

                                    <WaveformAnimated isRecording={isRecording && !isPaused} />

                                    <div className="mt-10 text-center relative">
                                        <div className={`${isLarge ? 'text-7xl' : 'text-6xl'} font-black tabular-nums tracking-tighter mb-1 text-text-strong drop-shadow-sm`}>
                                            {formatTime(elapsedTime)}
                                        </div>
                                        <div className="flex items-center justify-center gap-2">
                                            <Clock className="w-3.5 h-3.5 text-accent-500/50" />
                                            <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">
                                                {sessionStep.includes("followup") ? "Follow-up Session" : "Encounter duration"}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Controls Area */}
                                    <div className="mt-10 flex flex-col items-center gap-6 relative z-10 w-full">
                                        {isRecording ? (
                                            <div className="flex items-center justify-center gap-6">
                                                <button
                                                    onClick={isPaused ? resumeRecording : pauseRecording}
                                                    className={`w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all duration-300 hover:scale-110 ${isPaused
                                                        ? 'bg-primary border-primary shadow-xl shadow-primary/20 text-white'
                                                        : 'bg-white border-border hover:border-accent-500/20 text-text transition-colors shadow-sm'
                                                        }`}
                                                >
                                                    {isPaused ? <Play className="w-6 h-6 fill-current" /> : <Pause className="w-6 h-6" />}
                                                </button>
                                                <button
                                                    onClick={stopRecording}
                                                    className="w-20 h-20 rounded-full bg-text-strong hover:bg-black flex items-center justify-center shadow-2xl shadow-primary/10 hover:scale-105 active:scale-95 transition-all outline-none"
                                                >
                                                    <Square className="w-8 h-8 fill-accent-500" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="w-full space-y-6 animate-fade-in">
                                                {sessionStep === "recording_initial" && (
                                                    <div className="space-y-4">
                                                        <button
                                                            onClick={startRecording}
                                                            className={`w-full h-16 rounded-2xl flex items-center justify-center gap-4 transition-all group overflow-hidden relative ${!consentChecked
                                                                ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                                                                : "bg-gradient-to-br from-primary to-primary-900 text-white hover:shadow-2xl hover:shadow-primary/30"
                                                                }`}
                                                            disabled={!consentChecked}
                                                        >
                                                            {consentChecked && (
                                                                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                                                            )}
                                                            <Mic className={`w-5 h-5 relative z-10 ${!consentChecked ? "opacity-30" : ""}`} />
                                                            <span className="text-[11px] font-black uppercase tracking-[0.2em] relative z-10">Start Recording</span>
                                                        </button>

                                                        {/* Inline Consent */}
                                                        <label className="flex items-start gap-3 px-2 cursor-pointer group">
                                                            <input
                                                                type="checkbox"
                                                                checked={consentChecked}
                                                                onChange={(e) => setConsentChecked(e.target.checked)}
                                                                className="mt-1 w-4 h-4 rounded border-slate-200 text-primary focus:ring-primary/20 transition-all cursor-pointer"
                                                            />
                                                            <div className="flex flex-col gap-0.5">
                                                                <span className="text-[11px] font-bold text-text-strong group-hover:text-primary transition-colors">
                                                                    Patient consented to audio recording
                                                                </span>
                                                                <span className="text-[9px] font-medium text-text-muted">
                                                                    Always confirm consent before recording.
                                                                </span>
                                                            </div>
                                                        </label>
                                                    </div>
                                                )}


                                                {sessionStep === "ready_to_analyze_initial" && (
                                                    <div className="space-y-3">
                                                        <button
                                                            onClick={handleAnalyzeInitial}
                                                            className="w-full h-14 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-900 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-3"
                                                        >
                                                            <Sparkles className="w-4 h-4" /> Analyze (Local AI)
                                                        </button>
                                                        <button onClick={resetRecording} className="w-full text-[9px] font-bold text-text-muted uppercase tracking-widest flex items-center justify-center gap-2 hover:text-accent-600 transition-colors">
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
                                                            className="w-full h-14 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-900 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-3"
                                                        >
                                                            <Sparkles className="w-4 h-4" /> Update Summary (Local AI)
                                                        </button>
                                                        <button onClick={resetRecording} className="w-full text-[9px] font-bold text-text-muted uppercase tracking-widest flex items-center justify-center gap-2 hover:text-accent-600 transition-colors">
                                                            <RotateCcw className="w-3 h-3" /> Redo Follow-up
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {audioUrl && !isRecording && !sessionStep.includes("analyzing") && (
                                        <div className="mt-10 p-6 rounded-3xl bg-surface-muted border border-border animate-slide-up shadow-sm">
                                            <div className="flex items-center justify-between mb-4">
                                                <span className="text-[9px] font-black text-accent-600 uppercase tracking-widest flex items-center gap-1.5">
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

                        {/* MIDDLE: Topics to Cover (Primary Content) */}
                        {!isFinalStep && (
                            <div className="flex-1 flex flex-col gap-6 overflow-hidden animate-slide-up animate-delay-1">
                                <div className="bg-white border border-slate-100 flex-1 flex flex-col overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.03)] rounded-[2.5rem] relative">
                                    {/* Embedded Loading State overlay */}
                                    {sessionStep.includes("analyzing") && (
                                        <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center">
                                            <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-primary animate-pulse">Neural Processing...</p>
                                        </div>
                                    )}

                                    <div className="px-12 py-8 border-b border-slate-50">
                                        <h3 className="text-2xl font-black text-accent-700 tracking-tight uppercase tracking-[0.1em]">
                                            {!consentChecked && sessionStep === "recording_initial"
                                                ? "SOAP Documentation Engine"
                                                : (aiQuestions.length > 0 ? "Targeted Clinical Insights" : "Primary Topics to Cover")}
                                        </h3>
                                        <p className="text-text-muted text-xs font-bold mt-1 uppercase tracking-widest">
                                            {!consentChecked && sessionStep === "recording_initial"
                                                ? "Manual encounter entry active"
                                                : "Patient Examination Checklist"}
                                        </p>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-12 scrollbar-thin">
                                        {!consentChecked && sessionStep === "recording_initial" ? (
                                            <div className="space-y-8 animate-fade-in">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                    {(['S', 'O', 'A', 'P'] as const).map(key => (
                                                        <div key={key} className="space-y-3 group">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-sm">
                                                                    {key}
                                                                </div>
                                                                <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">
                                                                    {key === 'S' ? 'Subjective' : key === 'O' ? 'Objective' : key === 'A' ? 'Assessment' : 'Plan'}
                                                                </span>
                                                            </div>
                                                            <textarea
                                                                value={soapManual[key]}
                                                                onChange={(e) => setSoapManual({ ...soapManual, [key]: e.target.value })}
                                                                placeholder={`Enter detailed ${key === 'S' ? 'subjective' : key === 'O' ? 'objective' : key === 'A' ? 'assessment' : 'plan'} data...`}
                                                                className="w-full h-48 p-6 rounded-[2rem] bg-slate-50 border border-slate-100 text-sm font-medium focus:ring-4 focus:ring-primary/5 focus:border-primary/50 outline-none transition-all resize-none shadow-inner group-hover:bg-white"
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="pt-8 border-t border-slate-50 flex justify-end">
                                                    <button
                                                        onClick={handleAnalyzeTypedNotes}
                                                        disabled={!Object.values(soapManual).some(v => v.trim()) || sessionStep !== "recording_initial"}
                                                        className="w-full md:w-auto px-12 h-16 bg-gradient-to-br from-primary to-primary-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:shadow-2xl hover:shadow-primary/30 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        <Sparkles className="w-4 h-4" /> Process & Generate SOAP Documentation
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <ul className="space-y-8">
                                                    {(aiQuestions.length > 0 ? aiQuestions : currentClinicalPatient.suggestedTopics || []).map((topic: any, idx: number) => (
                                                        <li
                                                            key={topic.id}
                                                            className="group flex items-start gap-6 animate-fade-in"
                                                            style={{ animationDelay: `${idx * 0.1}s` }}
                                                        >
                                                            <div className="mt-2.5 w-2 h-2 rounded-full bg-accent-500 group-hover:scale-125 transition-all shadow-[0_0_10px_rgba(34,197,139,0.3)]" />
                                                            <div className="flex flex-col gap-1 flex-1">
                                                                <p className="font-black text-[17px] leading-relaxed text-text-strong tracking-tight group-hover:text-primary transition-colors">
                                                                    {topic.question || topic.text}
                                                                </p>
                                                                {topic.priority && (
                                                                    <span className={`text-[9px] font-black uppercase tracking-widest ${topic.priority === "High" ? "text-red-500" : topic.priority === "Medium" ? "text-amber-500" : "text-slate-400"
                                                                        }`}>
                                                                        Priority: {topic.priority}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>

                                                {aiQuestions.length > 0 && sessionStep === "followup_questions_ready" && (
                                                    <div className="mt-12 p-8 bg-accent-500/5 border border-dashed border-accent-500/20 rounded-[3rem] text-center animate-bounce-short max-w-lg mx-auto">
                                                        <AlertCircle className="w-6 h-6 text-accent-500 mx-auto mb-3" />
                                                        <h4 className="text-xs font-black text-accent-700 uppercase tracking-widest mb-1">Follow-up Phase Active</h4>
                                                        <p className="text-[13px] font-bold text-text-muted leading-snug">The AI has generated specific clinical questions. Please address these through the follow-up recording for a complete SOAP generation.</p>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* RIGHT: Collapsible Summary Sidebar */}
                        {!isFinalStep && (
                            <div className="w-full lg:w-[340px] flex flex-col gap-6 shrink-0 animate-slide-up animate-delay-2">
                                <div className="bg-white border border-slate-100 flex flex-col overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.02)] rounded-[2.5rem]">
                                    <div className="p-8 pb-4 flex items-center justify-between">
                                        <h3 className="text-sm font-black text-accent-600 tracking-tight uppercase tracking-widest">Summary</h3>
                                        <div className="bg-accent-500/10 px-2 py-0.5 rounded border border-accent-500/20">
                                            <span className="text-[8px] font-black text-accent-600 uppercase tracking-widest">AI Vision</span>
                                        </div>
                                    </div>

                                    <div className="px-8 pb-4">
                                        <button
                                            onClick={() => setShowSummary(!showSummary)}
                                            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary-900 transition-colors"
                                        >
                                            {showSummary ? (
                                                <><ChevronUp className="w-3 h-3" /> Hide summary</>
                                            ) : (
                                                <><ChevronDown className="w-3 h-3" /> Show full summary</>
                                            )}
                                        </button>
                                    </div>

                                    <div className={`transition-all duration-500 overflow-hidden ${showSummary ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                        <div className="p-8 pt-0 overflow-y-auto max-h-[460px] scrollbar-thin">
                                            <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 italic text-[13px] font-medium leading-relaxed text-text-muted">
                                                {aiSummary || currentClinicalPatient.latestSummary.text}
                                            </div>
                                        </div>
                                    </div>

                                    {!showSummary && (
                                        <div className="p-8 pt-0">
                                            <p className="text-[11px] font-bold text-text-muted line-clamp-3 italic opacity-60">
                                                {aiSummary || currentClinicalPatient.latestSummary.text}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* FINAL STEP VIEW (Full Width SOAP Editor) */}
                        {isFinalStep && (
                            <div className="flex-1 flex flex-col gap-8 animate-fade-in max-w-6xl mx-auto w-full">
                                <div className="bg-white border border-slate-100 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col">
                                    <div className="flex flex-col xl:flex-row h-full">
                                        {/* Summary component in final step */}
                                        <div className="flex-1 border-r border-slate-50 bg-slate-50/30 p-12">
                                            <div className="flex items-center justify-between mb-8">
                                                <h3 className="text-xl font-black text-accent-600 tracking-tight uppercase">Encounter Summary</h3>
                                                <span className="bg-white px-3 py-1 rounded-lg border border-border text-[9px] font-black text-text-muted uppercase tracking-widest">Validated Analysis</span>
                                            </div>
                                            <div className="text-[17px] font-medium leading-relaxed text-text-strong font-serif italic">
                                                "{aiSummary}"
                                            </div>
                                        </div>

                                        {/* SOAP Draft Fields */}
                                        <div className="flex-[1.5] p-12 bg-white">
                                            <div className="flex items-center justify-between mb-8">
                                                <h3 className="text-xl font-black text-primary tracking-tight uppercase">SOAP Documentation</h3>
                                                <div className="flex items-center gap-2 text-primary bg-primary-50 px-4 py-1.5 rounded-full border border-primary/10">
                                                    <Check className="w-3.5 h-3.5" />
                                                    <span className="text-[9px] font-black uppercase tracking-widest">Ready to Finalize</span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {(['S', 'O', 'A', 'P'] as const).map(key => (
                                                    <div key={key} className="p-6 bg-white border border-border rounded-3xl shadow-sm hover:border-accent-500/20 transition-all flex flex-col gap-4">
                                                        <div className="flex items-center gap-3">
                                                            <span className="w-7 h-7 bg-primary text-white rounded-xl flex items-center justify-center text-[13px] font-black">{key}</span>
                                                            <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">
                                                                {key === 'S' ? 'Subjective' : key === 'O' ? 'Objective' : key === 'A' ? 'Assessment' : 'Plan'}
                                                            </span>
                                                        </div>
                                                        <textarea
                                                            className="w-full h-44 bg-transparent border-none outline-none text-[14px] font-bold text-slate-700 leading-relaxed scrollbar-thin resize-none"
                                                            value={soapDraft ? soapDraft[key] : ''}
                                                            onChange={(e) => soapDraft && setSoapDraft({ ...soapDraft, [key]: e.target.value })}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </main>

                {/* Inline footer version for Final Step only */}
                {isFinalStep && (
                    <footer className="h-16 shrink-0 bg-white border-t border-slate-100 flex items-center justify-center">
                        <div className="flex items-center gap-3 text-accent-600 bg-accent-500/5 px-6 py-2 rounded-full border border-accent-500/10">
                            <Sparkles className="w-4 h-4" />
                            <span className="text-[11px] font-black uppercase tracking-widest">AI Documentation Synchronized Locally</span>
                        </div>
                    </footer>
                )}
            </div>
        </Layout>
    );
};
