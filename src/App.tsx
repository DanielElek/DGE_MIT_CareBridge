import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './AppContext';
import { Complaint } from './pages/patient/Complaint';
import { Summary } from './pages/patient/Summary';
import { Trends } from './pages/patient/Trends';
import { Documents } from './pages/patient/Documents';
import { DocumentDetail } from './pages/patient/DocumentDetail';
import { Patient } from './pages/doctor/Patient';
import { Session } from './pages/doctor/Session';
import { SOAP } from './pages/doctor/SOAP';
import { Treatment } from './pages/doctor/Treatment';
import { Print } from './pages/Print';

function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/patient/complaint" replace />} />

          <Route path="/patient/complaint" element={<Complaint />} />
          <Route path="/patient/summary" element={<Summary />} />
          <Route path="/patient/trends" element={<Trends />} />
          <Route path="/patient/documents" element={<Documents />} />
          <Route path="/patient/documents/:docId" element={<DocumentDetail />} />

          <Route path="/doctor/patient" element={<Patient />} />
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
