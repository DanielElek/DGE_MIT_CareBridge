import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './AppContext';
import { FEATURES } from './config/features';
import { Complaint } from './pages/patient/Complaint';
import { Summary } from './pages/patient/Summary';
import { Trends } from './pages/patient/Trends';
import { Documents } from './pages/patient/Documents';
import { DocumentDetail } from './pages/patient/DocumentDetail';
import { Patient } from './pages/doctor/Patient';
import { PatientPicker } from './pages/doctor/PatientPicker';
import { Session } from './pages/doctor/Session';
import { SOAP } from './pages/doctor/SOAP';
import { Treatment } from './pages/doctor/Treatment';
import { Print } from './pages/Print';

import { Landing } from './pages/Landing';

function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Routes>
          <Route path="/" element={<Landing />} />

          {/* Patient Routes - Gated by feature flag */}
          <Route path="/patient/complaint" element={FEATURES.patientPortal ? <Complaint /> : <Navigate to="/doctor/patient" replace />} />
          <Route path="/patient/summary" element={FEATURES.patientPortal ? <Summary /> : <Navigate to="/doctor/patient" replace />} />
          <Route path="/patient/trends" element={FEATURES.patientPortal ? <Trends /> : <Navigate to="/doctor/patient" replace />} />
          <Route path="/patient/documents" element={FEATURES.patientPortal ? <Documents /> : <Navigate to="/doctor/patient" replace />} />
          <Route path="/patient/documents/:docId" element={FEATURES.patientPortal ? <DocumentDetail /> : <Navigate to="/doctor/patient" replace />} />

          <Route path="/doctor/patient" element={<PatientPicker />} />
          <Route path="/doctor/dashboard" element={<Patient />} />
          <Route path="/doctor/treatment" element={<Treatment />} />
          <Route path="/doctor/session" element={<Session />} />
          <Route path="/doctor/soap" element={<SOAP />} />

          <Route path="/print" element={<Print />} />
        </Routes>
      </AppProvider>
    </BrowserRouter>
  );
}

export default App;
