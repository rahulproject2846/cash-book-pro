"use client";
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Loader2, Fingerprint } from 'lucide-react';
import { ModalLayout } from '@/components/Modals';
import { useProfile } from '@/hooks/useProfile';

// Modular Components
import { IdentityHero } from './components/IdentityHero';
import { SecurityForm } from './components/SecurityForm';
import { DataSovereignty } from './components/DataSovereignty';
import { ProtocolAuditLog } from './components/ProtocolAuditLog';

export const ProfileSection = ({ currentUser, setCurrentUser, onLogout }: any) => {
    const {
        formData, setForm, isLoading, isExporting,
        handleImageProcess, updateProfile, exportMasterData, importMasterData, deleteAccount
    } = useProfile(currentUser, setCurrentUser, onLogout);

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const importInputRef = useRef<HTMLInputElement>(null);

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-32 max-w-6xl mx-auto space-y-10 px-4">
            
            <div className="flex items-end justify-between border-b border-[var(--border-color)] pb-8 mt-6">
                <div>
                    <h2 className="text-4xl md:text-6xl font-black text-[var(--text-main)] uppercase italic tracking-tighter leading-none">
                        Identity Hub<span className="text-orange-500">.</span>
                    </h2>
                    <p className="text-[10px] font-black text-orange-500 uppercase tracking-[4px] mt-4 ml-1">Master Profile Protocol</p>
                </div>
                <div className="hidden md:flex flex-col items-end opacity-20">
                    <Fingerprint size={32} strokeWidth={1.5} />
                    <span className="text-[8px] font-black uppercase tracking-widest mt-2 text-[var(--text-main)]">Encrypted Hub</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Identity Hero (Health Score Included) */}
                <div className="lg:col-span-1">
                    <IdentityHero 
                        formData={formData} 
                        handleImageProcess={handleImageProcess} 
                        setForm={setForm} // 🔥 এই লাইনটি যোগ করুন
                        currentUser={currentUser} 
                        fileInputRef={fileInputRef} 
                    />
                    
                    <div className="mt-8">
                        <ProtocolAuditLog />
                    </div>
                </div>

                {/* Right: Security & Data Hub */}
                <div className="lg:col-span-2 space-y-8">
                    <SecurityForm 
                        formData={formData} setForm={setForm} updateProfile={updateProfile} 
                        currentUser={currentUser} isLoading={isLoading} 
                    />

                    <DataSovereignty 
                        exportMasterData={exportMasterData} importMasterData={importMasterData} 
                        importInputRef={importInputRef} isExporting={isExporting} 
                    />

                    {/* Danger Zone */}
                    <div className="app-card p-6 bg-red-500/[0.02] border-red-500/10 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-4 text-red-500/60">
                            <ShieldAlert size={20} />
                            <span className="text-[10px] font-black uppercase tracking-[2px]">Identity Termination Zone</span>
                        </div>
                        <button onClick={() => setShowDeleteConfirm(true)} className="w-full md:w-auto px-8 py-3 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 font-black text-[9px] uppercase tracking-[3px] hover:bg-red-500 hover:text-white transition-all active:scale-95">
                            Delete Account
                        </button>
                    </div>
                </div>
            </div>

            {/* Deletion Modal */}
            <AnimatePresence>
                {showDeleteConfirm && (
                    <ModalLayout title="Protocol: Termination" onClose={() => setShowDeleteConfirm(false)}>
                        <div className="space-y-8 p-2">
                            <div className="p-6 rounded-[30px] bg-red-500/5 border-2 border-red-500/20 text-red-500 flex flex-col items-center text-center">
                                <ShieldAlert size={48} className="mb-4 opacity-40" />
                                <h4 className="text-sm font-black uppercase tracking-widest mb-3">Critical Authorization</h4>
                                <p className="text-[10px] font-bold uppercase leading-relaxed opacity-80 max-w-xs">Warning: Account termination will permanently erase all nodes and registries.</p>
                            </div>
                            <button onClick={deleteAccount} disabled={isLoading} className="w-full py-5 bg-red-600 text-white rounded-[22px] font-black text-xs uppercase tracking-[4px] shadow-2xl shadow-red-600/30 hover:bg-red-700 transition-all active:scale-95">
                                {isLoading ? <Loader2 className="animate-spin mx-auto" size={20} /> : "Authorize Termination"}
                            </button>
                        </div>
                    </ModalLayout>
                )}
            </AnimatePresence>
        </motion.div>
    );
};