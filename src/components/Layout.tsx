import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../AppContext';
import { Heart, Settings, User, Stethoscope, Check, Monitor, LayoutGrid, FileText, Activity } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  hideHeader?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, hideHeader = false }) => {
  const { role, setRole, textSize, setTextSize, themeColor, setThemeColor } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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

  const themes: { name: string; color: any; value: any }[] = [
    { name: 'Medical Blue', color: '#3b82f6', value: 'blue' },
    { name: 'Healing Teal', color: '#0d9488', value: 'teal' },
    { name: 'Royal Indigo', color: '#6366f1', value: 'indigo' },
    { name: 'Deep Slate', color: '#475569', value: 'slate' },
  ];

  return (
    <div className={`min-h-screen flex flex-col bg-slate-50 overflow-x-hidden`}>
      {!hideHeader && (
        <header className="glass-header shadow-sm px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-200">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-800">CareBridge</h1>
              <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600 leading-none">AI Health Companion</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex bg-slate-100/80 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => handleRoleSwitch('patient')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${role === 'patient'
                  ? 'bg-white text-blue-600 shadow-md'
                  : 'text-slate-500 hover:text-slate-800'
                  }`}
              >
                <User className="w-4 h-4" />
                Patient View
              </button>
              <button
                onClick={() => handleRoleSwitch('doctor')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${role === 'doctor'
                  ? 'bg-white text-blue-600 shadow-md'
                  : 'text-slate-500 hover:text-slate-800'
                  }`}
              >
                <Stethoscope className="w-4 h-4" />
                Doctor View
              </button>
            </div>

            <div className="relative">
              <button
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
              >
                <Settings className="w-5 h-5" />
              </button>

              {isSettingsOpen && (
                <div className="absolute right-0 mt-3 w-72 glass-card p-4 animate-slide-up z-[100] border-slate-200">
                  <div className="mb-6">
                    <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider">Appearance</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setTextSize('normal')}
                        className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${textSize === 'normal' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600'
                          }`}
                      >
                        <span className="text-xs font-bold uppercase">Abc</span>
                        <span className="text-[10px]">Normal Text</span>
                      </button>
                      <button
                        onClick={() => setTextSize('large')}
                        className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${textSize === 'large' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600'
                          }`}
                      >
                        <span className="text-lg font-bold uppercase leading-none">Abc</span>
                        <span className="text-[10px]">Large Text</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider">Theme Color</h3>
                    <div className="flex flex-wrap gap-3">
                      {themes.map((t) => (
                        <button
                          key={t.value}
                          onClick={() => setThemeColor(t.value as any)}
                          className={`w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center ${themeColor === t.value ? 'border-slate-800 scale-110' : 'border-transparent'
                            }`}
                          style={{ backgroundColor: t.color }}
                          title={t.name}
                        >
                          {themeColor === t.value && <Check className="w-4 h-4 text-white" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>
      )}

      <div className="flex-1 flex flex-col md:flex-row w-full overflow-hidden">
        {!hideHeader && isPatientRoute && (
          <aside className="w-full md:w-64 p-6 shrink-0 border-r border-slate-100 bg-white/30">
            <nav className="space-y-1 sticky top-24">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 px-4 opacity-70">Patient Portal</div>
              <NavLink to="/patient/complaint" icon={<Monitor className="w-5 h-5" />} label="New Intake" active={location.pathname === '/patient/complaint'} themeColor={themeColor} />
              <NavLink to="/patient/summary" icon={<LayoutGrid className="w-5 h-5" />} label="My Summary" active={location.pathname === '/patient/summary'} themeColor={themeColor} />
              <NavLink to="/patient/trends" icon={<Activity className="w-5 h-5" />} label="Health Trends" active={location.pathname === '/patient/trends'} themeColor={themeColor} />
              <NavLink to="/patient/documents" icon={<FileText className="w-5 h-5" />} label="Records" active={location.pathname.startsWith('/patient/documents')} themeColor={themeColor} />
            </nav>
          </aside>
        )}

        <main className={`flex-1 overflow-y-auto animate-slide-up ${isDoctorRoute ? 'p-0' : 'p-6 md:p-8'}`}>
          <div className={`${isDoctorRoute ? 'max-w-none' : 'max-w-4xl'} mx-auto w-full h-full`}>
            {children}
          </div>
        </main>
      </div>

      {!hideHeader && (
        <footer className="px-6 py-6 border-t border-slate-200 bg-white/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-100 rounded-full">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
              <p className="text-xs font-bold text-amber-800">
                Not medical advice. Discuss with your clinician.
              </p>
            </div>
            <div className="text-xs text-slate-400 font-medium">
              &copy; 2026 CareBridge Demo • Built with Local AI
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

const NavLink: React.FC<{ to: string; icon: React.ReactNode; label: string; active: boolean; themeColor: string }> = ({ to, icon, label, active, themeColor }) => {
  const colorMap = {
    blue: 'bg-blue-600 shadow-blue-200',
    teal: 'bg-teal-600 shadow-teal-200',
    indigo: 'bg-indigo-600 shadow-indigo-200',
    slate: 'bg-slate-700 shadow-slate-200'
  };

  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all duration-300 ${active
        ? `${colorMap[themeColor as keyof typeof colorMap] || colorMap.blue} text-white shadow-lg`
        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
        }`}
    >
      <div className={active ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}>
        {icon}
      </div>
      <span>{label}</span>
    </Link>
  );
};

