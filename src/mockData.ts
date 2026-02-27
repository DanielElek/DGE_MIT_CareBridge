export const PATIENT_ID = 'DEMO-001';

export interface TrendEntry {
  date: string;
  painLevel: number;
  wellbeing: number;
  sleepHours: number;
}

export interface Document {
  docId: string;
  date: string;
  title: string;
  clinicalText: string;
  plainLanguageExplanation: string[];
  keyTakeaways: string[];
  questionsToAsk: string[];
  keyTerms: string[];
}

export interface SmartIntakeQuestion {
  id: string;
  question: string;
  type: 'yesno' | 'text' | 'scale' | 'choice';
  options?: string[];
}

export interface SmartIntakeAnswer {
  questionId: string;
  answer: string | number | boolean;
}

export interface PatientData {
  complaintText: string;
  smartIntakeQuestions: SmartIntakeQuestion[];
  smartIntakeAnswers: SmartIntakeAnswer[];
  enrichedComplaintText: string;
  summary: {
    bullets: string[];
    keyPositives: string[];
    keyNegatives: string[];
    onset: string;
    duration: string;
    painLevel: number;
    wellbeing: number;
    sleep: number;
  };
}

export interface DoctorSession {
  audioFileName: string;
  mockTranscript: string;
  completenessHints: {
    item: string;
    status: 'covered' | 'not-mentioned';
  }[];
  suggestedFollowUps: string[];
  keyTerms: string[];
  soap: {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
  };
}

const generateTrendData = (days: number): TrendEntry[] => {
  const entries: TrendEntry[] = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    // Create some realistic trends
    const basePain = 6;
    const painVariation = Math.sin(i * 0.2) * 2;
    const recoveryTrend = i / days * 3;

    entries.push({
      date: date.toISOString().split('T')[0],
      painLevel: Math.max(0, Math.min(10, Math.round(basePain + painVariation - recoveryTrend))),
      wellbeing: Math.max(0, Math.min(10, Math.round(5 + (recoveryTrend * 1.5) + (Math.random() - 0.5)))),
      sleepHours: Math.max(0, Math.min(12, Math.round(6 + (i > 60 ? 1 : 0) + (Math.random() - 0.5)))),
    });
  }

  return entries;
};

export const mockTrends: TrendEntry[] = generateTrendData(90);


