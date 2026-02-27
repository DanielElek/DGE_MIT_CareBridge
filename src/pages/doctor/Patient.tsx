import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../AppContext';
import { Layout } from '../../components/Layout';
import { Search, ArrowRight, FileText } from 'lucide-react';
import { PATIENT_ID } from '../../mockData';

export const Patient: React.FC = () => {
  const { patientData, trends, textSize } = useApp();
  const navigate = useNavigate();
  const [patientId, setPatientId] = useState(PATIENT_ID);
  const [isLoaded, setIsLoaded] = useState(false);

  const buttonSizeClass = textSize === 'large' ? 'px-8 py-4 text-lg min-h-[56px]' : 'px-6 py-3 text-base min-h-[48px]';
  const cardPaddingClass = textSize === 'large' ? 'p-8' : 'p-6';
  const inputSizeClass = textSize === 'large' ? 'text-lg p-4' : 'text-base p-3';

  const handleLoadPatient = () => {
    setIsLoaded(true);
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h2 className={`font-bold text-gray-900 mb-6 ${textSize === 'large' ? 'text-3xl' : 'text-2xl'}`}>
          Patient
        </h2>

        <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${cardPaddingClass} mb-6`}>
          <label className={`block font-medium text-gray-700 mb-3 ${textSize === 'large' ? 'text-lg' : 'text-base'}`}>
            Patient ID
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              placeholder="Enter patient ID..."
              className={`flex-1 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${inputSizeClass}`}
            />
            <button
              onClick={handleLoadPatient}
              className={`flex items-center justify-center gap-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors ${buttonSizeClass}`}
            >
              <Search className={textSize === 'large' ? 'w-6 h-6' : 'w-5 h-5'} />
              Load patient
            </button>
          </div>
        </div>

        {isLoaded && (
          <div className="space-y-6">
            <div className={`bg-blue-50 rounded-lg border border-blue-200 ${cardPaddingClass}`}>
              <div className="flex items-start gap-4 mb-4">
                <FileText className={`text-blue-600 flex-shrink-0 ${textSize === 'large' ? 'w-8 h-8 mt-1' : 'w-6 h-6 mt-1'}`} />
                <div className="flex-1">
                  <h3 className={`font-bold text-blue-900 mb-2 ${textSize === 'large' ? 'text-2xl' : 'text-xl'}`}>
                    Latest Patient Summary
                  </h3>
                  <p className={`text-blue-700 mb-4 ${textSize === 'large' ? 'text-base' : 'text-sm'}`}>
                    Patient ID: {PATIENT_ID}
                  </p>
                </div>
              </div>

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

                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h4 className={`font-bold text-blue-900 mb-3 ${textSize === 'large' ? 'text-xl' : 'text-lg'}`}>
                        Key positives
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {patientData.summary.keyPositives.map((item, index) => (
                          <span
                            key={index}
                            className={`inline-block bg-red-100 text-red-800 rounded-full px-4 py-2 font-medium border border-red-300 ${textSize === 'large' ? 'text-base' : 'text-sm'}`}
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
                            className={`inline-block bg-green-100 text-green-800 rounded-full px-4 py-2 font-medium border border-green-300 ${textSize === 'large' ? 'text-base' : 'text-sm'}`}
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
                    <div className="grid md:grid-cols-2 gap-4">
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
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="bg-white rounded-lg p-4 border border-blue-200">
                        <p className={`text-blue-700 mb-1 ${textSize === 'large' ? 'text-base' : 'text-sm'}`}>
                          Pain Level
                        </p>
                        <div className="flex items-baseline">
                          <span className={`font-bold text-red-600 ${textSize === 'large' ? 'text-3xl' : 'text-2xl'}`}>
                            {patientData.summary.painLevel}
                          </span>
                          <span className={`text-gray-500 ml-2 ${textSize === 'large' ? 'text-base' : 'text-sm'}`}>
                            /10
                          </span>
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-blue-200">
                        <p className={`text-blue-700 mb-1 ${textSize === 'large' ? 'text-base' : 'text-sm'}`}>
                          Wellbeing
                        </p>
                        <div className="flex items-baseline">
                          <span className={`font-bold text-blue-600 ${textSize === 'large' ? 'text-3xl' : 'text-2xl'}`}>
                            {patientData.summary.wellbeing}
                          </span>
                          <span className={`text-gray-500 ml-2 ${textSize === 'large' ? 'text-base' : 'text-sm'}`}>
                            /10
                          </span>
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-blue-200">
                        <p className={`text-blue-700 mb-1 ${textSize === 'large' ? 'text-base' : 'text-sm'}`}>
                          Sleep
                        </p>
                        <div className="flex items-baseline">
                          <span className={`font-bold text-green-600 ${textSize === 'large' ? 'text-3xl' : 'text-2xl'}`}>
                            {patientData.summary.sleep}
                          </span>
                          <span className={`text-gray-500 ml-2 ${textSize === 'large' ? 'text-base' : 'text-sm'}`}>
                            hrs
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <p className={`text-blue-700 ${textSize === 'large' ? 'text-lg' : 'text-base'}`}>
                  No patient summary available. Patient has not completed intake yet.
                </p>
              )}
            </div>

            <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${cardPaddingClass}`}>
              <h3 className={`font-bold text-gray-900 mb-4 ${textSize === 'large' ? 'text-2xl' : 'text-xl'}`}>
                Recent Timeline
              </h3>
              <div className="space-y-3">
                {trends.slice(-5).reverse().map((entry, index) => (
                  <div key={index} className="flex items-center justify-between border-l-4 border-blue-600 pl-4 py-2">
                    <div>
                      <p className={`font-medium text-gray-900 ${textSize === 'large' ? 'text-lg' : 'text-base'}`}>
                        {new Date(entry.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="flex gap-4">
                      <div className="text-center">
                        <p className={`text-gray-600 ${textSize === 'large' ? 'text-sm' : 'text-xs'}`}>Pain</p>
                        <p className={`font-bold text-red-600 ${textSize === 'large' ? 'text-lg' : 'text-base'}`}>
                          {entry.painLevel}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className={`text-gray-600 ${textSize === 'large' ? 'text-sm' : 'text-xs'}`}>Wellbeing</p>
                        <p className={`font-bold text-blue-600 ${textSize === 'large' ? 'text-lg' : 'text-base'}`}>
                          {entry.wellbeing}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className={`text-gray-600 ${textSize === 'large' ? 'text-sm' : 'text-xs'}`}>Sleep</p>
                        <p className={`font-bold text-green-600 ${textSize === 'large' ? 'text-lg' : 'text-base'}`}>
                          {entry.sleepHours}h
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => navigate('/doctor/session')}
                className={`flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors ${buttonSizeClass}`}
              >
                Start session
                <ArrowRight className={textSize === 'large' ? 'w-6 h-6' : 'w-5 h-5'} />
              </button>
              <button
                onClick={() => navigate('/doctor/soap')}
                className={`flex items-center justify-center gap-2 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors ${buttonSizeClass}`}
              >
                Go to SOAP
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};
