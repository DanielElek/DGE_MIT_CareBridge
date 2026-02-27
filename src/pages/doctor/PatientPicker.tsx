import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../AppContext';
import { Layout } from '../../components/Layout';
import { Search, User, Heart, ChevronRight, LogOut, Calendar } from 'lucide-react';
import { MOCK_CLINICAL_PATIENT } from '../../mockData';

interface Patient {
    code: string;
    name: string;
    dob: string;
    age: number;
    sex: string;
    scheduledDate: string;
    scheduledTime: string;
}

export const PatientPicker: React.FC = () => {
    const { setCurrentClinicalPatient } = useApp();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
    const [error, setError] = useState('');

    const allPatients: Patient[] = [
        { code: '1', name: 'Michael Oxlong', dob: '1958.05.12', age: 68, sex: 'Male', scheduledDate: '2026-02-28', scheduledTime: '09:00' },
        { code: '2', name: 'Sarah Miller', dob: '1982.11.24', age: 42, sex: 'Female', scheduledDate: '2026-02-28', scheduledTime: '10:30' },
        { code: '3', name: 'David Chen', dob: '1969-02-03', age: 55, sex: 'Male', scheduledDate: '2026-02-28', scheduledTime: '14:15' },
        { code: '4', name: 'Elena Rodriguez', dob: '1975.08.19', age: 48, sex: 'Female', scheduledDate: '2026-03-01', scheduledTime: '08:45' },
        { code: '5', name: 'James Wilson', dob: '1990.01.15', age: 34, sex: 'Male', scheduledDate: '2026-03-01', scheduledTime: '11:00' },
        { code: '6', name: 'Olivia Thompson', dob: '1962.12.01', age: 61, sex: 'Female', scheduledDate: '2026-03-01', scheduledTime: '15:30' },
    ];

    const todayDateStr = '2026-02-28';
    const tomorrowDateStr = '2026-03-01';

    const filteredPatients = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return allPatients;
        return allPatients.filter(p => p.name.toLowerCase().includes(query));
    }, [searchQuery, allPatients]);

    const todaysPatients = filteredPatients.filter(p => p.scheduledDate === todayDateStr);
    const tomorrowsPatients = filteredPatients.filter(p => p.scheduledDate === tomorrowDateStr);

    const handleLoad = () => {
        setError('');

        // If a patient is manually selected, load that one
        if (selectedPatientId) {
            const selected = allPatients.find(p => p.code === selectedPatientId);
            if (selected) {
                // In a real app, we'd fetch the full patient data by ID
                setCurrentClinicalPatient({
                    ...MOCK_CLINICAL_PATIENT,
                    code: selected.code,
                    name: selected.name,
                    age: selected.age,
                    sex: selected.sex as any,
                });
                navigate('/doctor/dashboard');
                return;
            }
        }

        // Search logic
        if (filteredPatients.length === 0) {
            setError('No patients found.');
        } else if (filteredPatients.length === 1) {
            const p = filteredPatients[0];
            setCurrentClinicalPatient({
                ...MOCK_CLINICAL_PATIENT,
                code: p.code,
                name: p.name,
                age: p.age,
                sex: p.sex as any,
            });
            navigate('/doctor/dashboard');
        } else {
            setError('Select a patient from the list.');
        }
    };

    const PatientCard = ({ patient }: { patient: Patient }) => {
        const isSelected = selectedPatientId === patient.code;
        return (
            <button
                key={patient.code}
                onClick={() => setSelectedPatientId(patient.code)}
                className={`w-full group p-5 rounded-3xl border transition-all text-left flex items-center gap-4 ${isSelected
                    ? 'bg-accent-500/5 border-accent-500 shadow-lg shadow-primary/5 -translate-x-1'
                    : 'bg-white border-border shadow-sm hover:shadow-xl hover:shadow-primary/5 hover:border-accent-500/20 hover:-translate-x-1'
                    }`}
            >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isSelected ? 'bg-primary text-white' : 'bg-surface-muted text-text-muted/50 group-hover:bg-accent-500/10 group-hover:text-primary'
                    }`}>
                    <User className="w-6 h-6" />
                </div>
                <div className="flex-1">
                    <h4 className="font-black text-text-strong tracking-tight text-lg leading-tight mb-1">{patient.name}</h4>
                    <p className="text-text-muted text-[11px] font-bold tracking-tight leading-none">{patient.dob}</p>
                </div>
                <ChevronRight className={`w-5 h-5 transition-colors ${isSelected ? 'text-accent-600' : 'text-border group-hover:text-accent-600'}`} />
            </button>
        );
    };

    return (
        <Layout hideHeader>
            <div className="min-h-screen bg-background flex flex-col">
                <header className="h-16 shrink-0 bg-white/90 border-b border-border flex items-center justify-between px-8 sticky top-0 z-[100] backdrop-blur-md">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary rounded-xl shadow-lg shadow-primary/20">
                            <Heart className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-black tracking-tighter text-text-strong leading-none">CareBridge</h1>
                            <p className="text-[8px] font-black uppercase tracking-widest text-accent-500 leading-tight">Clinical Portal</p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-text-muted hover:text-text-strong font-black text-[10px] uppercase tracking-widest transition-colors"
                    >
                        <LogOut className="w-4 h-4" /> Switch Role
                    </button>
                </header>

                <main className="flex-1 max-w-[1600px] w-full mx-auto px-8 py-10">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:items-start animate-slide-up">

                        {/* Column 1: Search */}
                        <div className="lg:col-span-4 space-y-8 lg:sticky lg:top-24">
                            <div>
                                <h2 className="text-5xl font-black text-text-strong tracking-tight leading-[0.9] mb-4">Patient Selection</h2>
                                <p className="text-text-muted font-medium text-lg leading-snug">Find and load a scheduled patient record for today's session.</p>
                            </div>

                            <div className="space-y-4">
                                <div className="glass-card p-2 border-border shadow-2xl shadow-primary/5">
                                    <div className="relative">
                                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-text-muted/50" />
                                        <input
                                            type="text"
                                            className="w-full h-20 pl-16 pr-40 bg-transparent border-none text-2xl font-black tracking-tight text-text-strong placeholder:normal-case placeholder:font-medium placeholder:text-text-muted/30 focus:ring-0"
                                            placeholder="Search patient by name"
                                            value={searchQuery}
                                            onChange={(e) => {
                                                setSearchQuery(e.target.value);
                                                setSelectedPatientId(null);
                                                setError('');
                                            }}
                                            onKeyDown={(e) => e.key === 'Enter' && handleLoad()}
                                        />
                                        <button
                                            onClick={handleLoad}
                                            className="absolute right-3 top-3 bottom-3 px-8 bg-primary hover:bg-primary-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 transition-all active:scale-95"
                                        >
                                            Load
                                        </button>
                                    </div>
                                </div>
                                {error && (
                                    <div className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 rounded-2xl border border-red-100 animate-slide-up">
                                        <span className="text-xs font-black uppercase tracking-widest">{error}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Column 2: Today */}
                        <div className="lg:col-span-4 space-y-6">
                            <div className="flex items-end justify-between px-2">
                                <h3 className="text-2xl font-black text-text-strong tracking-tight">Today</h3>
                                <span className="text-[10px] font-black text-accent-600 uppercase tracking-widest mb-1">Feb 28</span>
                            </div>

                            <div className="space-y-3">
                                {todaysPatients.length > 0 ? (
                                    todaysPatients.map(p => <PatientCard key={p.code} patient={p} />)
                                ) : (
                                    <div className="p-10 border-2 border-dashed border-border rounded-[2.5rem] flex flex-col items-center justify-center text-center opacity-40">
                                        <Calendar className="w-8 h-8 text-text-muted mb-3" />
                                        <p className="text-xs font-bold uppercase tracking-widest text-text-muted">No appointments</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Column 3: Tomorrow */}
                        <div className="lg:col-span-4 space-y-6">
                            <div className="flex items-end justify-between px-2">
                                <h3 className="text-2xl font-black text-text-strong tracking-tight">Tomorrow</h3>
                                <span className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Mar 01</span>
                            </div>

                            <div className="space-y-3">
                                {tomorrowsPatients.length > 0 ? (
                                    tomorrowsPatients.map(p => <PatientCard key={p.code} patient={p} />)
                                ) : (
                                    <div className="p-10 border-2 border-dashed border-border rounded-[2.5rem] flex flex-col items-center justify-center text-center opacity-40">
                                        <Calendar className="w-8 h-8 text-text-muted mb-3" />
                                        <p className="text-xs font-bold uppercase tracking-widest text-text-muted">No appointments</p>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>

                    <footer className="mt-20 pt-8 border-t border-border flex justify-center">
                        <p className="max-w-xl text-center text-[10px] font-bold text-text-muted/50 uppercase tracking-[0.2em] leading-relaxed">
                            Clinical access is monitored and logged in accordance with institutional policies.
                        </p>
                    </footer>
                </main>
            </div>
        </Layout>
    );
};
