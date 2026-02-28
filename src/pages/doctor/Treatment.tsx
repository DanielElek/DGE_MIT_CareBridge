import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../AppContext';
import { Layout } from '../../components/Layout';
import {
    Mic, Square, Play, Pause, RotateCcw, Save, ArrowLeft,
    Clock, Trash2,
    ChevronRight, Sparkles, Loader2, Mail, Upload
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

interface SOAPDraft {
    S: string;
    O: string;
    A: string;
    P: string;
}

interface SoapQuoteEntry {
    sentence: string;
    quote: string;
}

type SoapQuotes = Record<string, SoapQuoteEntry[]>;

interface TranscriptWord {
    word: string;
    start: number;
    end: number;
    score?: number;
    speaker?: string;
}

interface TranscriptSegment {
    start: number;
    end: number;
    text: string;
    words: TranscriptWord[];
    speaker: string;
    speaker_label: string;
}

// --- MOCK AI FUNCTIONS ---
// localAI removed in favor of real backend SSE streaming.

const WaveformAnimated: React.FC<{ isRecording: boolean }> = ({ isRecording }) => (
    <div className="relative w-full h-32 flex items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-accent-500/10 to-primary-900/10 border border-slate-200 shadow-inner group-hover:border-accent-500/30 transition-all duration-500">
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
    const [soapDraft, setSoapDraft] = useState<SOAPDraft | null>(null);
    const [soapQuotes, setSoapQuotes] = useState<SoapQuotes | null>(null);
    const [highlightedQuote, setHighlightedQuote] = useState<string | null>(null);
    const [transcription, setTranscription] = useState<string | null>(null);
    const [detailedTranscript, setDetailedTranscript] = useState<TranscriptSegment[] | null>(null);
    const [currentPlaybackTime, setCurrentPlaybackTime] = useState(0);
    const [audioDuration, setAudioDuration] = useState(0);
    const [isPlaybackPlaying, setIsPlaybackPlaying] = useState(false);
    const [viewMode, setViewMode] = useState<'transcription' | 'soap'>('soap');
    const transcriptContainerRef = useRef<HTMLDivElement | null>(null);

    // AI Loading State Variables
    const [aiLoadingMessage, setAiLoadingMessage] = useState<string>("Processing...");
    const [aiStepCounter, setAiStepCounter] = useState<string>("Step 1/3");

    // UI Feedback States
    const [isSaving, setIsSaving] = useState(false);
    const [emailInput, setEmailInput] = useState("");

    // Recording Engine State
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);

    // Consent & Alternative Note State
    const [consentChecked, setConsentChecked] = useState(false);
    const [soapManual, setSoapManual] = useState<SOAPDraft>({ S: '', O: '', A: '', P: '' });

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
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

    // Auto-dismiss highlight after 3 seconds
    useEffect(() => {
        if (!highlightedQuote) return;
        const timer = setTimeout(() => setHighlightedQuote(null), 3000);
        return () => clearTimeout(timer);
    }, [highlightedQuote]);

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
        setDetailedTranscript(null);
        setCurrentPlaybackTime(0);
        setIsPlaybackPlaying(false);
        if (sessionStep === "ready_to_analyze_initial") setSessionStep("recording_initial");
        if (sessionStep === "ready_to_analyze_followup") setSessionStep("recording_followup");
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const getAudioDuration = (file: File | Blob): Promise<number> => {
        return new Promise((resolve) => {
            const audio = new Audio();
            audio.src = URL.createObjectURL(file);
            audio.onloadedmetadata = () => {
                URL.revokeObjectURL(audio.src);
                resolve(Math.floor(audio.duration));
            };
            audio.onerror = () => {
                URL.revokeObjectURL(audio.src);
                resolve(0);
            };
        });
    };

    // --- WORKFLOW HANDLERS ---
    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, isFollowup = false) => {
        const file = event.target.files?.[0];
        if (!file) return;
        if (!consentChecked) {
            alert("Please confirm patient consent before uploading.");
            return;
        }

        if (isFollowup) {
            setSessionStep("analyzing_followup");
        } else {
            setSessionStep("analyzing_initial");
        }

        try {
            const duration = await getAudioDuration(file);
            setElapsedTime(duration);

            // Set audioUrl from the uploaded file so it can be played back
            const url = URL.createObjectURL(file);
            setAudioUrl(url);

            const soapResult = await processAudioStream(file);
            if (soapResult) {
                setSoapDraft(soapResult);
                setSessionStep("final_ready");
            }
        } catch (e) {
            console.error(e);
            setSessionStep(isFollowup ? "ready_to_analyze_followup" : "ready_to_analyze_initial");
            alert("Analysis failed. Please check the backend server logs.");
        }

        // Reset the file input so the same file can be uploaded again if needed
        event.target.value = '';
    };

    const processAudioStream = async (blob: Blob) => {
        setAiStepCounter("Step 1/3");
        setAiLoadingMessage("Uploading audio...");

        const formData = new FormData();
        formData.append("audio", blob, "audio.webm");

        try {
            const response = await fetch("http://127.0.0.1:8000/api/process", {
                method: "POST",
                body: formData
            });

            if (!response.body) throw new Error("No response body");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');

                // Keep the last partial line in the buffer
                buffer = lines.pop() || "";

                for (const line of lines) {
                    const trimmedLine = line.trim();
                    if (trimmedLine.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(trimmedLine.substring(6));
                            if (data.status === 'log') {
                                // Skip raw logs entirely for cleaner UI
                            } else if (data.status === 'start') {
                                setAiStepCounter("Step 1/3");
                                setAiLoadingMessage("Processing audio file...");
                            } else if (data.status === 'info') {
                                if (data.message?.includes('complete. Starting generation')) {
                                    setAiStepCounter("Step 3/3");
                                    setAiLoadingMessage("Generating SOAP documentation...");
                                } else if (data.message?.includes('normalized. Starting transcription')) {
                                    setAiStepCounter("Step 2/3");
                                    setAiLoadingMessage("Transcribing audio...");
                                }
                            } else if (data.status === 'transcription_done') {
                                setTranscription(data.transcription || "");
                                if (data.detailed_transcript) {
                                    setDetailedTranscript(data.detailed_transcript);
                                }
                                setViewMode('transcription');
                            } else if (data.status === 'done') {
                                const rawObj = data.soap || {};
                                // Store sentence→quote mappings if available
                                if (data.quotes) {
                                    setSoapQuotes(data.quotes);
                                }
                                return {
                                    S: rawObj.subjective || "Not discussed.",
                                    O: rawObj.objective || "Not discussed.",
                                    A: rawObj.assessment || "Not discussed.",
                                    P: rawObj.plan || "Not discussed."
                                };
                            } else if (data.status === 'error') {
                                throw new Error(data.message || "Unknown backend error");
                            }
                        } catch (e) {
                            console.error("Error parsing SSE:", line, e);
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Streaming error:", error);
            throw error;
        }
        return null;
    };

    const handleAnalyzeInitial = async () => {
        if (!initialRecording) return;
        setSessionStep("analyzing_initial");
        try {
            const soapResult = await processAudioStream(initialRecording.blob);
            if (soapResult) {
                setAudioUrl(initialRecording.url);
                setSoapDraft(soapResult);
                setSessionStep("final_ready");
            }
        } catch (e) {
            console.error(e);
            setSessionStep("ready_to_analyze_initial");
            alert("Analysis failed. Please check the backend server logs.");
        }
    };

    const handleAnalyzeFollowup = async () => {
        if (!followupRecording) return;
        setSessionStep("analyzing_followup");
        try {
            const soapResult = await processAudioStream(followupRecording.blob);
            if (soapResult) {
                setAudioUrl(followupRecording.url);
                setSoapDraft(soapResult);
                setSessionStep("final_ready");
            }
        } catch (e) {
            console.error(e);
            setSessionStep("ready_to_analyze_followup");
            alert("Analysis update failed. Please check the backend server logs.");
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
                <header className="h-14 shrink-0 bg-white/90 backdrop-blur-xl border-b border-slate-200 flex items-center justify-between px-8 z-20 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
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
                            <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full border border-slate-200">
                                <div className={`w-1.5 h-1.5 rounded-full ${isRecording ? (isPaused ? 'bg-amber-400' : 'bg-red-500 animate-pulse') : 'bg-slate-300'}`} />
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">
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
                                    Save Session
                                </button>
                            </div>
                        )}
                    </div>
                </header>

                {/* Workspace */}
                <main className="flex-1 p-6 lg:p-10 overflow-hidden flex justify-center">
                    <div className="w-full max-w-[1440px] flex flex-col lg:flex-row gap-8 overflow-hidden">

                        {/* LEFT: Controls & Recording */}
                        <div className="w-full lg:w-[360px] flex flex-col gap-6 shrink-0 animate-slide-up">
                            <div className="bg-white border border-slate-200 p-8 shadow-[0_20px_60px_rgba(0,0,0,0.05)] flex flex-col overflow-hidden relative group rounded-[2.5rem]">

                                <WaveformAnimated isRecording={isRecording && !isPaused} />

                                <div className="mt-10 text-center relative">
                                    <div className={`${isLarge ? 'text-7xl' : 'text-6xl'} font-black tabular-nums tracking-tighter mb-1 text-text-strong drop-shadow-sm`}>
                                        {formatTime(elapsedTime)}
                                    </div>
                                    <div className="flex flex-col items-center gap-5">
                                        <div className="flex items-center justify-center gap-2">
                                            <Clock className="w-3.5 h-3.5 text-accent-500/50" />
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                                                {sessionStep.includes("followup") ? "Follow-up Session" : "Session duration"}
                                            </p>
                                        </div>

                                        {(transcription || isFinalStep) && (audioUrl || initialRecording?.url || followupRecording?.url) && !isRecording && (
                                            <div className="flex flex-col items-center gap-3 w-full animate-fade-in mt-2">
                                                <button
                                                    onClick={() => {
                                                        const currentUrl = audioUrl || initialRecording?.url || followupRecording?.url;
                                                        if (audioRef.current && currentUrl) {
                                                            if (audioRef.current.src !== currentUrl) {
                                                                audioRef.current.src = currentUrl;
                                                            }
                                                            if (isPlaybackPlaying) audioRef.current.pause();
                                                            else audioRef.current.play();
                                                        }
                                                    }}
                                                    className="flex items-center gap-2 px-6 py-2.5 bg-accent-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-accent-600 transition-all shadow-lg shadow-accent-500/20"
                                                >
                                                    {isPlaybackPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                                                    {isPlaybackPlaying ? "Pause Playback" : "Play Recording"}
                                                </button>
                                                {/* Scrub slider */}
                                                <div className="w-full px-1 flex flex-col gap-1">
                                                    <input
                                                        type="range"
                                                        min={0}
                                                        max={audioDuration || 1}
                                                        step={0.1}
                                                        value={currentPlaybackTime}
                                                        onChange={(e) => {
                                                            const t = parseFloat(e.target.value);
                                                            setCurrentPlaybackTime(t);
                                                            if (audioRef.current) audioRef.current.currentTime = t;
                                                        }}
                                                        className="w-full h-1.5 rounded-full accent-accent-500 cursor-pointer"
                                                        style={{
                                                            background: `linear-gradient(to right, #22C58B ${audioDuration ? (currentPlaybackTime / audioDuration) * 100 : 0}%, #e2e8f0 ${audioDuration ? (currentPlaybackTime / audioDuration) * 100 : 0}%)`
                                                        }}
                                                    />
                                                    <div className="flex justify-between text-[9px] font-bold text-slate-400 tabular-nums">
                                                        <span>{formatTime(Math.floor(currentPlaybackTime))}</span>
                                                        <span>{formatTime(Math.floor(audioDuration))}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
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
                                    ) : sessionStep.includes("analyzing") ? (
                                        <div className="flex flex-col items-center justify-center space-y-4 py-8">
                                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                            <p className="text-[12px] font-black uppercase tracking-widest text-primary mb-1">{aiStepCounter}</p>
                                            <p className="text-[10px] font-bold text-text-muted mt-2 animate-pulse">{aiLoadingMessage}</p>
                                        </div>
                                    ) : (
                                        <div className="w-full space-y-6 animate-fade-in">
                                            {sessionStep === "recording_initial" && (
                                                <div className="space-y-4">
                                                    <button
                                                        onClick={startRecording}
                                                        className={`w-full h-16 rounded-2xl flex items-center justify-center gap-4 transition-all group overflow-hidden relative ${!consentChecked
                                                            ? "bg-slate-200 text-slate-500 cursor-not-allowed border border-slate-300"
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

                                                    <div className="relative">
                                                        <input
                                                            type="file"
                                                            accept="audio/*,.m4a,.mp4,.wav,.mp3,.ogg,.webm"
                                                            onChange={(e) => handleFileUpload(e, false)}
                                                            className="hidden"
                                                            id="audio-upload"
                                                            disabled={!consentChecked}
                                                        />
                                                        <label
                                                            htmlFor="audio-upload"
                                                            className={`flex items-center justify-center w-full h-14 border-2 border-dashed rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all ${!consentChecked
                                                                ? "border-slate-300 text-slate-500 cursor-not-allowed"
                                                                : "border-primary/30 text-primary hover:bg-primary/5 cursor-pointer"
                                                                }`}
                                                        >
                                                            <Upload className="w-4 h-4 mr-2" /> Upload Audio File
                                                        </label>
                                                    </div>

                                                    {/* Inline Consent */}
                                                    <label className="flex items-start gap-3 px-2 cursor-pointer group">
                                                        <input
                                                            type="checkbox"
                                                            checked={consentChecked}
                                                            onChange={(e) => setConsentChecked(e.target.checked)}
                                                            className="mt-1 w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/20 transition-all cursor-pointer"
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
                                                <div className="space-y-4">
                                                    <button
                                                        onClick={() => { setSessionStep("recording_followup"); startRecording(); }}
                                                        className="w-full h-14 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-3"
                                                    >
                                                        <Mic className="w-4 h-4" /> Start Follow-up Session
                                                    </button>

                                                    <div className="relative">
                                                        <input
                                                            type="file"
                                                            accept="audio/*,.m4a,.mp4,.wav,.mp3,.ogg,.webm"
                                                            onChange={(e) => handleFileUpload(e, true)}
                                                            className="hidden"
                                                            id="followup-upload"
                                                        />
                                                        <label
                                                            htmlFor="followup-upload"
                                                            className={`flex items-center justify-center w-full h-14 border-2 border-dashed border-indigo-600/30 text-indigo-600 hover:bg-indigo-600/5 cursor-pointer rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all`}
                                                        >
                                                            <Upload className="w-4 h-4 mr-2" /> Upload Follow-up Audio
                                                        </label>
                                                    </div>
                                                </div>
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

                                {(audioUrl || initialRecording?.url || followupRecording?.url) && (
                                    <audio
                                        ref={audioRef}
                                        src={audioUrl || initialRecording?.url || followupRecording?.url || ""}
                                        onTimeUpdate={(e) => setCurrentPlaybackTime(e.currentTarget.currentTime)}
                                        onLoadedMetadata={(e) => setAudioDuration(e.currentTarget.duration)}
                                        onPlay={() => {
                                            setIsRecording(false);
                                            setIsPlaybackPlaying(true);
                                        }}
                                        onPause={() => setIsPlaybackPlaying(false)}
                                        onEnded={() => {
                                            setIsPlaybackPlaying(false);
                                            setCurrentPlaybackTime(0);
                                        }}
                                        className="hidden"
                                    />
                                )}
                            </div>
                        </div>

                        {/* MIDDLE: General Content Area */}
                        <div className="flex-1 flex flex-col gap-6 overflow-hidden animate-slide-up animate-delay-1">
                            <div className="bg-white border border-slate-200 flex-1 flex flex-col overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.05)] rounded-[2.5rem] relative">
                                <div className="px-12 py-8 border-b border-slate-100 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-2xl font-black text-accent-700 tracking-tight uppercase tracking-[0.1em]">
                                            {!consentChecked && sessionStep === "recording_initial"
                                                ? "Manual Entry"
                                                : isFinalStep ? "Session Documentation" : "Session"}
                                        </h3>
                                        <p className="text-slate-500 text-xs font-bold mt-1 uppercase tracking-widest">
                                            {!consentChecked && sessionStep === "recording_initial"
                                                ? ""
                                                : isFinalStep ? "Review Transcription and SOAP notes" : "Live Recording & Processing"}
                                        </p>
                                    </div>
                                    {isFinalStep && (
                                        <div className="bg-slate-100 p-1 rounded-xl inline-flex shadow-inner">
                                            <button onClick={() => setViewMode('transcription')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'transcription' ? 'bg-white shadow text-primary' : 'text-slate-500 hover:text-slate-700'}`}>Transcription</button>
                                            <button onClick={() => setViewMode('soap')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'soap' ? 'bg-white shadow text-primary' : 'text-slate-500 hover:text-slate-700'}`}>SOAP Notes</button>
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 overflow-y-auto p-12 scrollbar-thin flex flex-col">
                                    {!consentChecked && sessionStep === "recording_initial" ? (
                                        <div className="space-y-8 animate-fade-in">
                                            <div className="flex flex-col gap-6">
                                                {(['S', 'O', 'A', 'P'] as const).map(key => (
                                                    <div key={key} className="flex flex-col gap-3 group bg-slate-50 p-6 rounded-3xl border border-slate-200 hover:bg-slate-100 transition-colors">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-2 h-2 rounded-full bg-primary"></div>
                                                            <span className="text-sm font-black text-slate-800 uppercase tracking-widest">
                                                                {key === 'S' ? 'Subjective' : key === 'O' ? 'Objective' : key === 'A' ? 'Assessment' : 'Plan'}
                                                            </span>
                                                        </div>
                                                        <textarea
                                                            value={soapManual[key]}
                                                            onChange={(e) => {
                                                                setSoapManual({ ...soapManual, [key]: e.target.value });
                                                                e.target.style.height = 'auto';
                                                                e.target.style.height = e.target.scrollHeight + 'px';
                                                            }}
                                                            ref={(el) => {
                                                                if (el) {
                                                                    el.style.height = 'auto';
                                                                    el.style.height = el.scrollHeight + 'px';
                                                                }
                                                            }}
                                                            placeholder={`Enter detailed ${key === 'S' ? 'subjective' : key === 'O' ? 'objective' : key === 'A' ? 'assessment' : 'plan'} data...`}
                                                            className="w-full min-h-[100px] ml-5 p-0 bg-transparent border-none outline-none text-[15px] font-semibold text-slate-800 leading-relaxed resize-none focus:ring-0 placeholder:text-slate-500"
                                                        />
                                                    </div>
                                                ))}
                                            </div>

                                        </div>
                                    ) : isRecording ? (
                                        <div className="flex-1 p-8 space-y-6 flex flex-col items-center justify-center">
                                            <div className="w-full max-w-2xl space-y-4">
                                                <div className="h-4 bg-slate-200 rounded animate-pulse w-3/4"></div>
                                                <div className="h-4 bg-slate-200 rounded animate-pulse w-full"></div>
                                                <div className="h-4 bg-slate-200 rounded animate-pulse w-5/6"></div>
                                                <div className="h-4 bg-slate-200 rounded animate-pulse w-1/2"></div>
                                            </div>
                                            <p className="text-slate-500 font-medium animate-pulse mt-8">Listening to session...</p>
                                        </div>
                                    ) : sessionStep.includes("analyzing") && !transcription ? (
                                        <div className="flex-1 flex flex-col items-center justify-center h-full space-y-6 opacity-30">
                                            <div className="w-full max-w-2xl space-y-4">
                                                <div className="h-4 bg-slate-200 rounded animate-pulse w-3/4"></div>
                                                <div className="h-4 bg-slate-200 rounded animate-pulse w-full"></div>
                                            </div>
                                        </div>
                                    ) : (!isFinalStep && transcription) || (isFinalStep && viewMode === 'transcription') ? (
                                        <div ref={transcriptContainerRef} className="font-serif text-[17px] leading-relaxed text-slate-700 bg-slate-50 p-8 rounded-3xl border border-slate-200 flex-1 overflow-y-auto relative">
                                            {detailedTranscript ? (() => {
                                                // Fuzzy match: find segment with highest character overlap with the quote
                                                let bestSegIdx = -1;
                                                if (highlightedQuote) {
                                                    const qNorm = highlightedQuote.toLowerCase().replace(/[^a-z0-9 ]/g, '');
                                                    let bestScore = 0;
                                                    detailedTranscript.forEach((seg, i) => {
                                                        const segText = seg.words.map(w => w.word).join(' ').toLowerCase().replace(/[^a-z0-9 ]/g, '');
                                                        // Count how many characters of the quote appear in the segment text
                                                        let matched = 0;
                                                        let sPos = 0;
                                                        for (let c = 0; c < qNorm.length; c++) {
                                                            const found = segText.indexOf(qNorm[c], sPos);
                                                            if (found !== -1) { matched++; sPos = found + 1; }
                                                        }
                                                        const score = matched / Math.max(qNorm.length, 1);
                                                        if (score > bestScore) { bestScore = score; bestSegIdx = i; }
                                                    });
                                                    // Only highlight if at least 50% of characters matched
                                                    if (bestScore < 0.5) bestSegIdx = -1;
                                                }
                                                return detailedTranscript.map((segment, sIdx) => (
                                                    <div
                                                        key={sIdx}
                                                        className="mb-8 last:mb-0"
                                                        ref={sIdx === bestSegIdx ? (el) => {
                                                            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                        } : undefined}
                                                    >
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${segment.speaker_label === 'Doctor' ? 'bg-primary/10 text-primary' : 'bg-accent-500/10 text-accent-700'}`}>
                                                                {segment.speaker_label}
                                                            </span>
                                                            <span className="text-[9px] font-bold text-slate-400 tabular-nums">
                                                                {formatTime(Math.floor(segment.start))}
                                                            </span>
                                                        </div>
                                                        <div className={`flex flex-wrap gap-x-1.5 gap-y-1 rounded-xl transition-all duration-500 ${sIdx === bestSegIdx ? 'bg-orange-100 px-3 py-2 ring-2 ring-orange-300' : ''
                                                            }`}>
                                                            {segment.words.map((word, wIdx) => {
                                                                const isSpoken = word.start <= currentPlaybackTime;
                                                                const isHighlighted = sIdx === bestSegIdx;
                                                                return (
                                                                    <span
                                                                        key={wIdx}
                                                                        className={`transition-all duration-300 rounded px-0.5 text-slate-700 ${isHighlighted ? 'bg-orange-300' : isSpoken ? 'bg-green-200' : 'bg-transparent'
                                                                            }`}
                                                                    >
                                                                        {word.word}
                                                                    </span>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                ));
                                            })() : transcription ? (
                                                transcription.split('\n').map((line, i) => {
                                                    if (highlightedQuote && line.toLowerCase().includes(highlightedQuote.toLowerCase())) {
                                                        const idx = line.toLowerCase().indexOf(highlightedQuote.toLowerCase());
                                                        const before = line.slice(0, idx);
                                                        const match = line.slice(idx, idx + highlightedQuote.length);
                                                        const after = line.slice(idx + highlightedQuote.length);
                                                        return (
                                                            <p key={i} className="mb-4">
                                                                {before}
                                                                <mark className="bg-orange-300 px-0.5 rounded ring-1 ring-orange-400">{match}</mark>
                                                                {after}
                                                            </p>
                                                        );
                                                    }
                                                    return <p key={i} className="mb-4">{line}</p>;
                                                })
                                            ) : (
                                                <p className="italic text-slate-400">No transcription available.</p>
                                            )}
                                        </div>
                                    ) : isFinalStep && viewMode === 'soap' ? (
                                        <div className="flex flex-col gap-6 flex-1 px-4 pb-8 overflow-y-auto">
                                            {(['S', 'O', 'A', 'P'] as const).map(key => {
                                                const soapKeyMap: Record<string, string> = { S: 'subjective', O: 'objective', A: 'assessment', P: 'plan' };
                                                const quotesForSection = soapQuotes?.[soapKeyMap[key]] || [];
                                                const hasQuotes = quotesForSection.length > 0;
                                                return (
                                                    <div key={key} className="flex flex-col gap-3 bg-slate-50 p-6 rounded-3xl border border-slate-200 hover:bg-slate-100 transition-colors">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-2 h-2 rounded-full bg-primary"></div>
                                                            <span className="text-sm font-black text-slate-800 uppercase tracking-widest">
                                                                {key === 'S' ? 'Subjective' : key === 'O' ? 'Objective' : key === 'A' ? 'Assessment' : 'Plan'}
                                                            </span>
                                                        </div>
                                                        {hasQuotes ? (
                                                            <ul className="ml-5 space-y-2">
                                                                {quotesForSection.map((entry, idx) => (
                                                                    <li key={idx}>
                                                                        <span
                                                                            onClick={() => {
                                                                                if (entry.quote) {
                                                                                    const cleaned = entry.quote.replace(/^["'\[\]]+|["'\[\]]+$/g, '').trim();
                                                                                    setHighlightedQuote(cleaned);
                                                                                    setViewMode('transcription');
                                                                                }
                                                                            }}
                                                                            className={`text-[15px] font-semibold leading-relaxed ${entry.quote
                                                                                ? 'text-slate-800 cursor-pointer hover:text-primary hover:underline decoration-primary/30 underline-offset-4 transition-all'
                                                                                : 'text-slate-600'
                                                                                }`}
                                                                            title={entry.quote ? `Source: "${entry.quote}"` : undefined}
                                                                        >
                                                                            {entry.sentence}
                                                                        </span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        ) : (
                                                            <textarea
                                                                className="w-full h-auto min-h-[80px] bg-transparent border-none outline-none text-[15px] font-semibold text-slate-800 leading-relaxed resize-none ml-5 p-0 focus:ring-0"
                                                                value={soapDraft ? soapDraft[key] : ''}
                                                                onChange={(e) => {
                                                                    if (soapDraft) {
                                                                        setSoapDraft({ ...soapDraft, [key]: e.target.value });
                                                                        e.target.style.height = 'auto';
                                                                        e.target.style.height = e.target.scrollHeight + 'px';
                                                                    }
                                                                }}
                                                                ref={(el) => {
                                                                    if (el) {
                                                                        el.style.height = 'auto';
                                                                        el.style.height = el.scrollHeight + 'px';
                                                                    }
                                                                }}
                                                            />
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : consentChecked && !isRecording && !sessionStep.includes("analyzing") && !isFinalStep ? (
                                        <div className="flex-1 border-2 border-dashed border-slate-300 rounded-3xl flex items-center justify-center">
                                            <p className="text-slate-400 font-medium">Ready to record.</p>
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        </div>

                    </div>
                </main>

                {/* Inline footer version for Final Step only */}
                {/* AI Documentation status removed */}

            </div >
        </Layout >
    );
};
