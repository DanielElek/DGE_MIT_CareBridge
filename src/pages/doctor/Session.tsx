import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../AppContext';
import { Layout } from '../../components/Layout';
import { Mic, Square, Upload, ArrowRight, FileAudio } from 'lucide-react';

export const Session: React.FC = () => {
  const { patientData, textSize } = useApp();
  const navigate = useNavigate();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [hasRecording, setHasRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);

  const buttonSizeClass = textSize === 'large' ? 'px-8 py-4 text-lg min-h-[56px]' : 'px-6 py-3 text-base min-h-[48px]';
  const cardPaddingClass = textSize === 'large' ? 'p-8' : 'p-6';

  const handleStartRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
    const interval = setInterval(() => {
      setRecordingTime(t => t + 1);
    }, 1000);
    setTimerInterval(interval);
  };

  const handleStopRecording = async () => {
    setIsRecording(false);
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsProcessing(false);
    setHasRecording(true);
  };

  const handleUploadAudio = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsProcessing(false);
    setHasRecording(true);
  };

  const handleReviewHints = () => {
    navigate('/doctor/soap');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h2 className={`font-bold text-gray-900 mb-6 ${textSize === 'large' ? 'text-3xl' : 'text-2xl'}`}>
          Patient Session
        </h2>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${cardPaddingClass}`}>
            <h3 className={`font-bold text-gray-900 mb-6 ${textSize === 'large' ? 'text-2xl' : 'text-xl'}`}>
              Session recording
            </h3>

            {isProcessing ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className={`text-gray-600 ${textSize === 'large' ? 'text-lg' : 'text-base'}`}>
                  Processing locally...
                </p>
              </div>
            ) : hasRecording ? (
              <div className="text-center py-12">
                <FileAudio className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <p className={`text-gray-900 font-medium mb-2 ${textSize === 'large' ? 'text-xl' : 'text-lg'}`}>
                  Recording complete
                </p>
                <p className={`text-gray-600 mb-6 ${textSize === 'large' ? 'text-base' : 'text-sm'}`}>
                  Session processed and ready for review
                </p>
                <button
                  onClick={handleReviewHints}
                  className={`flex items-center justify-center gap-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors mx-auto ${buttonSizeClass}`}
                >
                  Review AI hints
                  <ArrowRight className={textSize === 'large' ? 'w-6 h-6' : 'w-5 h-5'} />
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {isRecording ? (
                  <div className="text-center py-8">
                    <div className="inline-block relative">
                      <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-4 animate-pulse">
                        <Mic className="w-12 h-12 text-red-600" />
                      </div>
                    </div>
                    <p className={`font-mono font-bold text-gray-900 mb-6 ${textSize === 'large' ? 'text-3xl' : 'text-2xl'}`}>
                      {formatTime(recordingTime)}
                    </p>
                    <button
                      onClick={handleStopRecording}
                      className={`flex items-center justify-center gap-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors mx-auto ${buttonSizeClass}`}
                    >
                      <Square className={textSize === 'large' ? 'w-6 h-6' : 'w-5 h-5'} />
                      Stop recording
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="text-center py-4">
                      <button
                        onClick={handleStartRecording}
                        className={`flex items-center justify-center gap-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors mx-auto ${buttonSizeClass}`}
                      >
                        <Mic className={textSize === 'large' ? 'w-6 h-6' : 'w-5 h-5'} />
                        Start recording
                      </button>
                    </div>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300"></div>
                      </div>
                      <div className="relative flex justify-center">
                        <span className={`bg-white px-4 text-gray-500 ${textSize === 'large' ? 'text-base' : 'text-sm'}`}>
                          or
                        </span>
                      </div>
                    </div>

                    <div className="text-center">
                      <label className={`inline-flex items-center justify-center gap-2 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors cursor-pointer ${buttonSizeClass}`}>
                        <Upload className={textSize === 'large' ? 'w-6 h-6' : 'w-5 h-5'} />
                        Upload audio file
                        <input
                          type="file"
                          accept="audio/*"
                          onChange={handleUploadAudio}
                          className="hidden"
                        />
                      </label>
                      <p className={`text-gray-500 mt-3 ${textSize === 'large' ? 'text-base' : 'text-sm'}`}>
                        MP3, WAV, or M4A files accepted
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <div className={`bg-blue-50 rounded-lg border border-blue-200 ${cardPaddingClass}`}>
            <h3 className={`font-bold text-blue-900 mb-6 ${textSize === 'large' ? 'text-2xl' : 'text-xl'}`}>
              Latest patient summary
            </h3>

            {patientData && patientData.summary.bullets.length > 0 ? (
              <>
                <div className="mb-6">
                  <h4 className={`font-bold text-blue-900 mb-3 ${textSize === 'large' ? 'text-xl' : 'text-lg'}`}>
                    Chief complaint
                  </h4>
                  <ul className={`space-y-2 ${textSize === 'large' ? 'text-lg leading-relaxed' : 'text-base leading-relaxed'}`}>
                    {patientData.summary.bullets.map((bullet, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-blue-600 mr-3 mt-1">•</span>
                        <span className="text-blue-900">{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <h4 className={`font-bold text-blue-900 mb-3 ${textSize === 'large' ? 'text-xl' : 'text-lg'}`}>
                      Key positives
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {patientData.summary.keyPositives.map((item, index) => (
                        <span
                          key={index}
                          className={`inline-block bg-red-100 text-red-800 rounded-full px-3 py-1 font-medium border border-red-300 ${textSize === 'large' ? 'text-sm' : 'text-xs'}`}
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className={`font-bold text-blue-900 mb-3 ${textSize === 'large' ? 'text-xl' : 'text-lg'}`}>
                      Key negatives
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {patientData.summary.keyNegatives.map((item, index) => (
                        <span
                          key={index}
                          className={`inline-block bg-green-100 text-green-800 rounded-full px-3 py-1 font-medium border border-green-300 ${textSize === 'large' ? 'text-sm' : 'text-xs'}`}
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className={`font-bold text-blue-900 mb-3 ${textSize === 'large' ? 'text-xl' : 'text-lg'}`}>
                    Timeline
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className={`text-blue-700 mb-1 ${textSize === 'large' ? 'text-base' : 'text-sm'}`}>
                        Onset
                      </p>
                      <p className={`font-medium text-blue-900 ${textSize === 'large' ? 'text-lg' : 'text-base'}`}>
                        {patientData.summary.onset}
                      </p>
                    </div>
                    <div>
                      <p className={`text-blue-700 mb-1 ${textSize === 'large' ? 'text-base' : 'text-sm'}`}>
                        Duration
                      </p>
                      <p className={`font-medium text-blue-900 ${textSize === 'large' ? 'text-lg' : 'text-base'}`}>
                        {patientData.summary.duration}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className={`font-bold text-blue-900 mb-3 ${textSize === 'large' ? 'text-xl' : 'text-lg'}`}>
                    Current metrics
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white rounded-lg p-3 border border-blue-200 text-center">
                      <p className={`text-blue-700 mb-1 ${textSize === 'large' ? 'text-sm' : 'text-xs'}`}>
                        Pain
                      </p>
                      <p className={`font-bold text-red-600 ${textSize === 'large' ? 'text-2xl' : 'text-xl'}`}>
                        {patientData.summary.painLevel}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-blue-200 text-center">
                      <p className={`text-blue-700 mb-1 ${textSize === 'large' ? 'text-sm' : 'text-xs'}`}>
                        Wellbeing
                      </p>
                      <p className={`font-bold text-blue-600 ${textSize === 'large' ? 'text-2xl' : 'text-xl'}`}>
                        {patientData.summary.wellbeing}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-blue-200 text-center">
                      <p className={`text-blue-700 mb-1 ${textSize === 'large' ? 'text-sm' : 'text-xs'}`}>
                        Sleep
                      </p>
                      <p className={`font-bold text-green-600 ${textSize === 'large' ? 'text-2xl' : 'text-xl'}`}>
                        {patientData.summary.sleep}h
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <p className={`text-blue-700 ${textSize === 'large' ? 'text-lg' : 'text-base'}`}>
                No patient summary available yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};
