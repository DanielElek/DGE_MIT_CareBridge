import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../AppContext';
import { Layout } from '../../components/Layout';
import { Mic, FileAudio, ArrowRight, ArrowLeft } from 'lucide-react';
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

  const buttonSizeClass = textSize === 'large' ? 'px-8 py-4 text-lg min-h-[56px]' : 'px-6 py-3 text-base min-h-[48px]';
  const inputSizeClass = textSize === 'large' ? 'text-lg p-4' : 'text-base p-3';
  const cardPaddingClass = textSize === 'large' ? 'p-8' : 'p-6';

  const handleVoiceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));

    const mockTranscript = "I've been having lower back pain for the past three weeks. It started after I helped move some furniture. The pain shoots down my left leg sometimes, especially when I sit for too long. It's been keeping me up at night.";
    setComplaintText(mockTranscript);
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
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${cardPaddingClass}`}>
            <h2 className={`font-bold text-gray-900 mb-2 ${textSize === 'large' ? 'text-3xl' : 'text-2xl'}`}>
              Smart Check-in
            </h2>
            <p className={`text-gray-600 mb-6 ${textSize === 'large' ? 'text-lg' : 'text-base'}`}>
              A few quick questions to help your doctor.
            </p>

            <div className="mb-6">
              <p className={`text-gray-500 mb-4 ${textSize === 'large' ? 'text-base' : 'text-sm'}`}>
                Question {currentQuestionIndex + 1} of {totalQuestions}
              </p>

              <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
                />
              </div>

              <p className={`font-medium text-gray-900 mb-6 ${textSize === 'large' ? 'text-2xl leading-relaxed' : 'text-xl leading-relaxed'}`}>
                {question.question}
              </p>

              {question.type === 'yesno' && (
                <div className="space-y-3">
                  <button
                    onClick={() => setCurrentAnswer(true)}
                    className={`w-full ${buttonSizeClass} border-2 rounded-lg font-medium transition-all ${
                      currentAnswer === true
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setCurrentAnswer(false)}
                    className={`w-full ${buttonSizeClass} border-2 rounded-lg font-medium transition-all ${
                      currentAnswer === false
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    No
                  </button>
                </div>
              )}

              {question.type === 'scale' && (
                <div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={currentAnswer || 0}
                    onChange={(e) => setCurrentAnswer(Number(e.target.value))}
                    className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between mt-2">
                    <span className={`text-gray-600 ${textSize === 'large' ? 'text-base' : 'text-sm'}`}>0</span>
                    <span className={`font-bold text-blue-600 ${textSize === 'large' ? 'text-2xl' : 'text-xl'}`}>
                      {currentAnswer || 0}
                    </span>
                    <span className={`text-gray-600 ${textSize === 'large' ? 'text-base' : 'text-sm'}`}>10</span>
                  </div>
                </div>
              )}

              {question.type === 'text' && (
                <input
                  type="text"
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  placeholder="Type your answer..."
                  className={`w-full border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${inputSizeClass}`}
                />
              )}
            </div>

            <div className="flex gap-3">
              {currentQuestionIndex > 0 && (
                <button
                  onClick={handleBack}
                  className={`flex items-center justify-center gap-2 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors ${buttonSizeClass}`}
                >
                  <ArrowLeft className={textSize === 'large' ? 'w-6 h-6' : 'w-5 h-5'} />
                  Back
                </button>
              )}
              <button
                onClick={handleQuestionAnswer}
                disabled={currentAnswer === ''}
                className={`flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${buttonSizeClass}`}
              >
                {currentQuestionIndex < totalQuestions - 1 ? 'Next' : 'Finish'}
                <ArrowRight className={textSize === 'large' ? 'w-6 h-6' : 'w-5 h-5'} />
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h2 className={`font-bold text-gray-900 mb-6 ${textSize === 'large' ? 'text-3xl' : 'text-2xl'}`}>
          Describe Your Issue
        </h2>

        <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${cardPaddingClass}`}>
          <div className="flex border-b border-gray-200 mb-6">
            <button
              onClick={() => setActiveTab('type')}
              className={`flex-1 pb-4 font-medium transition-colors ${textSize === 'large' ? 'text-lg' : 'text-base'} ${
                activeTab === 'type'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Type
            </button>
            <button
              onClick={() => setActiveTab('voice')}
              className={`flex-1 pb-4 font-medium transition-colors ${textSize === 'large' ? 'text-lg' : 'text-base'} ${
                activeTab === 'voice'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Voice
            </button>
          </div>

          {activeTab === 'type' && (
            <div>
              <label className={`block font-medium text-gray-700 mb-3 ${textSize === 'large' ? 'text-lg' : 'text-base'}`}>
                What's bothering you today?
              </label>
              <textarea
                value={complaintText}
                onChange={(e) => setComplaintText(e.target.value)}
                placeholder="Describe your symptoms, when they started, and anything that makes them better or worse..."
                rows={textSize === 'large' ? 8 : 6}
                className={`w-full border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${inputSizeClass} ${textSize === 'large' ? 'leading-relaxed' : ''}`}
              />
            </div>
          )}

          {activeTab === 'voice' && (
            <div className="text-center py-8">
              {isAnalyzing ? (
                <div>
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className={`text-gray-600 ${textSize === 'large' ? 'text-lg' : 'text-base'}`}>
                    Analyzing locally...
                  </p>
                </div>
              ) : complaintText ? (
                <div>
                  <FileAudio className="w-16 h-16 text-green-600 mx-auto mb-4" />
                  <p className={`text-gray-600 mb-4 ${textSize === 'large' ? 'text-lg' : 'text-base'}`}>
                    Voice note processed
                  </p>
                  <div className={`bg-gray-50 rounded-lg p-4 text-left ${textSize === 'large' ? 'text-lg leading-relaxed' : 'text-base'}`}>
                    {complaintText}
                  </div>
                </div>
              ) : (
                <div>
                  <Mic className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                  <label className={`inline-flex items-center justify-center gap-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors cursor-pointer ${buttonSizeClass}`}>
                    <FileAudio className={textSize === 'large' ? 'w-6 h-6' : 'w-5 h-5'} />
                    Upload voice note
                    <input
                      type="file"
                      accept="audio/mp3,audio/wav,audio/m4a"
                      onChange={handleVoiceUpload}
                      className="hidden"
                    />
                  </label>
                  <p className={`text-gray-500 mt-4 ${textSize === 'large' ? 'text-base' : 'text-sm'}`}>
                    MP3, WAV, or M4A files accepted
                  </p>
                </div>
              )}
            </div>
          )}

          {!isAnalyzing && complaintText && (
            <div className="mt-6">
              <button
                onClick={handleContinue}
                className={`w-full flex items-center justify-center gap-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors ${buttonSizeClass}`}
              >
                Continue
                <ArrowRight className={textSize === 'large' ? 'w-6 h-6' : 'w-5 h-5'} />
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};