export const mockDocuments: Document[] = [
  {
    docId: 'DOC-003',
    date: '2026-02-20',
    title: 'Outpatient Follow-up Note',
    clinicalText: `Patient presents for follow-up evaluation of chronic lumbar radiculopathy with associated L4-L5 disc herniation. Patient reports persistent paresthesias in the left lower extremity, particularly along the L5 dermatome distribution. Pain is exacerbated by prolonged sitting and Valsalva maneuvers. Negative straight leg raise test bilaterally. Deep tendon reflexes are 2+ and symmetric. Motor strength is 5/5 in all major muscle groups of lower extremities. Recommending continuation of current physical therapy regimen and NSAIDs for symptomatic relief. Patient to follow up in 4 weeks or sooner if symptoms worsen.`,
    plainLanguageExplanation: [
      'You came in for a check-up about your ongoing back pain that travels down your left leg',
      'The pain is caused by a disc in your lower back (between the L4 and L5 vertebrae) that is pressing on a nerve',
      'You mentioned tingling sensations in your left leg, especially when sitting for long periods or straining',
      'The doctor did physical tests that showed your reflexes and muscle strength are normal',
      'The recommendation is to continue your current physical therapy and anti-inflammatory medication'
    ],
    keyTakeaways: [
      'Your condition is stable with no signs of worsening',
      'Continue physical therapy and current medications',
      'Come back in 4 weeks or sooner if pain gets worse',
      'The numbness and tingling are expected with this condition'
    ],
    questionsToAsk: [
      'Are there any exercises I should avoid during physical therapy?',
      'How long should I expect to continue treatment?',
      'What warning signs should I watch for that would require immediate attention?'
    ],
    keyTerms: ['Radiculopathy', 'Disc herniation', 'Paresthesias', 'NSAIDs']
  },
  {
    docId: 'DOC-002',
    date: '2026-02-10',
    title: 'Lab Results Overview',
    clinicalText: `Comprehensive metabolic panel and lipid panel results reviewed. Glucose: 102 mg/dL (slightly elevated, pre-diabetic range). HbA1c: 5.9% (borderline). Total cholesterol: 215 mg/dL. LDL: 140 mg/dL (elevated). HDL: 45 mg/dL (suboptimal). Triglycerides: 150 mg/dL. Creatinine: 1.0 mg/dL (normal renal function). AST/ALT within normal limits. TSH: 2.1 mIU/L (euthyroid). Recommend dietary modifications to reduce simple carbohydrates and saturated fats. Consider initiating statin therapy if LDL remains elevated after 3 months of lifestyle modification. Patient counseled on importance of regular exercise and weight management.`,
    plainLanguageExplanation: [
      'Your blood work shows your blood sugar is slightly higher than normal, which puts you in the pre-diabetes range',
      'Your cholesterol levels are also elevated, particularly the "bad" cholesterol (LDL)',
      'Your kidney and liver function tests are normal, and your thyroid is working properly',
      'The doctor recommends eating less sugar and saturated fats, and exercising more',
      'If your cholesterol does not improve with diet changes in 3 months, you may need to start cholesterol medication'
    ],
    keyTakeaways: [
      'You are at risk for diabetes and heart disease, but can improve with lifestyle changes',
      'Focus on diet and exercise for the next 3 months',
      'Your kidneys, liver, and thyroid are healthy',
      'Follow-up in 3 months to recheck cholesterol and blood sugar'
    ],
    questionsToAsk: [
      'What specific foods should I eat more of or avoid?',
      'How much exercise do I need each week?',
      'Should I check my blood sugar at home?'
    ],
    keyTerms: ['Pre-diabetic', 'HbA1c', 'LDL cholesterol', 'Statin therapy', 'Metabolic panel']
  },
  {
    docId: 'DOC-001',
    date: '2026-01-15',
    title: 'Discharge Summary',
    clinicalText: `Patient admitted with acute exacerbation of chronic obstructive pulmonary disease (COPD). Presented with dyspnea, productive cough with purulent sputum, and hypoxemia (O2 saturation 88% on room air). Chest X-ray revealed bilateral lower lobe infiltrates consistent with bronchopneumonia. Treatment included supplemental oxygen via nasal cannula, nebulized bronchodilators (albuterol and ipratropium), systemic corticosteroids (prednisone 40mg daily), and empiric antibiotic therapy (azithromycin). Patient's respiratory status improved significantly over 72 hours. Discharged on hospital day 4 with O2 saturation 95% on room air. Discharge medications include prednisone taper, completion of azithromycin course, and maintenance inhalers. Patient instructed on proper inhaler technique and smoking cessation resources provided.`,
    plainLanguageExplanation: [
      'You were admitted to the hospital because your chronic lung disease (COPD) got worse suddenly',
      'You had trouble breathing, a cough with thick mucus, and low oxygen levels',
      'An X-ray showed you had a lung infection in both lower parts of your lungs',
      'You were treated with oxygen, breathing treatments, steroids, and antibiotics',
      'After 3 days, your breathing improved enough to go home with medications'
    ],
    keyTakeaways: [
      'Your COPD flare-up was successfully treated',
      'Continue all prescribed medications as directed',
      'Use your inhalers correctly (ask for demonstration if unsure)',
      'Quitting smoking is the most important thing you can do for your lungs'
    ],
    questionsToAsk: [
      'What should I do if I start having trouble breathing again?',
      'How can I tell if my oxygen levels are too low at home?',
      'What resources are available to help me quit smoking?'
    ],
    keyTerms: ['COPD', 'Bronchopneumonia', 'Bronchodilators', 'Corticosteroids', 'Hypoxemia']
  }
];

export const mockDoctorSession: DoctorSession = {
  audioFileName: 'session_demo001_20260227.mp3',
  mockTranscript: `Doctor: Good morning! How have you been feeling since your last visit?

Patient: Morning, doctor. I've been doing a bit better actually. The back pain is still there, but it's not as sharp as it was.

Doctor: That's good to hear. On a scale of 0 to 10, where would you rate your pain today?

Patient: Maybe around a 3 or 4. Some days it's better than others.

Doctor: And are you still experiencing the tingling sensation down your left leg?

Patient: Yes, especially when I sit for too long. I've been trying to take more breaks like you suggested.

Doctor: Excellent. That's exactly what we want. How about your sleep? Are you getting enough rest?

Patient: Much better now. I'm getting about 7 or 8 hours most nights. The new pillow really helped.

Doctor: Great. And your mood? How have you been feeling emotionally?

Patient: Pretty good. Less stressed now that the pain is manageable.

Doctor: Any new symptoms I should know about? Numbness, weakness, or bladder problems?

Patient: No, nothing like that.

Doctor: Good. Let's continue with your current treatment plan. Keep up with the physical therapy and take your medications as prescribed.`,
  completenessHints: [
    { item: 'Chief complaint addressed', status: 'covered' },
    { item: 'Pain assessment documented', status: 'covered' },
    { item: 'Neurological symptoms reviewed', status: 'covered' },
    { item: 'Sleep quality assessed', status: 'covered' },
    { item: 'Red flag symptoms ruled out', status: 'covered' },
    { item: 'Medication adherence discussed', status: 'not-mentioned' }
  ],
  suggestedFollowUps: [
    'Ask about specific physical therapy exercises being performed',
    'Clarify frequency and dosage of current medications',
    'Discuss any side effects from current medications',
    'Explore barriers to medication adherence if any',
    'Set specific measurable goals for next visit'
  ],
  keyTerms: ['Back pain', 'Radiculopathy', 'Sleep quality', 'Physical therapy', 'Pain scale'],
  soap: {
    subjective: `Patient reports improvement in chronic lower back pain with radiation to left lower extremity. Current pain level 3-4/10, down from previous visits. Paresthesias persist with prolonged sitting but improved with position changes and activity modification. Sleep quality has improved significantly, now averaging 7-8 hours nightly. Patient reports better emotional well-being and decreased stress levels. Denies any new onset of numbness, weakness, or bladder/bowel dysfunction.`,
    objective: `Patient appears comfortable and in no acute distress. Vital signs stable. Ambulation steady without assistive device. Lumbar range of motion mildly limited by discomfort. Straight leg raise test negative bilaterally. Lower extremity motor strength 5/5 throughout. Sensation intact to light touch. Deep tendon reflexes 2+ and symmetric at knees and ankles.`,
    assessment: `Chronic lumbar radiculopathy with L4-L5 disc herniation, improving. Patient showing positive response to conservative management with physical therapy and NSAIDs. No evidence of progressive neurological deficit or cauda equina syndrome.`,
    plan: `Continue current physical therapy regimen 2-3 times weekly. Maintain NSAIDs as needed for pain management. Patient to continue activity modification with regular position changes during prolonged sitting. Encourage continuation of improved sleep hygiene practices. Follow-up in 4 weeks to reassess progress. Patient instructed to return sooner if experiencing increased pain, new weakness, or bowel/bladder symptoms. Patient understands and agrees with plan.`
  }
};

