import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../AppContext';
import { Layout } from '../../components/Layout';
import { Search, User, Heart, ShieldCheck, ChevronRight, LogOut } from 'lucide-react';
import { MOCK_CLINICAL_PATIENT } from '../../mockData';

export const PatientPicker: React.FC = () => {
    const { setCurrentClinicalPatient } = useApp();
    const navigate = useNavigate();
    const [lookupCode, setLookupCode] = useState('');
    const [error, setError] = useState('');

    const patients = [
        { name: 'Michael Oxlong', code: 'DEMO-001', age: 68, sex: 'Male' },
        { name: 'Sarah Miller', code: 'DEMO-002', age: 42, sex: 'Female' },
        { name: 'David Chen', code: 'DEMO-003', age: 55, sex: 'Male' },
    ];

    const handleLoad = (code: string) => {
        if (code.trim().toUpperCase() === 'DEMO-001') {
            setCurrentClinicalPatient(MOCK_CLINICAL_PATIENT);
            navigate('/doctor/dashboard');
        } else {
            setError('Only DEMO-001 is available in this prototype.');
        }
    };

    return (
        <Layout hideHeader>
            <div className="min-h-screen bg-background flex flex-col">
                {/* Superior Header */}
                <header className="h-16 shrink-0 bg-white border-b border-border flex items-center justify-between px-8 sticky top-0 z-[100] backdrop-blur-md bg-white/90">
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

                <main className="flex-1 flex items-center justify-center p-6">
                    <div className="w-full max-w-4xl grid md:grid-cols-2 gap-12 animate-slide-up">

                        {/* Left: Code Entry */}
                        <div className="space-y-8 flex flex-col justify-center">
                            <div>
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-500/10 text-primary rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
                                    <ShieldCheck className="w-3 h-3" /> Secure Access
                                </div>
                                <h2 className="text-4xl font-black text-text-strong tracking-tight leading-none mb-4">Patient Selection</h2>
                                <p className="text-text-muted font-medium">Enter a clinical secure code to load a specific patient record for this session.</p>
                            </div>

                            <div className="glass-card p-2 border-border shadow-2xl shadow-primary/10">
                                <div className="relative">
                                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-text-muted/50" />
                                    <input
                                        type="text"
                                        className="w-full h-20 pl-16 pr-44 bg-transparent border-none text-2xl font-black tracking-widest uppercase placeholder:normal-case placeholder:font-medium placeholder:text-text-muted/30 focus:ring-0"
                                        placeholder="Enter Secure Code..."
                                        value={lookupCode}
                                        onChange={(e) => setLookupCode(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleLoad(lookupCode)}
                                    />
                                    <button
                                        onClick={() => handleLoad(lookupCode)}
                                        className="absolute right-3 top-3 bottom-3 px-8 bg-primary hover:bg-primary-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 transition-all active:scale-95"
                                    >
                                        Load
                                    </button>
                                </div>
                            </div>
                            {error && <p className="text-red-500 text-xs font-bold px-4">{error}</p>}
                        </div>

                        {/* Right: Quick Access List */}
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-2 flex items-center gap-2">
                                Recent Records
                            </h3>

                            <div className="space-y-3">
                                {patients.map((p) => (
                                    <button
                                        key={p.code}
                                        onClick={() => handleLoad(p.code)}
                                        className="w-full group bg-white p-5 rounded-3xl border border-border shadow-sm hover:shadow-xl hover:shadow-primary/5 hover:border-accent-500/20 hover:-translate-x-1 transition-all text-left flex items-center gap-4"
                                    >
                                        <div className="w-12 h-12 rounded-2xl bg-surface-muted flex items-center justify-center text-text-muted/50 group-hover:bg-accent-500/10 group-hover:text-primary transition-all">
                                            <User className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-0.5">
                                                <h4 className="font-black text-text-strong tracking-tight text-lg">{p.name}</h4>
                                                <span className="text-[10px] font-black text-primary bg-accent-500/10 px-2 py-0.5 rounded-lg border border-accent-500/10">{p.code}</span>
                                            </div>
                                            <p className="text-text-muted text-xs font-bold uppercase tracking-wider">{p.age}Y • {p.sex}</p>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-border group-hover:text-accent-600 transition-colors" />
                                    </button>
                                ))}
                            </div>

                            <div className="pt-6 border-t border-border">
                                <p className="text-[10px] font-black text-text-muted/50 uppercase tracking-[0.2em] leading-relaxed">
                                    Clinical access is monitored and logged in accordance with institutional security policies.
                                </p>
                            </div>
                        </div>

                    </div>
                </main>
            </div>
        </Layout>
    );
};
