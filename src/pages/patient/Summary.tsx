import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../AppContext';
import { Layout } from '../../components/Layout';
import { Share2, Printer, TrendingUp } from 'lucide-react';

export const Summary: React.FC = () => {
  const { patientData, textSize, setRole } = useApp();
  const navigate = useNavigate();

  const buttonSizeClass = textSize === 'large' ? 'px-8 py-4 text-lg min-h-[56px]' : 'px-6 py-3 text-base min-h-[48px]';
  const cardPaddingClass = textSize === 'large' ? 'p-8' : 'p-6';

  if (!patientData || !patientData.summary.bullets.length) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className={`bg-yellow-50 border border-yellow-200 rounded-lg ${cardPaddingClass}`}>
            <p className={`text-yellow-800 ${textSize === 'large' ? 'text-lg' : 'text-base'}`}>
              Please complete the complaint form first to generate your summary.
            </p>
            <button
              onClick={() => navigate('/patient/complaint')}
              className={`mt-4 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700 transition-colors ${buttonSizeClass}`}
            >
              Go to Complaint Form
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const handleShareWithDoctor = () => {
    setRole('doctor');
    navigate('/doctor/patient');
  };

  const handlePrint = () => {
    navigate('/print?type=patientSummary');
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h2 className={`font-bold text-gray-900 mb-6 ${textSize === 'large' ? 'text-3xl' : 'text-2xl'}`}>
          Your Health Summary
        </h2>

        <div className="space-y-6">
          <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${cardPaddingClass}`}>
            <h3 className={`font-bold text-gray-900 mb-4 ${textSize === 'large' ? 'text-2xl' : 'text-xl'}`}>
              Doctor-ready summary
            </h3>
            <ul className={`space-y-3 ${textSize === 'large' ? 'text-lg leading-relaxed' : 'text-base'}`}>
              {patientData.summary.bullets.map((bullet, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-blue-600 mr-3 mt-1">•</span>
                  <span className="text-gray-700">{bullet}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${cardPaddingClass}`}>
              <h3 className={`font-bold text-gray-900 mb-4 ${textSize === 'large' ? 'text-2xl' : 'text-xl'}`}>
                Key positives
              </h3>
              <div className="flex flex-wrap gap-2">
                {patientData.summary.keyPositives.map((item, index) => (
                  <span
                    key={index}
                    className={`inline-block bg-red-50 text-red-700 rounded-full px-4 py-2 font-medium border border-red-200 ${textSize === 'large' ? 'text-base' : 'text-sm'}`}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${cardPaddingClass}`}>
              <h3 className={`font-bold text-gray-900 mb-4 ${textSize === 'large' ? 'text-2xl' : 'text-xl'}`}>
                Key negatives
              </h3>
              <div className="flex flex-wrap gap-2">
                {patientData.summary.keyNegatives.map((item, index) => (
                  <span
                    key={index}
                    className={`inline-block bg-green-50 text-green-700 rounded-full px-4 py-2 font-medium border border-green-200 ${textSize === 'large' ? 'text-base' : 'text-sm'}`}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${cardPaddingClass}`}>
            <h3 className={`font-bold text-gray-900 mb-4 ${textSize === 'large' ? 'text-2xl' : 'text-xl'}`}>
              Timeline
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
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

          <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${cardPaddingClass}`}>
            <h3 className={`font-bold text-gray-900 mb-4 ${textSize === 'large' ? 'text-2xl' : 'text-xl'}`}>
              Severity snapshot
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <p className={`text-gray-600 mb-2 ${textSize === 'large' ? 'text-base' : 'text-sm'}`}>
                  Pain Level
                </p>
                <div className="flex items-baseline">
                  <span className={`font-bold text-red-600 ${textSize === 'large' ? 'text-4xl' : 'text-3xl'}`}>
                    {patientData.summary.painLevel}
                  </span>
                  <span className={`text-gray-500 ml-2 ${textSize === 'large' ? 'text-lg' : 'text-base'}`}>
                    /10
                  </span>
                </div>
              </div>
              <div>
                <p className={`text-gray-600 mb-2 ${textSize === 'large' ? 'text-base' : 'text-sm'}`}>
                  Wellbeing
                </p>
                <div className="flex items-baseline">
                  <span className={`font-bold text-blue-600 ${textSize === 'large' ? 'text-4xl' : 'text-3xl'}`}>
                    {patientData.summary.wellbeing}
                  </span>
                  <span className={`text-gray-500 ml-2 ${textSize === 'large' ? 'text-lg' : 'text-base'}`}>
                    /10
                  </span>
                </div>
              </div>
              <div>
                <p className={`text-gray-600 mb-2 ${textSize === 'large' ? 'text-base' : 'text-sm'}`}>
                  Sleep Hours
                </p>
                <div className="flex items-baseline">
                  <span className={`font-bold text-green-600 ${textSize === 'large' ? 'text-4xl' : 'text-3xl'}`}>
                    {patientData.summary.sleep}
                  </span>
                  <span className={`text-gray-500 ml-2 ${textSize === 'large' ? 'text-lg' : 'text-base'}`}>
                    hrs
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className={`bg-blue-50 rounded-lg border border-blue-200 ${cardPaddingClass}`}>
            <h3 className={`font-bold text-blue-900 mb-3 ${textSize === 'large' ? 'text-2xl' : 'text-xl'}`}>
              What to discuss next
            </h3>
            <ul className={`space-y-2 ${textSize === 'large' ? 'text-lg leading-relaxed' : 'text-base'}`}>
              <li className="flex items-start">
                <span className="text-blue-600 mr-3 mt-1">•</span>
                <span className="text-blue-900">Review treatment options for pain management</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-3 mt-1">•</span>
                <span className="text-blue-900">Discuss physical therapy or exercises</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-3 mt-1">•</span>
                <span className="text-blue-900">Consider imaging if symptoms persist</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleShareWithDoctor}
              className={`flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors ${buttonSizeClass}`}
            >
              <Share2 className={textSize === 'large' ? 'w-6 h-6' : 'w-5 h-5'} />
              Share with doctor
            </button>
            <button
              onClick={handlePrint}
              className={`flex items-center justify-center gap-2 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors ${buttonSizeClass}`}
            >
              <Printer className={textSize === 'large' ? 'w-6 h-6' : 'w-5 h-5'} />
              Print
            </button>
            <button
              onClick={() => navigate('/patient/trends')}
              className={`flex items-center justify-center gap-2 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors ${buttonSizeClass}`}
            >
              <TrendingUp className={textSize === 'large' ? 'w-6 h-6' : 'w-5 h-5'} />
              View trends
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};
