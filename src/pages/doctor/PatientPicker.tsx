import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../AppContext';
import { Layout } from '../../components/Layout';
import { Search, Heart, ChevronRight, LogOut, Calendar } from 'lucide-react';
import { MonogramAvatar } from '../../components/MonogramAvatar';
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
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const [error, setError] = useState('');
    const searchRef = useRef<HTMLDivElement>(null);

    const allPatients: Patient[] = [
        { code: '1', name: 'Michael Oxlong', dob: '1958.05.12', age: 68, sex: 'Male', scheduledDate: '2026-02-28', scheduledTime: '09:00' },
        { code: '2', name: 'Sarah Miller', dob: '1982.11.24', age: 42, sex: 'Female', scheduledDate: '2026-02-28', scheduledTime: '10:30' },
        { code: '3', name: 'David Chen', dob: '1969-02-03', age: 55, sex: 'Male', scheduledDate: '2026-02-28', scheduledTime: '14:15' },
        { code: '4', name: 'Elena Rodriguez', dob: '1975.08.19', age: 48, sex: 'Female', scheduledDate: '2026-03-01', scheduledTime: '08:45' },
        { code: '5', name: 'James Wilson', dob: '1990.01.15', age: 34, sex: 'Male', scheduledDate: '2026-03-01', scheduledTime: '11:00' },
        { code: '6', name: 'Olivia Thompson', dob: '1962.12.01', age: 61, sex: 'Female', scheduledDate: '2026-03-01', scheduledTime: '15:30' },
        { code: '7', name: 'Robert Haff', dob: '1970.04.22', age: 53, sex: 'Male', scheduledDate: '2026-03-05', scheduledTime: '10:00' },
        { code: '8', name: 'Maria Garcia', dob: '1985.09.12', age: 38, sex: 'Female', scheduledDate: '2026-03-10', scheduledTime: '11:30' },
    ];

    const todayDateStr = '2026-02-28';
    const tomorrowDateStr = '2026-03-01';

    // Static lists for columns
    const todaysPatients = useMemo(() => allPatients.filter(p => p.scheduledDate === todayDateStr), []);
    const tomorrowsPatients = useMemo(() => allPatients.filter(p => p.scheduledDate === tomorrowDateStr), []);

    // Derived suggestions for autocomplete
    const suggestions = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return [];

        return allPatients
            .filter(p => p.name.toLowerCase().includes(query))
            .sort((a, b) => {
                const getPriority = (p: Patient) => {
                    if (p.scheduledDate === todayDateStr) return 0;
                    if (p.scheduledDate === tomorrowDateStr) return 1;
                    return 2;
                };
                return getPriority(a) - getPriority(b);
            })
            .slice(0, 10);
    }, [searchQuery]);

    useEffect(() => {
        setHighlightedIndex(-1);
    }, [searchQuery]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const openPatient = (patientCode: string) => {
        // Demo restriction: Only allow Michael Oxlong (code '1')
        if (patientCode !== '1') return;

        const patient = allPatients.find(p => p.code === patientCode);
        if (patient) {
            setCurrentClinicalPatient({
                ...MOCK_CLINICAL_PATIENT,
                code: patient.code,
                name: patient.name,
                age: patient.age,
                sex: patient.sex as any,
            });
            navigate('/doctor/dashboard');
        }
    };

    const handleLoad = () => {
        setError('');

        // Search logic
        const queryResults = allPatients.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase().trim()));
        if (queryResults.length === 0) {
            setError('No patients found.');
        } else if (queryResults.length === 1) {
            openPatient(queryResults[0].code);
        } else {
            setIsDropdownOpen(true);
            setError('Select a patient from the list.');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isDropdownOpen || suggestions.length === 0) {
            if (e.key === 'Enter') handleLoad();
            return;
        }
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex(prev => (prev > 0 ? prev - 1 : prev));
                break;
            case 'Enter':
                e.preventDefault();
                if (highlightedIndex >= 0) openPatient(suggestions[highlightedIndex].code);
                else handleLoad();
                break;
            case 'Escape':
                setIsDropdownOpen(false);
                break;
        }
    };

    const getBadge = (p: Patient) => {
        if (p.scheduledDate === todayDateStr) return { text: 'Today', class: 'bg-accent-500/10 text-primary' };
        if (p.scheduledDate === tomorrowDateStr) return { text: 'Tomorrow', class: 'bg-surface-muted text-text-muted' };
        return { text: 'Other', class: 'bg-slate-100 text-slate-400' };
    };

    const PatientCard = ({ patient }: { patient: Patient }) => {
        return (
            <button
                onClick={() => openPatient(patient.code)}
                className="w-full group p-5 rounded-3xl border border-border bg-white shadow-sm transition-all text-left flex items-center gap-4 hover:shadow-xl hover:shadow-primary/5 hover:border-accent-500/20 hover:-translate-x-1"
            >
                <div className="w-12 h-12 rounded-2xl overflow-hidden flex items-center justify-center transition-all bg-surface-muted text-text-muted/50 group-hover:bg-accent-500/10 group-hover:text-primary">
                    <MonogramAvatar name={patient.name} className="w-full h-full text-lg" />
                </div>
                <div className="flex-1">
                    <h4 className="font-black text-text-strong tracking-tight text-lg leading-tight mb-1">{patient.name}</h4>
                    <p className="text-text-muted text-[11px] font-bold tracking-tight leading-none">{patient.dob}</p>
                </div>
                <ChevronRight className="w-5 h-5 transition-colors text-border group-hover:text-accent-600" />
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
                    <button onClick={() => navigate('/')} className="flex items-center gap-2 text-text-muted hover:text-text-strong font-black text-[10px] uppercase tracking-widest transition-colors">
                        <LogOut className="w-4 h-4" /> Switch Role
                    </button>
                </header>

                <main className="flex-1 max-w-[1600px] w-full mx-auto px-8 py-10">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:items-start animate-slide-up">
                        <div className="lg:col-span-4 space-y-8 lg:sticky lg:top-24">
                            <div>
                                <h2 className="text-5xl font-black text-text-strong tracking-tight leading-[0.9] mb-4">Patient Selection</h2>
                                <p className="text-text-muted font-medium text-lg leading-snug">Find and load a scheduled patient record for today's session.</p>
                            </div>

                            <div className="space-y-4" ref={searchRef}>
                                <div className="glass-card p-2 border-border shadow-2xl shadow-primary/5 relative">
                                    <div className="relative">
                                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-text-muted/50" />
                                        <input
                                            type="text"
                                            className="w-full h-20 pl-16 pr-40 bg-transparent border-none text-2xl font-black tracking-tight text-text-strong placeholder:normal-case placeholder:font-medium placeholder:text-text-muted/30 focus:ring-0"
                                            placeholder="Search patient by name"
                                            value={searchQuery}
                                            onFocus={() => setIsDropdownOpen(true)}
                                            onChange={(e) => {
                                                setSearchQuery(e.target.value);
                                                setIsDropdownOpen(true);
                                                setError('');
                                            }}
                                            onKeyDown={handleKeyDown}
                                        />
                                        <button onClick={handleLoad} className="absolute right-3 top-3 bottom-3 px-8 bg-primary hover:bg-primary-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 transition-all active:scale-95">
                                            Load
                                        </button>
                                    </div>

                                    {isDropdownOpen && searchQuery.trim().length > 0 && (
                                        <div className="absolute left-0 right-0 top-full mt-3 bg-white border border-border rounded-3xl shadow-2xl z-[150] overflow-hidden animate-slide-up max-h-[440px] flex flex-col">
                                            <div className="p-3 overflow-y-auto">
                                                {suggestions.length > 0 ? (
                                                    suggestions.map((p, idx) => {
                                                        const badge = getBadge(p);
                                                        const isHighlighted = idx === highlightedIndex;
                                                        return (
                                                            <button
                                                                key={p.code}
                                                                onMouseEnter={() => setHighlightedIndex(idx)}
                                                                onClick={() => openPatient(p.code)}
                                                                className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all text-left ${isHighlighted ? 'bg-primary text-white shadow-lg' : 'hover:bg-surface-muted text-text-strong'}`}
                                                            >
                                                                <div className={`w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center shrink-0 ${isHighlighted ? 'bg-white/20 text-white' : 'bg-surface-muted text-text-muted'}`}>
                                                                    <MonogramAvatar name={p.name} className="w-full h-full text-sm" />
                                                                </div>
                                                                <div className="flex-1">
                                                                    <p className="font-black tracking-tight leading-none mb-1">{p.name}</p>
                                                                    <p className={`text-[10px] font-bold ${isHighlighted ? 'text-white/70' : 'text-text-muted'}`}>{p.dob}</p>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${isHighlighted ? 'bg-white/20 text-white' : badge.class}`}>
                                                                        {badge.text}
                                                                    </span>
                                                                    <ChevronRight className={`w-4 h-4 ${isHighlighted ? 'text-white' : 'text-border'}`} />
                                                                </div>
                                                            </button>
                                                        );
                                                    })
                                                ) : (
                                                    <div className="p-10 text-center">
                                                        <Search className="w-8 h-8 text-border mx-auto mb-3" />
                                                        <p className="text-xs font-black uppercase tracking-widest text-text-muted">No results found</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {error && (
                                    <div className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 rounded-2xl border border-red-100 animate-slide-up">
                                        <span className="text-xs font-black uppercase tracking-widest">{error}</span>
                                    </div>
                                )}
                            </div>
                        </div>

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

                </main>
            </div>
        </Layout>
    );
};
