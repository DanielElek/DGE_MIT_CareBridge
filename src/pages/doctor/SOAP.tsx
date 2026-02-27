import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../AppContext';
import { Layout } from '../../components/Layout';
import { Printer, Copy, Upload, Sparkles, CheckCircle2, XCircle, Info } from 'lucide-react';

export const SOAP: React.FC = () => {
  const { doctorSession, updateSOAP, textSize } = useApp();
  const navigate = useNavigate();
  const [hasTranscript, setHasTranscript] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [includePatientSummary, setIncludePatientSummary] = useState(true);
  const [soapGenerated, setSoapGenerated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [soap, setSOAP] = useState(doctorSession.soap);
  const [copied, setCopied] = useState(false);

  const buttonSizeClass = textSize === 'large' ? 'px-8 py-4 text-lg min-h-[56px]' : 'px-6 py-3 text-base min-h-[48px]';
  const cardPaddingClass = textSize === 'large' ? 'p-8' : 'p-6';
  const inputSizeClass = textSize === 'large' ? 'text-lg p-4' : 'text-base p-3';

  const handleUploadAudio = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsTranscribing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsTranscribing(false);
    setHasTranscript(true);
  };

  const handleGenerateSOAP = async () => {
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsGenerating(false);
    setSoapGenerated(true);
  };

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

  const handlePrint = () => {
    navigate('/print?type=soap');
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className={`font-bold text-gray-900 ${textSize === 'large' ? 'text-3xl' : 'text-2xl'}`}>
            SOAP Note
          </h2>
          <div className={`flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-2 ${textSize === 'large' ? 'text-base' : 'text-sm'}`}>
            <div className="w-2 h-2 bg-green-600 rounded-full"></div>
            <span className="font-medium text-green-900">Local AI mode: ON</span>
            <div className="group relative">
              <Info className="w-4 h-4 text-green-600 cursor-help" />
              <div className={`absolute right-0 top-6 w-64 bg-gray-900 text-white p-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 ${textSize === 'large' ? 'text-sm' : 'text-xs'}`}>
                Runs locally for privacy. Please review outputs.
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {!hasTranscript ? (
            <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${cardPaddingClass}`}>
              <h3 className={`font-bold text-gray-900 mb-4 ${textSize === 'large' ? 'text-2xl' : 'text-xl'}`}>
                Conversation Audio
              </h3>
              {isTranscribing ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className={`text-gray-600 ${textSize === 'large' ? 'text-lg' : 'text-base'}`}>
                    Transcribing locally...
                  </p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <label className={`inline-flex items-center justify-center gap-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors cursor-pointer ${buttonSizeClass}`}>
                    <Upload className={textSize === 'large' ? 'w-6 h-6' : 'w-5 h-5'} />
                    Upload conversation audio
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
              )}
            </div>
          ) : (
            <>
              <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${cardPaddingClass}`}>
                <h3 className={`font-bold text-gray-900 mb-4 ${textSize === 'large' ? 'text-2xl' : 'text-xl'}`}>
                  Transcript
                </h3>
                <div className={`bg-gray-50 rounded-lg p-4 border border-gray-200 max-h-64 overflow-y-auto ${textSize === 'large' ? 'text-lg leading-relaxed' : 'text-base leading-relaxed'}`}>
                  <p className="text-gray-700 whitespace-pre-line">
                    {doctorSession.mockTranscript}
                  </p>
                </div>
              </div>

              <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${cardPaddingClass}`}>
                <h3 className={`font-bold text-gray-900 mb-4 ${textSize === 'large' ? 'text-2xl' : 'text-xl'}`}>
                  Completeness hints
                </h3>
                <div className="space-y-3">
                  {doctorSession.completenessHints.map((hint, index) => (
                    <div key={index} className="flex items-center gap-3">
                      {hint.status === 'covered' ? (
                        <CheckCircle2 className={`text-green-600 flex-shrink-0 ${textSize === 'large' ? 'w-6 h-6' : 'w-5 h-5'}`} />
                      ) : (
                        <XCircle className={`text-gray-400 flex-shrink-0 ${textSize === 'large' ? 'w-6 h-6' : 'w-5 h-5'}`} />
                      )}
                      <span className={`${textSize === 'large' ? 'text-lg' : 'text-base'} ${hint.status === 'covered' ? 'text-gray-900' : 'text-gray-500'}`}>
                        {hint.item}
                      </span>
                      <span className={`ml-auto text-xs px-3 py-1 rounded-full ${hint.status === 'covered' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                        {hint.status === 'covered' ? 'Covered' : 'Not mentioned'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${cardPaddingClass}`}>
                <h3 className={`font-bold text-gray-900 mb-4 ${textSize === 'large' ? 'text-2xl' : 'text-xl'}`}>
                  Suggested follow-up questions
                </h3>
                <ul className={`space-y-2 ${textSize === 'large' ? 'text-lg leading-relaxed' : 'text-base leading-relaxed'}`}>
                  {doctorSession.suggestedFollowUps.map((question, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-blue-600 mr-3 mt-1">•</span>
                      <span className="text-gray-700">{question}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${cardPaddingClass}`}>
                <h3 className={`font-bold text-gray-900 mb-4 ${textSize === 'large' ? 'text-2xl' : 'text-xl'}`}>
                  Key terms
                </h3>
                <div className="flex flex-wrap gap-2">
                  {doctorSession.keyTerms.map((term, index) => (
                    <span
                      key={index}
                      className={`inline-block bg-blue-50 border-2 border-blue-300 text-blue-700 rounded-full px-4 py-2 font-medium ${textSize === 'large' ? 'text-base' : 'text-sm'}`}
                    >
                      {term}
                    </span>
                  ))}
                </div>
              </div>

              {!soapGenerated && (
                <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${cardPaddingClass}`}>
                  <h3 className={`font-bold text-gray-900 mb-4 ${textSize === 'large' ? 'text-2xl' : 'text-xl'}`}>
                    Generate SOAP Note
                  </h3>
                  <div className="flex items-center gap-3 mb-6">
                    <input
                      type="checkbox"
                      id="includePatientSummary"
                      checked={includePatientSummary}
                      onChange={(e) => setIncludePatientSummary(e.target.checked)}
                      className={`rounded border-gray-300 text-blue-600 focus:ring-blue-500 ${textSize === 'large' ? 'w-6 h-6' : 'w-5 h-5'}`}
                    />
                    <label
                      htmlFor="includePatientSummary"
                      className={`font-medium text-gray-700 cursor-pointer ${textSize === 'large' ? 'text-lg' : 'text-base'}`}
                    >
                      Include patient summary
                    </label>
                  </div>
                  <button
                    onClick={handleGenerateSOAP}
                    disabled={isGenerating}
                    className={`w-full flex items-center justify-center gap-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 ${buttonSizeClass}`}
                  >
                    {isGenerating ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Generating SOAP...
                      </>
                    ) : (
                      <>
                        <Sparkles className={textSize === 'large' ? 'w-6 h-6' : 'w-5 h-5'} />
                        Generate SOAP
                      </>
                    )}
                  </button>
                </div>
              )}

              {soapGenerated && (
                <>
                  <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${cardPaddingClass}`}>
                    <h3 className={`font-bold text-gray-900 mb-6 ${textSize === 'large' ? 'text-2xl' : 'text-xl'}`}>
                      SOAP Note
                    </h3>

                    <div className="space-y-6">
                      <div>
                        <label className={`block font-bold text-gray-900 mb-3 ${textSize === 'large' ? 'text-xl' : 'text-lg'}`}>
                          SUBJECTIVE
                        </label>
                        <textarea
                          value={soap.subjective}
                          onChange={(e) => handleSOAPChange('subjective', e.target.value)}
                          rows={textSize === 'large' ? 6 : 5}
                          className={`w-full border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${inputSizeClass} ${textSize === 'large' ? 'leading-relaxed' : ''}`}
                        />
                      </div>

                      <div>
                        <label className={`block font-bold text-gray-900 mb-3 ${textSize === 'large' ? 'text-xl' : 'text-lg'}`}>
                          OBJECTIVE
                        </label>
                        <textarea
                          value={soap.objective}
                          onChange={(e) => handleSOAPChange('objective', e.target.value)}
                          rows={textSize === 'large' ? 6 : 5}
                          className={`w-full border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${inputSizeClass} ${textSize === 'large' ? 'leading-relaxed' : ''}`}
                        />
                      </div>

                      <div>
                        <label className={`block font-bold text-gray-900 mb-3 ${textSize === 'large' ? 'text-xl' : 'text-lg'}`}>
                          ASSESSMENT
                        </label>
                        <textarea
                          value={soap.assessment}
                          onChange={(e) => handleSOAPChange('assessment', e.target.value)}
                          rows={textSize === 'large' ? 5 : 4}
                          className={`w-full border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${inputSizeClass} ${textSize === 'large' ? 'leading-relaxed' : ''}`}
                        />
                      </div>

                      <div>
                        <label className={`block font-bold text-gray-900 mb-3 ${textSize === 'large' ? 'text-xl' : 'text-lg'}`}>
                          PLAN
                        </label>
                        <textarea
                          value={soap.plan}
                          onChange={(e) => handleSOAPChange('plan', e.target.value)}
                          rows={textSize === 'large' ? 6 : 5}
                          className={`w-full border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${inputSizeClass} ${textSize === 'large' ? 'leading-relaxed' : ''}`}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handlePrint}
                      className={`flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors ${buttonSizeClass}`}
                    >
                      <Printer className={textSize === 'large' ? 'w-6 h-6' : 'w-5 h-5'} />
                      Print SOAP
                    </button>
                    <button
                      onClick={handleCopySOAP}
                      className={`flex items-center justify-center gap-2 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors ${buttonSizeClass}`}
                    >
                      <Copy className={textSize === 'large' ? 'w-6 h-6' : 'w-5 h-5'} />
                      {copied ? 'Copied!' : 'Copy SOAP'}
                    </button>
                    <button
                      onClick={() => navigate('/doctor/session')}
                      className={`flex items-center justify-center gap-2 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors ${buttonSizeClass}`}
                    >
                      Back to session
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};
