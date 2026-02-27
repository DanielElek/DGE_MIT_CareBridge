import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../AppContext';
import { Layout } from '../../components/Layout';
import { ArrowLeft, Sparkles, Copy, Printer, CheckCircle2 } from 'lucide-react';

export const DocumentDetail: React.FC = () => {
  const { docId } = useParams<{ docId: string }>();
  const { documents, textSize } = useApp();
  const navigate = useNavigate();
  const [showExplanation, setShowExplanation] = useState(false);
  const [isExplaining, setIsExplaining] = useState(false);
  const [copied, setCopied] = useState(false);

  const document = documents.find(d => d.docId === docId);

  const buttonSizeClass = textSize === 'large' ? 'px-8 py-4 text-lg min-h-[56px]' : 'px-6 py-3 text-base min-h-[48px]';
  const cardPaddingClass = textSize === 'large' ? 'p-8' : 'p-6';

  if (!document) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <p className={`text-text-muted ${textSize === 'large' ? 'text-lg' : 'text-base'}`}>
            Document not found
          </p>
        </div>
      </Layout>
    );
  }

  const handleExplain = async () => {
    setIsExplaining(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsExplaining(false);
    setShowExplanation(true);
  };

  const handleCopy = () => {
    const text = `Plain-language explanation:\n\n${document.plainLanguageExplanation.join('\n\n')}\n\nKey takeaways:\n\n${document.keyTakeaways.join('\n')}\n\nQuestions to ask your clinician:\n\n${document.questionsToAsk.join('\n')}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    navigate(`/print?type=documentExplanation&docId=${docId}`);
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/patient/documents')}
          className={`flex items-center gap-2 text-primary hover:text-accent-600 transition-colors mb-6 ${textSize === 'large' ? 'text-lg' : 'text-base'}`}
        >
          <ArrowLeft className={textSize === 'large' ? 'w-6 h-6' : 'w-5 h-5'} />
          Back to documents
        </button>

        <div className="space-y-6">
          <div className={`bg-white rounded-lg shadow-sm border border-border ${cardPaddingClass}`}>
            <h2 className={`font-bold text-text-strong mb-2 ${textSize === 'large' ? 'text-3xl' : 'text-2xl'}`}>
              {document.title}
            </h2>
            <p className={`text-text-muted mb-6 ${textSize === 'large' ? 'text-base' : 'text-sm'}`}>
              {new Date(document.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>

            <h3 className={`font-bold text-text-strong mb-4 ${textSize === 'large' ? 'text-2xl' : 'text-xl'}`}>
              Clinical wording
            </h3>
            <div className={`bg-surface-muted rounded-lg p-6 border border-border ${textSize === 'large' ? 'text-lg leading-relaxed' : 'text-base leading-relaxed'}`}>
              <p className="text-text whitespace-pre-line">
                {document.clinicalText}
              </p>
            </div>
          </div>

          {!showExplanation && (
            <button
              onClick={handleExplain}
              disabled={isExplaining}
              className={`w-full flex items-center justify-center gap-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-900 transition-colors disabled:opacity-50 shadow-lg shadow-primary/20 ${buttonSizeClass}`}
            >
              {isExplaining ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Explaining...
                </>
              ) : (
                <>
                  <Sparkles className={textSize === 'large' ? 'w-6 h-6' : 'w-5 h-5'} />
                  Explain in plain language
                </>
              )}
            </button>
          )}

          {showExplanation && (
            <>
              <div className={`bg-accent-500/5 rounded-lg border border-accent-500/10 ${cardPaddingClass}`}>
                <h3 className={`font-bold text-primary mb-4 ${textSize === 'large' ? 'text-2xl' : 'text-xl'}`}>
                  Plain-language explanation
                </h3>
                <ul className={`space-y-3 mb-6 ${textSize === 'large' ? 'text-lg leading-relaxed' : 'text-base leading-relaxed'}`}>
                  {document.plainLanguageExplanation.map((item, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-accent-500 mr-3 mt-1">•</span>
                      <span className="text-text">{item}</span>
                    </li>
                  ))}
                </ul>

                <h4 className={`font-bold text-primary mb-3 ${textSize === 'large' ? 'text-xl' : 'text-lg'}`}>
                  Key takeaways
                </h4>
                <ul className={`space-y-2 mb-6 ${textSize === 'large' ? 'text-lg leading-relaxed' : 'text-base leading-relaxed'}`}>
                  {document.keyTakeaways.map((item, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle2 className={`text-accent-500 mr-3 flex-shrink-0 ${textSize === 'large' ? 'w-6 h-6 mt-0.5' : 'w-5 h-5 mt-0.5'}`} />
                      <span className="text-text">{item}</span>
                    </li>
                  ))}
                </ul>

                <h4 className={`font-bold text-primary mb-3 ${textSize === 'large' ? 'text-xl' : 'text-lg'}`}>
                  Questions to ask your clinician
                </h4>
                <ul className={`space-y-2 ${textSize === 'large' ? 'text-lg leading-relaxed' : 'text-base leading-relaxed'}`}>
                  {document.questionsToAsk.map((item, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-accent-500 mr-3 mt-1">?</span>
                      <span className="text-text">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className={`bg-surface-muted rounded-lg border border-border ${cardPaddingClass}`}>
                <h4 className={`font-bold text-text-strong mb-3 ${textSize === 'large' ? 'text-xl' : 'text-lg'}`}>
                  Key medical terms
                </h4>
                <div className="flex flex-wrap gap-2">
                  {document.keyTerms.map((term, index) => (
                    <span
                      key={index}
                      className={`inline-block bg-white border-2 border-border text-text rounded-full px-4 py-2 font-medium ${textSize === 'large' ? 'text-base' : 'text-sm'}`}
                    >
                      {term}
                    </span>
                  ))}
                </div>
              </div>

              <div className={`bg-warning/10 rounded-lg border border-warning/20 ${cardPaddingClass}`}>
                <p className={`text-warning-800 font-medium ${textSize === 'large' ? 'text-lg' : 'text-base'}`}>
                  Not medical advice. Discuss with your clinician.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleCopy}
                  className={`flex items-center justify-center gap-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-900 transition-colors shadow-lg shadow-primary/20 ${buttonSizeClass}`}
                >
                  <Copy className={textSize === 'large' ? 'w-6 h-6' : 'w-5 h-5'} />
                  {copied ? 'Copied!' : 'Copy explanation'}
                </button>
                <button
                  onClick={handlePrint}
                  className={`flex items-center justify-center gap-2 bg-white border-2 border-border text-text-muted rounded-lg font-medium hover:bg-surface-muted hover:text-text-strong transition-colors ${buttonSizeClass}`}
                >
                  <Printer className={textSize === 'large' ? 'w-6 h-6' : 'w-5 h-5'} />
                  Print
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};
