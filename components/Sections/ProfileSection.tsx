"use client";
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    User, Lock, Trash2, Save, ShieldCheck, Camera, 
    RefreshCcw, Chrome, ShieldAlert, Fingerprint, 
    HardDrive, Download, Upload, Loader2, KeyRound
} from 'lucide-react';
import { ModalLayout } from '@/components/Modals';
import { useProfile } from '@/hooks/useProfile';

export const ProfileSection = ({ currentUser, setCurrentUser, onLogout }: any) => {
    const {
        formData, setForm, isLoading, isExporting,
        handleImageProcess, updateProfile, exportMasterData, importMasterData, deleteAccount
    } = useProfile(currentUser, setCurrentUser, onLogout);

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const importInputRef = useRef<HTMLInputElement>(null);

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pb-32 max-w-6xl mx-auto space-y-10 px-4">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-end border-b border-[var(--border-color)] pb-6 gap-4">
                <div>
                    <h2 className="text-3xl md:text-5xl font-black text-[var(--text-main)] uppercase italic tracking-tighter leading-none">
                        Identity Hub<span className="text-orange-500">.</span>
                    </h2>
                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[3px] mt-2 ml-1">Profile & Data Sovereignty</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* --- LEFT: AVATAR --- */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="app-card p-10 flex flex-col items-center text-center relative overflow-hidden group border-orange-500/20 bg-[var(--bg-card)] shadow-xl">
                        <div className="relative group/avatar cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            <div className="w-36 h-36 rounded-[48px] flex items-center justify-center text-6xl font-black text-white shadow-2xl border-4 border-white/5 uppercase italic overflow-hidden">
                                {formData.image ? (
                                    <img src={formData.image} alt="ID" className="w-full h-full object-cover" />
                                ) : (
                                    formData.name.charAt(0)
                                )}
                            </div>
                            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-[8px] font-black uppercase px-3 py-1 rounded-full shadow-lg border-2 border-[var(--bg-card)]">
                                Edit Photo
                            </div>
                            <input type="file" ref={fileInputRef} onChange={(e) => e.target.files && handleImageProcess(e.target.files[0])} accept="image/*" className="hidden" />
                        </div>

                        <h3 className="text-2xl font-black text-[var(--text-main)] mt-8 uppercase tracking-tight">{formData.name}</h3>
                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1 opacity-60">{currentUser?.email}</p>
                        
                        {currentUser?.authProvider === 'google' && (
                            <div className="mt-5 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[9px] font-black uppercase tracking-widest">
                                <Chrome size={12} /> Google Verified
                            </div>
                        )}
                    </div>
                </div>

                {/* --- RIGHT: FORM & ACTIONS --- */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* 1. PROFILE UPDATE FORM */}
                    <div className="app-card p-8 bg-[var(--bg-card)] shadow-xl">
                        <h4 className="text-sm font-black text-[var(--text-main)] uppercase tracking-[2px] italic mb-6 flex items-center gap-2">
                            <User size={18} className="text-orange-500" /> Account Details
                        </h4>
                        
                        <form onSubmit={updateProfile} className="space-y-6">
                            {/* Name Input */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Identity Name</label>
                                <input type="text" className="app-input h-14 font-bold uppercase" value={formData.name} onChange={(e) => setForm({...formData, name: e.target.value})} />
                            </div>

                            {/* Password Section (Only for Credentials Users) */}
                            {currentUser?.authProvider === 'credentials' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[var(--border-color)]">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-orange-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                            <KeyRound size={12} /> Current Password
                                        </label>
                                        <input 
                                            type="password" placeholder="••••••••" 
                                            className="app-input h-14 font-mono border-orange-500/30 focus:border-orange-500" 
                                            value={formData.currentPassword} 
                                            onChange={(e) => setForm({...formData, currentPassword: e.target.value})} 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">New Password (Optional)</label>
                                        <input 
                                            type="password" placeholder="••••••••" 
                                            className="app-input h-14 font-mono" 
                                            value={formData.newPassword} 
                                            onChange={(e) => setForm({...formData, newPassword: e.target.value})} 
                                        />
                                    </div>
                                </div>
                            )}

                            <button disabled={isLoading} className="app-btn-primary w-full py-5 shadow-2xl shadow-orange-500/30 text-xs font-black tracking-[4px]">
                                {isLoading ? <Loader2 size={20} className="animate-spin" /> : "SAVE CHANGES"}
                            </button>
                        </form>
                    </div>

                    {/* 2. DATA MANAGEMENT (Export / Import) */}
                    <div className="app-card p-8 border-dashed border-2 border-[var(--border-color)] flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-5">
                            <div className="p-3 bg-[var(--bg-app)] rounded-2xl border border-[var(--border-color)] text-[var(--text-muted)]"><HardDrive size={24} /></div>
                            <div>
                                <h4 className="text-xs font-black text-[var(--text-main)] uppercase tracking-widest">Vault Data</h4>
                                <p className="text-[9px] font-bold text-[var(--text-muted)] mt-1 uppercase tracking-widest opacity-60">Backup or Restore your financial history</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            {/* Import Button */}
                            <button onClick={() => importInputRef.current?.click()} disabled={isExporting} className="px-6 py-3 rounded-xl border-2 border-[var(--border-color)] hover:border-blue-500 hover:text-blue-500 text-[var(--text-muted)] font-black text-[9px] uppercase tracking-[2px] transition-all flex items-center gap-2">
                                <Upload size={14} /> Restore
                            </button>
                            <input type="file" ref={importInputRef} onChange={importMasterData} accept=".json" className="hidden" />

                            {/* Export Button */}
                            <button onClick={exportMasterData} disabled={isExporting} className="px-6 py-3 rounded-xl bg-[var(--text-main)] text-[var(--bg-app)] font-black text-[9px] uppercase tracking-[2px] hover:scale-105 transition-all flex items-center gap-2">
                                {isExporting ? <Loader2 size={14} className="animate-spin" /> : <><Download size={14} /> Backup</>}
                            </button>
                        </div>
                    </div>

                    {/* 3. DANGER ZONE */}
                    <div className="app-card p-6 bg-red-500/[0.02] border-red-500/10 flex justify-between items-center">
                        <div className="flex items-center gap-4 text-red-500">
                            <ShieldAlert size={20} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Delete Account</span>
                        </div>
                        <button onClick={() => setShowDeleteConfirm(true)} className="px-5 py-2.5 rounded-lg bg-red-500 text-white font-black text-[9px] uppercase tracking-[2px] hover:bg-red-600 transition-all">
                            Terminate
                        </button>
                    </div>
                </div>
            </div>

            {/* DELETE MODAL */}
            <AnimatePresence>
                {showDeleteConfirm && (
                    <ModalLayout title="Protocol: Termination" onClose={() => setShowDeleteConfirm(false)}>
                        <div className="space-y-6 p-2">
                            <div className="p-5 rounded-2xl bg-red-500/5 border border-red-500/20 text-red-500">
                                <h4 className="text-xs font-black uppercase tracking-widest mb-2">Final Warning</h4>
                                <p className="text-[10px] font-bold uppercase leading-relaxed opacity-80">This will permanently delete your account and all data. This action cannot be undone.</p>
                            </div>
                            <button onClick={deleteAccount} disabled={isLoading} className="w-full py-4 bg-red-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-red-700">
                                {isLoading ? <Loader2 className="animate-spin" /> : "CONFIRM DELETION"}
                            </button>
                        </div>
                    </ModalLayout>
                )}
            </AnimatePresence>
        </motion.div>
    );
};