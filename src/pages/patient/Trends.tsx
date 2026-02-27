import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../AppContext';
import { Layout } from '../../components/Layout';
import { ArrowLeft } from 'lucide-react';

export const Trends: React.FC = () => {
  const { trends, textSize } = useApp();
  const navigate = useNavigate();
  const [range, setRange] = useState<7 | 30 | 90>(7);

  const buttonSizeClass = textSize === 'large' ? 'px-8 py-4 text-lg min-h-[56px]' : 'px-6 py-3 text-base min-h-[48px]';
  const cardPaddingClass = textSize === 'large' ? 'p-8' : 'p-6';

  const displayedTrends = trends.slice(-Math.min(range, trends.length));

  const avgPain = (displayedTrends.reduce((sum, t) => sum + t.painLevel, 0) / displayedTrends.length).toFixed(1);
  const avgSleep = (displayedTrends.reduce((sum, t) => sum + t.sleepHours, 0) / displayedTrends.length).toFixed(1);

  const maxPain = Math.max(...displayedTrends.map(t => t.painLevel));
  const maxWellbeing = Math.max(...displayedTrends.map(t => t.wellbeing));

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className={`font-bold text-gray-900 ${textSize === 'large' ? 'text-3xl' : 'text-2xl'}`}>
            Your Trends
          </h2>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setRange(7)}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${textSize === 'large' ? 'text-base' : 'text-sm'} ${
                range === 7 ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              7 days
            </button>
            <button
              onClick={() => setRange(30)}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${textSize === 'large' ? 'text-base' : 'text-sm'} ${
                range === 30 ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              30 days
            </button>
            <button
              onClick={() => setRange(90)}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${textSize === 'large' ? 'text-base' : 'text-sm'} ${
                range === 90 ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              90 days
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${cardPaddingClass}`}>
            <p className={`text-gray-600 mb-1 ${textSize === 'large' ? 'text-base' : 'text-sm'}`}>
              Average Pain Level
            </p>
            <div className="flex items-baseline">
              <span className={`font-bold text-red-600 ${textSize === 'large' ? 'text-4xl' : 'text-3xl'}`}>
                {avgPain}
              </span>
              <span className={`text-gray-500 ml-2 ${textSize === 'large' ? 'text-lg' : 'text-base'}`}>
                /10
              </span>
            </div>
          </div>

          <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${cardPaddingClass}`}>
            <p className={`text-gray-600 mb-1 ${textSize === 'large' ? 'text-base' : 'text-sm'}`}>
              Average Sleep
            </p>
            <div className="flex items-baseline">
              <span className={`font-bold text-green-600 ${textSize === 'large' ? 'text-4xl' : 'text-3xl'}`}>
                {avgSleep}
              </span>
              <span className={`text-gray-500 ml-2 ${textSize === 'large' ? 'text-lg' : 'text-base'}`}>
                hours
              </span>
            </div>
          </div>
        </div>

        <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${cardPaddingClass} mb-6`}>
          <h3 className={`font-bold text-gray-900 mb-6 ${textSize === 'large' ? 'text-2xl' : 'text-xl'}`}>
            Pain Level Over Time
          </h3>
          <div className="relative h-64">
            <div className="absolute inset-0 flex items-end justify-between gap-2">
              {displayedTrends.map((trend, index) => {
                const height = (trend.painLevel / maxPain) * 100;
                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div className="w-full bg-red-100 rounded-t-lg relative group">
                      <div
                        className="w-full bg-red-500 rounded-t-lg transition-all hover:bg-red-600"
                        style={{ height: `${height * 2.4}px` }}
                      />
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {trend.painLevel}/10
                      </div>
                    </div>
                    <p className={`mt-2 text-gray-500 text-center ${textSize === 'large' ? 'text-sm' : 'text-xs'}`}>
                      {new Date(trend.date).getMonth() + 1}/{new Date(trend.date).getDate()}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex items-center justify-center mt-4">
            <div className={`text-gray-500 ${textSize === 'large' ? 'text-base' : 'text-sm'}`}>
              0 - 10 scale (higher is more pain)
            </div>
          </div>
        </div>

        <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${cardPaddingClass} mb-6`}>
          <h3 className={`font-bold text-gray-900 mb-6 ${textSize === 'large' ? 'text-2xl' : 'text-xl'}`}>
            Wellbeing Over Time
          </h3>
          <div className="relative h-64">
            <div className="absolute inset-0 flex items-end justify-between gap-2">
              {displayedTrends.map((trend, index) => {
                const height = (trend.wellbeing / maxWellbeing) * 100;
                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div className="w-full bg-blue-100 rounded-t-lg relative group">
                      <div
                        className="w-full bg-blue-500 rounded-t-lg transition-all hover:bg-blue-600"
                        style={{ height: `${height * 2.4}px` }}
                      />
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {trend.wellbeing}/10
                      </div>
                    </div>
                    <p className={`mt-2 text-gray-500 text-center ${textSize === 'large' ? 'text-sm' : 'text-xs'}`}>
                      {new Date(trend.date).getMonth() + 1}/{new Date(trend.date).getDate()}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex items-center justify-center mt-4">
            <div className={`text-gray-500 ${textSize === 'large' ? 'text-base' : 'text-sm'}`}>
              0 - 10 scale (higher is better)
            </div>
          </div>
        </div>

        <button
          onClick={() => navigate('/patient/summary')}
          className={`flex items-center justify-center gap-2 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors ${buttonSizeClass}`}
        >
          <ArrowLeft className={textSize === 'large' ? 'w-6 h-6' : 'w-5 h-5'} />
          Back to Summary
        </button>
      </div>
    </Layout>
  );
};
