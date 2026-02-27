import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../AppContext';
import { Layout } from '../../components/Layout';
import { Mic, FileAudio, ArrowRight, ArrowLeft, Keyboard, Sparkles, CheckCircle2 } from 'lucide-react';
import { SmartIntakeAnswer } from '../../mockData';

export const Complaint: React.FC = () => {
  const { updateComplaint, submitSmartIntake, patientData, textSize } = useApp();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'type' | 'voice'>('type');
  const [complaintText, setComplaintText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showSmartIntake, setShowSmartIntake] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<SmartIntakeAnswer[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState<string | number | boolean>('');

  const [isRecording, setIsRecording] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(0);

  const handleVoiceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    await new Promise(resolve => setTimeout(resolve, 2500));

    const mockTranscript = "I've been having lower back pain for the past three weeks. It started after I helped move some furniture. The pain shoots down my left leg sometimes, especially when I sit for too long. It's been keeping me up at night.";
    setComplaintText(mockTranscript);
    setIsAnalyzing(false);
  };

  const simulateRecording = async () => {
    setIsRecording(true);
    setRecordingProgress(0);

    const interval = setInterval(() => {
      setRecordingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2;
      });
    }, 50);

    await new Promise(resolve => setTimeout(resolve, 3000));
    clearInterval(interval);
    setIsRecording(false);

    setIsAnalyzing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setComplaintText("I've had a persistent headache for 3 days. It's mostly behind my eyes and feels like a dull pressure. It gets worse with bright light and loud noises. I haven't had any nausea, but it's making it hard to concentrate.");
    setIsAnalyzing(false);
  };

  const handleContinue = async () => {
    if (!complaintText.trim()) return;

    setIsAnalyzing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));

    updateComplaint(complaintText);
    setIsAnalyzing(false);
    setShowSmartIntake(true);
    setCurrentQuestionIndex(0);
    setAnswers([]);
  };

  const handleQuestionAnswer = () => {
    if (!patientData) return;

    const question = patientData.smartIntakeQuestions[currentQuestionIndex];
    const newAnswer: SmartIntakeAnswer = {
      questionId: question.id,
      answer: currentAnswer
    };

    const updatedAnswers = [...answers, newAnswer];
    setAnswers(updatedAnswers);

    if (currentQuestionIndex < patientData.smartIntakeQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setCurrentAnswer('');
    } else {
      submitSmartIntake(updatedAnswers);
      navigate('/patient/summary');
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setCurrentAnswer(answers[currentQuestionIndex - 1]?.answer || '');
    }
  };

  if (showSmartIntake && patientData && patientData.smartIntakeQuestions.length > 0) {
    const question = patientData.smartIntakeQuestions[currentQuestionIndex];
    const totalQuestions = patientData.smartIntakeQuestions.length;

    return (
      <Layout>
        <div className="max-w-2xl mx-auto px-4 py-8 animate-slide-up">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-500/10 text-primary rounded-full text-xs font-bold uppercase tracking-wider mb-3">
              <Sparkles className="w-3 h-3" /> Smart Check-in
            </div>
            <h2 className={`font-bold text-text-strong mb-2 ${textSize === 'large' ? 'text-4xl' : 'text-3xl'}`}>
              Help us understand better
            </h2>
            <p className="text-text-muted">Based on your complaint, we have a few follow-up questions.</p>
          </div>

          <div className="glass-card p-8 border-slate-200">
            <div className="flex items-center justify-between mb-8">
              <div className="flex gap-1.5">
                {[...Array(totalQuestions)].map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-500 ${i < currentQuestionIndex ? 'w-8 bg-accent-500' :
                      i === currentQuestionIndex ? 'w-12 bg-primary' : 'w-4 bg-border'
                      }`}
                  />
                ))}
              </div>
              <span className="text-xs font-bold text-text-muted uppercase tracking-widest">
                Question {currentQuestionIndex + 1} / {totalQuestions}
              </span>
            </div>

            <div className="min-h-[200px] flex flex-col justify-center mb-10">
              <h3 className={`font-bold text-text-strong leading-tight mb-8 ${textSize === 'large' ? 'text-3xl' : 'text-2xl'}`}>
                {question.question}
              </h3>

              {question.type === 'yesno' && (
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setCurrentAnswer(true)}
                    className={`flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 transition-all duration-300 ${currentAnswer === true
                      ? 'border-primary bg-accent-500/10 text-primary shadow-md scale-[1.02]'
                      : 'border-border bg-surface-muted text-text-muted hover:border-accent-500/20'
                      }`}
                  >
                    <CheckCircle2 className={`w-8 h-8 ${currentAnswer === true ? 'text-blue-600' : 'text-slate-300'}`} />
                    <span className="font-bold text-lg">Yes</span>
                  </button>
                  <button
                    onClick={() => setCurrentAnswer(false)}
                    className={`flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 transition-all duration-300 ${currentAnswer === false
                      ? 'border-primary bg-accent-500/10 text-primary shadow-md scale-[1.02]'
                      : 'border-border bg-surface-muted text-text-muted hover:border-accent-500/20'
                      }`}
                  >
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${currentAnswer === false ? 'border-primary text-primary' : 'border-border text-text-muted'}`}>
                      <span className="text-xl font-bold leading-none">×</span>
                    </div>
                    <span className="font-bold text-lg">No</span>
                  </button>
                </div>
              )}

              {question.type === 'scale' && (
                <div className="py-4">
                  <div className="flex justify-between mb-8">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(val => (
                      <button
                        key={val}
                        onClick={() => setCurrentAnswer(val)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${currentAnswer === val
                          ? 'bg-primary text-white scale-125 shadow-lg shadow-primary/20'
                          : 'bg-surface-muted text-text-muted hover:bg-border'
                          }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
                    <span>Not at all</span>
                    <span>Extreme</span>
                  </div>
                </div>
              )}

              {question.type === 'text' && (
                <div className="relative">
                  <input
                    type="text"
                    value={String(currentAnswer)}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    placeholder="Describe briefly..."
                    className="w-full bg-surface-muted border-2 border-border rounded-2xl px-6 py-4 text-lg focus:ring-4 focus:ring-accent-500/10 focus:border-accent-500 outline-none transition-all"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-4">
              {currentQuestionIndex > 0 && (
                <button
                  onClick={handleBack}
                  className="btn-secondary flex items-center gap-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back
                </button>
              )}
              <button
                onClick={handleQuestionAnswer}
                disabled={currentAnswer === ''}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {currentQuestionIndex < totalQuestions - 1 ? 'Next' : 'Finish'}
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-8 animate-slide-up">
        <div className="mb-10">
          <h2 className={`font-bold text-text-strong mb-3 ${textSize === 'large' ? 'text-4xl' : 'text-3xl'}`}>
            Welcome, Patient
          </h2>
          <p className="text-text-muted flex items-center gap-2 text-lg">
            How are you feeling today? <Sparkles className="w-5 h-5 text-accent-500" />
          </p>
        </div>

        <div className="glass-card overflow-hidden border-slate-200">
          <div className="flex p-2 bg-slate-100/50">
            <button
              onClick={() => setActiveTab('type')}
              className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-bold transition-all duration-300 ${activeTab === 'type'
                ? 'bg-white text-primary shadow-sm'
                : 'text-text-muted hover:text-text'
                }`}
            >
              <Keyboard className="w-5 h-5" />
              Type Complaint
            </button>
            <button
              onClick={() => setActiveTab('voice')}
              className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-bold transition-all duration-300 ${activeTab === 'voice'
                ? 'bg-white text-primary shadow-sm'
                : 'text-text-muted hover:text-text'
                }`}
            >
              <Mic className="w-5 h-5" />
              Voice Note
            </button>
          </div>

          <div className="p-8">
            {activeTab === 'type' && (
              <div className="animate-slide-up">
                <textarea
                  value={complaintText}
                  onChange={(e) => setComplaintText(e.target.value)}
                  placeholder="Describe your symptoms, when they started, and anything that makes them better or worse..."
                  rows={textSize === 'large' ? 10 : 8}
                  className="w-full bg-slate-50/50 border-2 border-slate-100 rounded-2xl p-6 text-lg focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all resize-none placeholder:text-slate-300"
                />
              </div>
            )}

            {activeTab === 'voice' && (
              <div className="text-center py-10 animate-slide-up">
                {isAnalyzing ? (
                  <div className="flex flex-col items-center">
                    <div className="relative w-24 h-24 mb-6">
                      <div className="absolute inset-0 rounded-full border-4 border-accent-500/10"></div>
                      <div className="absolute inset-0 rounded-full border-4 border-t-accent-600 animate-spin"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Sparkles className="w-8 h-8 text-accent-600" />
                      </div>
                    </div>
                    <p className="text-xl font-bold text-slate-800 mb-1">Local AI is thinking...</p>
                    <p className="text-slate-400">Transcribing and analyzing your symptoms</p>
                  </div>
                ) : isRecording ? (
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-1 h-12 mb-8">
                      {[...Array(20)].map((_, i) => (
                        <div
                          key={i}
                          className="w-1.5 bg-primary rounded-full transition-all duration-150"
                          style={{ height: `${Math.random() * 100 + 20}%`, animation: `pulse 1s ease-in-out infinite ${i * 0.05}s` }}
                        />
                      ))}
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full mb-6 max-w-xs overflow-hidden">
                      <div className="bg-blue-600 h-full transition-all duration-300" style={{ width: `${recordingProgress}%` }}></div>
                    </div>
                    <p className="text-slate-500 font-bold animate-pulse uppercase tracking-wider text-xs">Recording Audio...</p>
                  </div>
                ) : complaintText ? (
                  <div>
                    <div className="inline-flex p-4 bg-green-50 rounded-2xl border border-green-100 mb-6">
                      <CheckCircle2 className="w-10 h-10 text-green-500" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Voice Note Processed</h3>
                    <div className="bg-slate-50 rounded-2xl p-6 text-left text-slate-600 border border-slate-100 mb-6 leading-relaxed">
                      {complaintText}
                    </div>
                    <button onClick={() => setComplaintText('')} className="text-primary font-bold hover:underline">
                      Re-record
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <button
                      onClick={simulateRecording}
                      className="group relative w-24 h-24 bg-primary rounded-full flex items-center justify-center shadow-xl shadow-primary/20 hover:scale-110 transition-all duration-300"
                    >
                      <div className="absolute inset-0 rounded-full bg-primary animate-ping opacity-20"></div>
                      <Mic className="w-10 h-10 text-white" />
                    </button>
                    <p className="mt-8 text-xl font-bold text-slate-800">Tap to start recording</p>
                    <p className="text-slate-400 mt-2">Speak clearly about your symptoms</p>

                    <div className="mt-10 pt-10 border-t border-slate-100 w-full flex flex-col items-center">
                      <label className="flex items-center gap-2 text-slate-500 hover:text-blue-600 cursor-pointer font-bold transition-colors">
                        <FileAudio className="w-5 h-5" />
                        <span>Or upload an audio file</span>
                        <input type="file" onChange={handleVoiceUpload} className="hidden" accept="audio/*" />
                      </label>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!isAnalyzing && !isRecording && complaintText && (
              <div className="mt-8">
                <button
                  onClick={handleContinue}
                  className="btn-primary w-full h-16 text-lg flex items-center justify-center gap-3"
                >
                  Confirm & Continue
                  <ArrowRight className="w-6 h-6" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