export const generateSmartIntakeQuestions = (complaint: string): SmartIntakeQuestion[] => {
  const questions: SmartIntakeQuestion[] = [];
  const lowerComplaint = complaint.toLowerCase();

  questions.push({
    id: 'onset',
    question: 'When did this start?',
    type: 'text'
  });

  if (lowerComplaint.includes('pain') || lowerComplaint.includes('ache') || lowerComplaint.includes('hurt')) {
    questions.push({
      id: 'pain_scale',
      question: 'On a scale of 0-10, how bad is your pain right now?',
      type: 'scale'
    });
  }

  if (lowerComplaint.includes('headache') || lowerComplaint.includes('head')) {
    questions.push({
      id: 'nausea',
      question: 'Are you experiencing any nausea or vomiting?',
      type: 'yesno'
    });
    questions.push({
      id: 'vision',
      question: 'Have you noticed any vision changes or sensitivity to light?',
      type: 'yesno'
    });
  }

  if (lowerComplaint.includes('cough') || lowerComplaint.includes('throat')) {
    questions.push({
      id: 'fever',
      question: 'Have you had a fever?',
      type: 'yesno'
    });
    questions.push({
      id: 'breathing',
      question: 'Do you have any shortness of breath or chest pain?',
      type: 'yesno'
    });
  }

  if (lowerComplaint.includes('stomach') || lowerComplaint.includes('nausea') || lowerComplaint.includes('belly')) {
    questions.push({
      id: 'vomiting',
      question: 'Have you been vomiting?',
      type: 'yesno'
    });
    questions.push({
      id: 'diarrhea',
      question: 'Do you have diarrhea?',
      type: 'yesno'
    });
  }

  if (lowerComplaint.includes('back') || lowerComplaint.includes('leg')) {
    questions.push({
      id: 'numbness',
      question: 'Do you have any numbness or tingling?',
      type: 'yesno'
    });
    questions.push({
      id: 'weakness',
      question: 'Have you noticed any weakness in your legs?',
      type: 'yesno'
    });
  }

  return questions.slice(0, 5);
};

export const generateEnrichedComplaint = (
  complaint: string,
  questions: SmartIntakeQuestion[],
  answers: SmartIntakeAnswer[]
): string => {
  let enriched = complaint + ' ';

  answers.forEach((answer) => {
    const question = questions.find(q => q.id === answer.questionId);
    if (!question) return;

    if (question.type === 'yesno') {
      const response = answer.answer ? 'Yes' : 'No';
      enriched += `${question.question} ${response}. `;
    } else if (question.type === 'scale') {
      enriched += `${question.question} ${answer.answer}/10. `;
    } else {
      enriched += `${question.question} ${answer.answer}. `;
    }
  });

  return enriched.trim();
};

export const generatePatientSummary = (enrichedComplaint: string, answers: SmartIntakeAnswer[]) => {
  const painAnswer = answers.find(a => a.questionId === 'pain_scale');
  const onsetAnswer = answers.find(a => a.questionId === 'onset');

  return {
    bullets: [
      'Patient reports chronic lower back pain with radiation to left leg',
      'Pain is worse with prolonged sitting and improves with movement',
      'Currently experiencing tingling sensation in left lower extremity',
      'Sleep has improved with new pillow and positioning',
      'Overall well-being has improved with pain management'
    ],
    keyPositives: [
      'Chronic back pain',
      'Left leg tingling',
      'Pain with sitting',
      'Improves with movement'
    ],
    keyNegatives: [
      'No leg weakness',
      'No bladder problems',
      'No fever',
      'No recent injury'
    ],
    onset: onsetAnswer ? String(onsetAnswer.answer) : '3 weeks ago',
    duration: 'Ongoing for several weeks',
    painLevel: painAnswer ? Number(painAnswer.answer) : 4,
    wellbeing: 8,
    sleep: 7
  };
};
