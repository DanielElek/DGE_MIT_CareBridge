import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../AppContext';
import { Heart } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  hideHeader?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, hideHeader = false }) => {
  const { role, setRole, textSize, setTextSize } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const handleRoleSwitch = (newRole: 'patient' | 'doctor') => {
    setRole(newRole);
    if (newRole === 'patient') {
      navigate('/patient/complaint');
    } else {
      navigate('/doctor/patient');
    }
  };

  const isPatientRoute = location.pathname.startsWith('/patient');
  const isDoctorRoute = location.pathname.startsWith('/doctor');

  const textSizeClass = textSize === 'large' ? 'text-lg' : 'text-base';
  const headingSizeClass = textSize === 'large' ? 'text-3xl' : 'text-2xl';
  const buttonSizeClass = textSize === 'large' ? 'px-8 py-4 text-lg' : 'px-6 py-3 text-base';

  return (
    <div className={`min-h-screen flex flex-col bg-gray-50 ${textSizeClass}`}>
      {!hideHeader && (
        <>
          <header className="bg-white border-b border-gray-200 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center space-x-3">
                  <Heart className="w-8 h-8 text-blue-600" />
                  <h1 className={`font-bold text-blue-600 ${textSize === 'large' ? 'text-2xl' : 'text-xl'}`}>
                    CareBridge
                  </h1>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => handleRoleSwitch('patient')}
                      className={`px-4 py-2 rounded-md font-medium transition-colors ${textSize === 'large' ? 'text-base' : 'text-sm'} ${
                        role === 'patient'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Patient
                    </button>
                    <button
                      onClick={() => handleRoleSwitch('doctor')}
                      className={`px-4 py-2 rounded-md font-medium transition-colors ${textSize === 'large' ? 'text-base' : 'text-sm'} ${
                        role === 'doctor'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Doctor
                    </button>
                  </div>

                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setTextSize('normal')}
                      className={`px-4 py-2 rounded-md font-medium transition-colors ${textSize === 'large' ? 'text-base' : 'text-sm'} ${
                        textSize === 'normal'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Normal
                    </button>
                    <button
                      onClick={() => setTextSize('large')}
                      className={`px-4 py-2 rounded-md font-medium transition-colors ${textSize === 'large' ? 'text-base' : 'text-sm'} ${
                        textSize === 'large'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Large
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {(isPatientRoute || isDoctorRoute) && (
            <nav className="bg-white border-b border-gray-200">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex space-x-1 py-2">
                  {role === 'patient' ? (
                    <>
                      <Link
                        to="/patient/complaint"
                        className={`px-4 py-2 rounded-md font-medium transition-colors ${textSize === 'large' ? 'text-base min-h-[48px] flex items-center' : 'text-sm'} ${
                          location.pathname === '/patient/complaint'
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        Complaint
                      </Link>
                      <Link
                        to="/patient/summary"
                        className={`px-4 py-2 rounded-md font-medium transition-colors ${textSize === 'large' ? 'text-base min-h-[48px] flex items-center' : 'text-sm'} ${
                          location.pathname === '/patient/summary'
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        Summary
                      </Link>
                      <Link
                        to="/patient/trends"
                        className={`px-4 py-2 rounded-md font-medium transition-colors ${textSize === 'large' ? 'text-base min-h-[48px] flex items-center' : 'text-sm'} ${
                          location.pathname === '/patient/trends'
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        Trends
                      </Link>
                      <Link
                        to="/patient/documents"
                        className={`px-4 py-2 rounded-md font-medium transition-colors ${textSize === 'large' ? 'text-base min-h-[48px] flex items-center' : 'text-sm'} ${
                          location.pathname.startsWith('/patient/documents')
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        Documents
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/doctor/patient"
                        className={`px-4 py-2 rounded-md font-medium transition-colors ${textSize === 'large' ? 'text-base min-h-[48px] flex items-center' : 'text-sm'} ${
                          location.pathname === '/doctor/patient'
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        Patient
                      </Link>
                      <Link
                        to="/doctor/session"
                        className={`px-4 py-2 rounded-md font-medium transition-colors ${textSize === 'large' ? 'text-base min-h-[48px] flex items-center' : 'text-sm'} ${
                          location.pathname === '/doctor/session'
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        Session
                      </Link>
                      <Link
                        to="/doctor/soap"
                        className={`px-4 py-2 rounded-md font-medium transition-colors ${textSize === 'large' ? 'text-base min-h-[48px] flex items-center' : 'text-sm'} ${
                          location.pathname === '/doctor/soap'
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        SOAP
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </nav>
          )}
        </>
      )}

      <main className="flex-1">
        {children}
      </main>

      {!hideHeader && (
        <footer className="bg-white border-t border-gray-200 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <p className={`text-center text-gray-500 ${textSize === 'large' ? 'text-base' : 'text-sm'}`}>
              Not medical advice. Discuss with your clinician.
            </p>
          </div>
        </footer>
      )}
    </div>
  );
};
