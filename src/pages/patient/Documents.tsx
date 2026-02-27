import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../AppContext';
import { Layout } from '../../components/Layout';
import { FileText, ChevronRight } from 'lucide-react';

export const Documents: React.FC = () => {
  const { documents, textSize } = useApp();
  const navigate = useNavigate();

  const cardPaddingClass = textSize === 'large' ? 'p-8' : 'p-6';

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h2 className={`font-bold text-gray-900 mb-6 ${textSize === 'large' ? 'text-3xl' : 'text-2xl'}`}>
          My Medical Documents
        </h2>

        <div className="space-y-4">
          {documents.map((doc) => (
            <div
              key={doc.docId}
              className={`bg-white rounded-lg shadow-sm border border-gray-200 ${cardPaddingClass} hover:shadow-md transition-shadow cursor-pointer`}
              onClick={() => navigate(`/patient/documents/${doc.docId}`)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <FileText className={`text-blue-600 flex-shrink-0 ${textSize === 'large' ? 'w-8 h-8 mt-1' : 'w-6 h-6 mt-1'}`} />
                  <div className="flex-1">
                    <h3 className={`font-bold text-gray-900 mb-2 ${textSize === 'large' ? 'text-2xl' : 'text-xl'}`}>
                      {doc.title}
                    </h3>
                    <p className={`text-gray-600 ${textSize === 'large' ? 'text-base' : 'text-sm'}`}>
                      {new Date(doc.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                <ChevronRight className={`text-gray-400 flex-shrink-0 ${textSize === 'large' ? 'w-8 h-8' : 'w-6 h-6'}`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};
