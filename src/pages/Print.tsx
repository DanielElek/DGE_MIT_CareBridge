import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useApp } from '../AppContext';
import { Layout } from '../components/Layout';
import { Printer, ArrowLeft } from 'lucide-react';
import { PATIENT_ID } from '../mockData';

export const Print: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { patientData, documents, doctorSession, textSize } = useApp();
  const navigate = useNavigate();

  const type = searchParams.get('type');
  const docId = searchParams.get('docId');

  const buttonSizeClass = textSize === 'large' ? 'px-8 py-4 text-lg min-h-[56px]' : 'px-6 py-3 text-base min-h-[48px]';

  const handlePrint = () => {
    window.print();
  };

  const handleBack = () => {
    navigate(-1);
  };

  const now = new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <Layout hideHeader={false}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="print:hidden mb-6 flex gap-3">
          <button
            onClick={handleBack}
            className={`flex items-center justify-center gap-2 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors ${buttonSizeClass}`}
          >
            <ArrowLeft className={textSize === 'large' ? 'w-6 h-6' : 'w-5 h-5'} />
            Back
          </button>
          <button
            onClick={handlePrint}
            className={`flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors ${buttonSizeClass}`}
          >
            <Printer className={textSize === 'large' ? 'w-6 h-6' : 'w-5 h-5'} />
            Print
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 print:shadow-none print:border-0">
          <div className="mb-6 pb-4 border-b border-gray-200">
            <h1 className={`font-bold text-gray-900 mb-2 ${textSize === 'large' ? 'text-3xl' : 'text-2xl'}`}>
              {type === 'patientSummary' && 'Patient Summary'}
              {type === 'documentExplanation' && 'Document Explanation'}
              {type === 'soap' && 'SOAP Note'}
            </h1>
            <p className={`text-gray-600 ${textSize === 'large' ? 'text-base' : 'text-sm'}`}>
              Generated: {now}
            </p>
            <p className={`text-gray-600 ${textSize === 'large' ? 'text-base' : 'text-sm'}`}>
              Patient ID: {PATIENT_ID}
            </p>
          </div>

          {type === 'patientSummary' && patientData && (
            <div className="space-y-6">
              <div>
                <h2 className={`font-bold text-gray-900 mb-3 ${textSize === 'large' ? 'text-2xl' : 'text-xl'}`}>
                  Doctor-ready summary
                </h2>
                <ul className={`space-y-2 ${textSize === 'large' ? 'text-lg leading-relaxed' : 'text-base leading-relaxed'}`}>
                  {patientData.summary.bullets.map((bullet, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-blue-600 mr-3 mt-1">•</span>
                      <span className="text-gray-700">{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h2 className={`font-bold text-gray-900 mb-3 ${textSize === 'large' ? 'text-2xl' : 'text-xl'}`}>
                  Key positives
                </h2>
                <div className="flex flex-wrap gap-2">
                  {patientData.summary.keyPositives.map((item, index) => (
                    <span
                      key={index}
                      className={`inline-block bg-red-50 text-red-700 rounded px-3 py-1 font-medium border border-red-200 ${textSize === 'large' ? 'text-base' : 'text-sm'}`}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h2 className={`font-bold text-gray-900 mb-3 ${textSize === 'large' ? 'text-2xl' : 'text-xl'}`}>
                  Key negatives
                </h2>
                <div className="flex flex-wrap gap-2">
                  {patientData.summary.keyNegatives.map((item, index) => (
                    <span
                      key={index}
                      className={`inline-block bg-green-50 text-green-700 rounded px-3 py-1 font-medium border border-green-200 ${textSize === 'large' ? 'text-base' : 'text-sm'}`}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h2 className={`font-bold text-gray-900 mb-3 ${textSize === 'large' ? 'text-2xl' : 'text-xl'}`}>
                  Timeline
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className={`text-gray-600 mb-1 ${textSize === 'large' ? 'text-base' : 'text-sm'}`}>
                      Onset
                    </p>
                    <p className={`font-medium text-gray-900 ${textSize === 'large' ? 'text-lg' : 'text-base'}`}>
                      {patientData.summary.onset}
                    </p>
                  </div>
                  <div>
                    <p className={`text-gray-600 mb-1 ${textSize === 'large' ? 'text-base' : 'text-sm'}`}>
                      Duration
                    </p>
                    <p className={`font-medium text-gray-900 ${textSize === 'large' ? 'text-lg' : 'text-base'}`}>
                      {patientData.summary.duration}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h2 className={`font-bold text-gray-900 mb-3 ${textSize === 'large' ? 'text-2xl' : 'text-xl'}`}>
                  Severity snapshot
                </h2>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className={`text-gray-600 mb-1 ${textSize === 'large' ? 'text-base' : 'text-sm'}`}>
                      Pain Level
                    </p>
                    <p className={`font-bold text-gray-900 ${textSize === 'large' ? 'text-2xl' : 'text-xl'}`}>
                      {patientData.summary.painLevel}/10
                    </p>
                  </div>
                  <div>
                    <p className={`text-gray-600 mb-1 ${textSize === 'large' ? 'text-base' : 'text-sm'}`}>
                      Wellbeing
                    </p>
                    <p className={`font-bold text-gray-900 ${textSize === 'large' ? 'text-2xl' : 'text-xl'}`}>
                      {patientData.summary.wellbeing}/10
                    </p>
                  </div>
                  <div>
                    <p className={`text-gray-600 mb-1 ${textSize === 'large' ? 'text-base' : 'text-sm'}`}>
                      Sleep Hours
                    </p>
                    <p className={`font-bold text-gray-900 ${textSize === 'large' ? 'text-2xl' : 'text-xl'}`}>
                      {patientData.summary.sleep} hrs
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {type === 'documentExplanation' && docId && (() => {
            const document = documents.find(d => d.docId === docId);
            if (!document) return <p>Document not found</p>;

            return (
              <div className="space-y-6">
                <div>
                  <h2 className={`font-bold text-gray-900 mb-2 ${textSize === 'large' ? 'text-2xl' : 'text-xl'}`}>
                    {document.title}
                  </h2>
                  <p className={`text-gray-600 mb-4 ${textSize === 'large' ? 'text-base' : 'text-sm'}`}>
                    {new Date(document.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>

                <div>
                  <h3 className={`font-bold text-gray-900 mb-3 ${textSize === 'large' ? 'text-xl' : 'text-lg'}`}>
                    Plain-language explanation
                  </h3>
                  <ul className={`space-y-2 ${textSize === 'large' ? 'text-lg leading-relaxed' : 'text-base leading-relaxed'}`}>
                    {document.plainLanguageExplanation.map((item, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-blue-600 mr-3 mt-1">•</span>
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className={`font-bold text-gray-900 mb-3 ${textSize === 'large' ? 'text-xl' : 'text-lg'}`}>
                    Key takeaways
                  </h3>
                  <ul className={`space-y-2 ${textSize === 'large' ? 'text-lg leading-relaxed' : 'text-base leading-relaxed'}`}>
                    {document.keyTakeaways.map((item, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-blue-600 mr-3 mt-1">✓</span>
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className={`font-bold text-gray-900 mb-3 ${textSize === 'large' ? 'text-xl' : 'text-lg'}`}>
                    Questions to ask your clinician
                  </h3>
                  <ul className={`space-y-2 ${textSize === 'large' ? 'text-lg leading-relaxed' : 'text-base leading-relaxed'}`}>
                    {document.questionsToAsk.map((item, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-blue-600 mr-3 mt-1">?</span>
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })()}

          {type === 'soap' && (
            <div className="space-y-6">
              <div>
                <h2 className={`font-bold text-gray-900 mb-3 ${textSize === 'large' ? 'text-2xl' : 'text-xl'}`}>
                  SUBJECTIVE
                </h2>
                <p className={`text-gray-700 whitespace-pre-line ${textSize === 'large' ? 'text-lg leading-relaxed' : 'text-base leading-relaxed'}`}>
                  {doctorSession.soap.subjective}
                </p>
              </div>

              <div>
                <h2 className={`font-bold text-gray-900 mb-3 ${textSize === 'large' ? 'text-2xl' : 'text-xl'}`}>
                  OBJECTIVE
                </h2>
                <p className={`text-gray-700 whitespace-pre-line ${textSize === 'large' ? 'text-lg leading-relaxed' : 'text-base leading-relaxed'}`}>
                  {doctorSession.soap.objective}
                </p>
              </div>

              <div>
                <h2 className={`font-bold text-gray-900 mb-3 ${textSize === 'large' ? 'text-2xl' : 'text-xl'}`}>
                  ASSESSMENT
                </h2>
                <p className={`text-gray-700 whitespace-pre-line ${textSize === 'large' ? 'text-lg leading-relaxed' : 'text-base leading-relaxed'}`}>
                  {doctorSession.soap.assessment}
                </p>
              </div>

              <div>
                <h2 className={`font-bold text-gray-900 mb-3 ${textSize === 'large' ? 'text-2xl' : 'text-xl'}`}>
                  PLAN
                </h2>
                <p className={`text-gray-700 whitespace-pre-line ${textSize === 'large' ? 'text-lg leading-relaxed' : 'text-base leading-relaxed'}`}>
                  {doctorSession.soap.plan}
                </p>
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className={`text-gray-500 text-center ${textSize === 'large' ? 'text-base' : 'text-sm'}`}>
              Not medical advice. Discuss with your clinician.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};
