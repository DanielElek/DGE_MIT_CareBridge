import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import {
  PatientData,
  SmartIntakeQuestion,
  SmartIntakeAnswer,
  mockTrends,
  mockDocuments,
  mockDoctorSession,
  generateSmartIntakeQuestions,
  generateEnrichedComplaint,
  generatePatientSummary,
  PATIENT_ID
} from './mockData';

type Role = 'patient' | 'doctor';
type TextSize = 'normal' | 'large';
type ThemeColor = 'blue' | 'teal' | 'indigo' | 'slate';

interface AppContextType {
  role: Role;
  setRole: (role: Role) => void;
  textSize: TextSize;
  setTextSize: (size: TextSize) => void;
  themeColor: ThemeColor;
  setThemeColor: (color: ThemeColor) => void;
  patientData: PatientData | null;
  setPatientData: (data: PatientData | null) => void;
  updateComplaint: (complaint: string) => void;
  submitSmartIntake: (answers: SmartIntakeAnswer[]) => void;
  trends: typeof mockTrends;
  documents: typeof mockDocuments;
  doctorSession: typeof mockDoctorSession;
  updateSOAP: (soap: typeof mockDoctorSession.soap) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<Role>('patient');
  const [textSize, setTextSize] = useState<TextSize>('normal');
  const [themeColor, setThemeColor] = useState<ThemeColor>('blue');
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [sessionData, setSessionData] = useState(mockDoctorSession);

  // Apply text size to root element for global scaling
  useEffect(() => {
    const root = document.documentElement;
    if (textSize === 'large') {
      root.style.fontSize = '115%';
    } else {
      root.style.fontSize = '100%';
    }
  }, [textSize]);

  const updateComplaint = (complaint: string) => {
    const questions = generateSmartIntakeQuestions(complaint);
    setPatientData({
      complaintText: complaint,
      smartIntakeQuestions: questions,
      smartIntakeAnswers: [],
      enrichedComplaintText: '',
      summary: {
        bullets: [],
        keyPositives: [],
        keyNegatives: [],
        onset: '',
        duration: '',
        painLevel: 0,
        wellbeing: 0,
        sleep: 0
      }
    });
  };

  const submitSmartIntake = (answers: SmartIntakeAnswer[]) => {
    if (!patientData) return;

    const enriched = generateEnrichedComplaint(
      patientData.complaintText,
      patientData.smartIntakeQuestions,
      answers
    );

    const summary = generatePatientSummary(enriched, answers);

    setPatientData({
      ...patientData,
      smartIntakeAnswers: answers,
      enrichedComplaintText: enriched,
      summary
    });
  };

  const updateSOAP = (soap: typeof mockDoctorSession.soap) => {
    setSessionData({
      ...sessionData,
      soap
    });
  };

  return (
    <AppContext.Provider
      value={{
        role,
        setRole,
        textSize,
        setTextSize,
        themeColor,
        setThemeColor,
        patientData,
        setPatientData,
        updateComplaint,
        submitSmartIntake,
        trends: mockTrends,
        documents: mockDocuments,
        doctorSession: sessionData,
        updateSOAP
      }}
    >
      <div className={`theme-${themeColor}`}>
        {children}
      </div>
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

