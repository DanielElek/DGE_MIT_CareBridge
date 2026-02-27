import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, ArrowRight, Heart, Shield } from 'lucide-react';

export const Landing: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 overflow-hidden relative">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-accent-500/5 rounded-full blur-[120px] -mr-96 -mt-96 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-primary-900/5 rounded-full blur-[100px] -ml-48 -mb-48 pointer-events-none" />

            <div className="w-full max-w-[1400px] grid lg:grid-cols-12 gap-16 items-center z-10 animate-slide-up">

                {/* Left Side: Impactful Branding & Intro */}
                <div className="lg:col-span-7 flex flex-col space-y-12">
                    {/* Brand Identity */}
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shadow-2xl shadow-accent-500/20 -rotate-2">
                            <Heart className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-[28px] font-black text-text-strong tracking-tighter leading-none">CareBridge</h1>
                            <p className="text-accent-600 font-black text-[10px] uppercase tracking-[0.4em] mt-1">Clinical Ecosystem</p>
                        </div>
                    </div>

                    {/* Hero Headline */}
                    <div className="space-y-8">
                        <h2 className="display-type text-text-strong leading-[0.9] max-w-3xl">
                            Precision <span className="font-light text-text-strong">Healthcare</span> <br />
                            <span className="text-accent-600">at your fingertips.</span>
                        </h2>
                        <p className="text-[22px] text-text-muted font-medium leading-[1.5] max-w-lg">
                            An intelligent ecosystem bridging the gap between clinical excellence and patient care through real-time data.
                        </p>
                    </div>

                </div>

                {/* Right Side: High-End Portal Cards */}
                <div className="lg:col-span-5 flex flex-col gap-10 relative">
                    {/* Persistent Background Glow for the whole column */}
                    <div className="absolute inset-0 bg-primary-900/10 blur-[140px] rounded-full -z-20 scale-125 translate-x-20" />

                    {/* Clinical Portal Card */}
                    <div className="relative group">
                        {/* Static Subtle Aura */}
                        <div className="absolute inset-x-0 inset-y-0 bg-accent-500/5 blur-[80px] rounded-full scale-150 -z-10" />

                        <button
                            onClick={() => navigate('/doctor/patient')}
                            className="relative w-full bg-white/90 backdrop-blur-sm p-10 rounded-[3rem] border border-border shadow-[0_20px_50px_rgba(0,0,0,0.02)] hover:-translate-y-3 hover:bg-white hover:shadow-[0_40px_80px_rgba(34,197,139,0.08)] transition-all duration-500 text-left overflow-hidden z-10"
                        >
                            <div className="absolute top-0 right-0 w-40 h-40 bg-accent-500/5 blur-[80px] -mr-20 -mt-20 group-hover:bg-accent-500/10 transition-all duration-700" />
                            <div className="flex items-center justify-between mb-8 relative z-10">
                                <div className="w-16 h-16 rounded-3xl bg-surface-muted flex items-center justify-center text-text-muted group-hover:bg-primary group-hover:text-white transition-all duration-300 shadow-inner">
                                    <Shield className="w-8 h-8" />
                                </div>
                                <div className="w-12 h-12 rounded-full border border-border flex items-center justify-center group-hover:bg-accent-500/10 group-hover:border-accent-400 transition-all">
                                    <ArrowRight className="w-5 h-5 text-text-muted group-hover:text-accent-600 group-hover:translate-x-1 transition-all" />
                                </div>
                            </div>
                            <div className="space-y-4 relative z-10">
                                <h3 className="text-2xl font-black text-text-strong tracking-tight">Clinical Portal</h3>
                                <p className="text-text font-medium leading-relaxed text-[16px]">
                                    Professional workflow for healthcare providers. Access records, clinical charts, and finalise SOAP notes.
                                </p>
                                <div className="pt-2 flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-primary-600 shadow-[0_0_15px_rgba(19,115,83,0.4)]" />
                                    <span className="text-[10px] font-black text-primary-600 uppercase tracking-[0.2em]">Medical Access Required</span>
                                </div>
                            </div>
                        </button>
                    </div>

                    {/* Patient Portal Card */}
                    <div className="relative group">
                        {/* Static Subtle Aura */}
                        <div className="absolute inset-x-0 inset-y-0 bg-accent-500/5 blur-[80px] rounded-full scale-150 -z-10" />

                        <button
                            onClick={() => navigate('/patient/complaint')}
                            className="relative w-full bg-white/90 backdrop-blur-sm p-10 rounded-[3rem] border border-border shadow-[0_20px_50px_rgba(0,0,0,0.02)] hover:-translate-y-3 hover:bg-white hover:shadow-[0_40px_80px_rgba(34,197,139,0.08)] transition-all duration-500 text-left overflow-hidden z-10"
                        >
                            <div className="absolute top-0 right-0 w-40 h-40 bg-accent-500/5 blur-[80px] -mr-20 -mt-20 group-hover:bg-accent-500/10 transition-all duration-700" />
                            <div className="flex items-center justify-between mb-8 relative z-10">
                                <div className="w-16 h-16 rounded-3xl bg-surface-muted flex items-center justify-center text-text-muted group-hover:bg-primary group-hover:text-white transition-all duration-300 shadow-inner">
                                    <Activity className="w-8 h-8" />
                                </div>
                                <div className="w-12 h-12 rounded-full border border-border flex items-center justify-center group-hover:bg-accent-500/10 group-hover:border-accent-400 transition-all">
                                    <ArrowRight className="w-5 h-5 text-text-muted group-hover:text-accent-600 group-hover:translate-x-1 transition-all" />
                                </div>
                            </div>
                            <div className="space-y-4 relative z-10">
                                <h3 className="text-2xl font-black text-text-strong tracking-tight">Patient Portal</h3>
                                <p className="text-text font-medium leading-relaxed text-[16px]">
                                    Intelligent self-management. Submit symptoms, track physiological trends, and access personalized medical data.
                                </p>
                                <div className="pt-2 flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-accent-500 shadow-[0_0_15px_rgba(34,197,139,0.4)]" />
                                    <span className="text-[10px] font-black text-accent-600 uppercase tracking-[0.2em]">Patient Access Point</span>
                                </div>
                            </div>
                        </button>
                    </div>
                </div>
            </div>

        </div>
    );
};
