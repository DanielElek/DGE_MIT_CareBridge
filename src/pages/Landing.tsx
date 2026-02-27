import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, ArrowRight, Heart, Shield } from 'lucide-react';

export const Landing: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-50/50 via-slate-50 to-slate-50">
            <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 animate-slide-up">
                {/* Left Side: Branding */}
                <div className="flex flex-col justify-center space-y-8 pr-8">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-200 rotate-3">
                            <Heart className="w-9 h-9 text-white" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">CareBridge</h1>
                            <p className="text-blue-600 font-black text-xs uppercase tracking-[0.3em] mt-1 ml-0.5">Clinical Ecosystem</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-tight">
                            Precision Healthcare <br />
                            <span className="text-blue-600">at your fingertips.</span>
                        </h2>
                        <p className="text-slate-500 font-medium leading-relaxed">
                            A unified platform connecting patients and medical professionals with real-time health data, AI-driven summaries, and clinical insights.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 pt-4">
                        <div className="flex -space-x-3">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200" />
                            ))}
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Trusted by 500+ Clinics</p>
                    </div>
                </div>

                {/* Right Side: Portal Selection */}
                <div className="space-y-6">
                    <button
                        onClick={() => navigate('/doctor/patient')}
                        className="w-full group relative overflow-hidden bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-2xl hover:shadow-blue-100 hover:-translate-y-1 transition-all text-left flex items-start gap-6"
                    >
                        <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">
                            <Shield className="w-7 h-7" />
                        </div>
                        <div className="flex-1 mt-1">
                            <div className="flex items-center justify-between mb-1">
                                <h3 className="text-xl font-black text-slate-900 tracking-tight">Clinical Portal</h3>
                                <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-blue-600 transition-colors" />
                            </div>
                            <p className="text-slate-500 text-sm font-medium leading-relaxed">Access patient records, clinical charts, and finalize SOAP notes.</p>
                            <span className="inline-block mt-4 text-[10px] font-black text-blue-600 uppercase tracking-widest">Healthcare Provider Only</span>
                        </div>
                    </button>

                    <button
                        onClick={() => navigate('/patient/complaint')}
                        className="w-full group relative overflow-hidden bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-2xl hover:shadow-indigo-100 hover:-translate-y-1 transition-all text-left flex items-start gap-6"
                    >
                        <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                            <Activity className="w-7 h-7" />
                        </div>
                        <div className="flex-1 mt-1">
                            <div className="flex items-center justify-between mb-1">
                                <h3 className="text-xl font-black text-slate-900 tracking-tight">Patient Portal</h3>
                                <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                            </div>
                            <p className="text-slate-500 text-sm font-medium leading-relaxed">Submit symptoms, track trends, and view your medical documents.</p>
                            <span className="inline-block mt-4 text-[10px] font-black text-indigo-600 uppercase tracking-widest">Self-Management Tools</span>
                        </div>
                    </button>
                </div>
            </div>

            <p className="fixed bottom-8 text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
                Secure Session • 256-Bit Encrypted Nexus
            </p>
        </div>
    );
};
