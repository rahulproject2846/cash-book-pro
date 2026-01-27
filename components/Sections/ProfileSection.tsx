"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    User, Lock, Trash2, Save, ShieldCheck, Mail, 
    AlertTriangle, Loader2, ShieldAlert, ChevronRight, LogOut 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { ModalLayout } from '@/components/Modals';

export const ProfileSection = ({ currentUser, setCurrentUser, onLogout }: any) => {
    const [name, setName] = useState(currentUser?.username || '');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // ১. প্রোফাইল ও পাসওয়ার্ড আপডেট হ্যান্ডলার
    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) return toast.error("Name cannot be empty");
        
        setLoading(true);
        try {
            const res = await fetch('/api/auth/update', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    userId: currentUser._id, 
                    newName: name, 
                    newPassword: password || undefined 
                }),
            });
            
            if (res.ok) {
                const updatedUser = await res.json();
                setCurrentUser(updatedUser);
                localStorage.setItem('cashbookUser', JSON.stringify(updatedUser));
                toast.success('Security identity updated');
                setPassword(''); // পাসওয়ার্ড ফিল্ড ক্লিয়ার করা
            } else {
                toast.error('Update failed. Try again.');
            }
        } catch (error) {
            toast.error('Network error occurred');
        } finally {
            setLoading(false);
        }
    };

    // ২. অ্যাকাউন্ট স্থায়ীভাবে ডিলিট করার হ্যান্ডলার
    const handleDeleteAccount = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/auth/delete', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUser._id }),
            });

            if (res.ok) {
                toast.success('Account terminated successfully');
                onLogout(); // লগআউট করে হোমপেজে পাঠিয়ে দেওয়া
            } else {
                toast.error('Could not delete account');
            }
        } catch (error) {
            toast.error('Server error');
        } finally {
            setLoading(false);
            setShowDeleteConfirm(false);
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="pb-24 max-w-4xl mx-auto space-y-8 px-2"
        >
            {/* --- HEADER --- */}
            <div className="anim-fade-up">
                <h2 className="text-3xl font-black text-[var(--text-main)] uppercase italic tracking-tighter">Profile</h2>
                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[3px] mt-1">Manage encryption and personal identity</p>
            </div>

            {/* --- PROFILE IDENTITY CARD --- */}
            <div className="app-card p-8 relative overflow-hidden group">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <ShieldCheck size={120} className="text-orange-500" />
                </div>
                
                <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                    {/* Dynamic Avatar with Initial */}
                    <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center text-4xl font-black text-white shadow-2xl shadow-orange-500/30 border-4 border-white/10 uppercase italic">
                        {currentUser?.username?.charAt(0)}
                    </div>
                    
                    <div className="text-center md:text-left flex-1">
                        <h3 className="text-2xl font-black text-[var(--text-main)] uppercase tracking-tight italic">
                            {currentUser?.username}
                        </h3>
                        <div className="flex items-center justify-center md:justify-start gap-2 text-[var(--text-muted)] text-xs mt-2 font-bold tracking-wider">
                            <Mail size={14} className="text-orange-500" /> {currentUser?.email}
                        </div>
                        <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-5">
                            <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-[2px] bg-orange-500/10 text-orange-500 px-4 py-1.5 rounded-full border border-orange-500/20">
                                <ShieldCheck size={10} /> Secure Account
                            </span>
                            <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-[2px] bg-blue-500/10 text-blue-500 px-4 py-1.5 rounded-full border border-blue-500/20">
                                User ID: {currentUser?._id?.slice(-6).toUpperCase()}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* --- UPDATE FORM SECTION --- */}
                <div className="app-card p-8 space-y-6">
                    <h4 className="text-xs font-black text-[var(--text-main)] uppercase tracking-[3px] flex items-center gap-3 italic">
                        <div className="p-2 bg-orange-500/10 rounded-lg text-orange-500"><User size={16}/></div>
                        Personal Info
                    </h4>
                    <form onSubmit={handleUpdateProfile} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Full Name</label>
                            <input 
                                type="text" 
                                className="app-input font-bold uppercase tracking-wider" 
                                value={name} 
                                onChange={(e) => setName(e.target.value)} 
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">New Security Key (Optional)</label>
                            <input 
                                type="password" 
                                placeholder="••••••••" 
                                className="app-input font-mono" 
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)} 
                            />
                        </div>
                        <button 
                            disabled={loading} 
                            className="app-btn app-btn-primary w-full py-4 mt-2 flex items-center justify-center gap-3"
                        >
                            {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                            <span className="tracking-[2px] font-black">Sync Changes</span>
                        </button>
                    </form>
                </div>

                {/* --- SYSTEM PREFERENCES & DANGER ZONE --- */}
                <div className="space-y-6">
                    {/* General Settings */}
                    <div className="app-card p-8">
                        <h4 className="text-xs font-black text-[var(--text-main)] uppercase tracking-[3px] flex items-center gap-3 italic mb-6">
                            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500"><Lock size={16}/></div>
                            System Access
                        </h4>
                        <div className="space-y-3">
                             <div className="flex items-center justify-between p-4 bg-[var(--bg-app)] rounded-2xl border border-[var(--border)] group hover:border-orange-500/30 transition-colors cursor-pointer">
                                <div className="flex items-center gap-3">
                                    <ShieldAlert size={18} className="text-orange-500" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Two-Factor Auth</span>
                                </div>
                                <ChevronRight size={16} className="text-[var(--text-muted)]" />
                             </div>
                             <button 
                                onClick={onLogout}
                                className="flex items-center justify-between p-4 w-full bg-red-500/5 hover:bg-red-500/10 rounded-2xl border border-red-500/20 group transition-all"
                             >
                                <div className="flex items-center gap-3">
                                    <LogOut size={18} className="text-red-500" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-red-500">Close Current Session</span>
                                </div>
                                <ChevronRight size={16} className="text-red-500" />
                             </button>
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="app-card p-8 border-red-500/30 bg-red-500/[0.02]">
                        <h4 className="text-xs font-black text-red-500 uppercase tracking-[3px] flex items-center gap-3 italic mb-3">
                            <AlertTriangle size={18} /> Danger Zone
                        </h4>
                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider leading-relaxed">
                            Terminate your account and wipe all encrypted ledgers permanently. This action is irreversible.
                        </p>
                        <button 
                            onClick={() => setShowDeleteConfirm(true)} 
                            className="mt-6 w-full py-4 rounded-2xl border-2 border-red-500/20 text-red-500 font-black text-[10px] uppercase tracking-[3px] hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-500/10"
                        >
                            Self Destruct Account
                        </button>
                    </div>
                </div>
            </div>

            {/* --- DELETE CONFIRMATION MODAL --- */}
            <AnimatePresence>
                {showDeleteConfirm && (
                    <ModalLayout title="Account Termination" onClose={() => setShowDeleteConfirm(false)}>
                        <div className="space-y-6">
                            <div className="p-5 rounded-2xl bg-red-500/10 border border-red-500/20 flex gap-4">
                                <AlertTriangle className="text-red-500 shrink-0" size={24} />
                                <div className="space-y-1">
                                    <p className="text-xs font-black text-red-500 uppercase tracking-widest italic">Final Warning</p>
                                    <p className="text-[11px] font-bold text-red-400/80 leading-relaxed">
                                        Deleting <span className="underline italic text-white">{currentUser?.username}'s</span> account will erase all books, entries, and financial history.
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => setShowDeleteConfirm(false)} 
                                    className="flex-1 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest bg-[var(--bg-app)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleDeleteAccount}
                                    disabled={loading}
                                    className="flex-1 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest bg-red-600 text-white shadow-xl shadow-red-600/30 hover:bg-red-700 transition-all flex items-center justify-center"
                                >
                                    {loading ? <Loader2 size={16} className="animate-spin" /> : "Confirm Delete"}
                                </button>
                            </div>
                        </div>
                    </ModalLayout>
                )}
            </AnimatePresence>

        </motion.div>
    );
};