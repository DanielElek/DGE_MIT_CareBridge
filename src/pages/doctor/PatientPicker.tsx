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
            <div className="min-h-screen bg-slate-50 flex flex-col">
                {/* Superior Header */}
                <header className="h-16 shrink-0 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-[100] backdrop-blur-md bg-white/90">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-200">
                            <Heart className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-black tracking-tighter text-slate-900 leading-none">CareBridge</h1>
                            <p className="text-[8px] font-black uppercase tracking-widest text-blue-600 leading-tight">Clinical Portal</p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-slate-400 hover:text-slate-600 font-black text-[10px] uppercase tracking-widest transition-colors"
                    >
                        <LogOut className="w-4 h-4" /> Switch Role
                    </button>
                </header>

                <main className="flex-1 flex items-center justify-center p-6">
                    <div className="w-full max-w-4xl grid md:grid-cols-2 gap-12 animate-slide-up">

                        {/* Left: Code Entry */}
                        <div className="space-y-8 flex flex-col justify-center">
                            <div>
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
                                    <ShieldCheck className="w-3 h-3" /> Secure Access
                                </div>
                                <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-4">Patient Selection</h2>
                                <p className="text-slate-500 font-medium">Enter a clinical secure code to load a specific patient record for this session.</p>
                            </div>

                            <div className="glass-card p-2 border-slate-200 shadow-2xl shadow-slate-200/50">
                                <div className="relative">
                                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300" />
                                    <input
                                        type="text"
                                        className="w-full h-20 pl-16 pr-44 bg-transparent border-none text-2xl font-black tracking-widest uppercase placeholder:normal-case placeholder:font-medium placeholder:text-slate-300 focus:ring-0"
                                        placeholder="Enter Secure Code..."
                                        value={lookupCode}
                                        onChange={(e) => setLookupCode(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleLoad(lookupCode)}
                                    />
                                    <button
                                        onClick={() => handleLoad(lookupCode)}
                                        className="absolute right-3 top-3 bottom-3 px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-200 transition-all active:scale-95"
                                    >
                                        Load
                                    </button>
                                </div>
                            </div>
                            {error && <p className="text-red-500 text-xs font-bold px-4">{error}</p>}
                        </div>

                        {/* Right: Quick Access List */}
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                Recent Records
                            </h3>

                            <div className="space-y-3">
                                {patients.map((p) => (
                                    <button
                                        key={p.code}
                                        onClick={() => handleLoad(p.code)}
                                        className="w-full group bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-blue-100 hover:border-blue-200 hover:-translate-x-1 transition-all text-left flex items-center gap-4"
                                    >
                                        <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-blue-50 group-hover:text-blue-500 transition-all">
                                            <User className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-0.5">
                                                <h4 className="font-black text-slate-900 tracking-tight text-lg">{p.name}</h4>
                                                <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">{p.code}</span>
                                            </div>
                                            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">{p.age}Y • {p.sex}</p>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-slate-200 group-hover:text-blue-600 transition-colors" />
                                    </button>
                                ))}
                            </div>

                            <div className="pt-6 border-t border-slate-100">
                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] leading-relaxed">
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
