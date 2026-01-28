"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    User, Lock, Trash2, Save, ShieldCheck, Mail, 
    AlertTriangle, Loader2, KeyRound, LogOut 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { ModalLayout } from '@/components/Modals';

export const ProfileSection = ({ currentUser, setCurrentUser, onLogout }: any) => {
    const [name, setName] = useState(currentUser?.username || '');
    const [currentPassword, setCurrentPassword] = useState(''); // বর্তমান পাসওয়ার্ড
    const [newPassword, setNewPassword] = useState(''); // নতুন পাসওয়ার্ড
    const [loading, setLoading] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // ১. প্রোফাইল ও পাসওয়ার্ড আপডেট হ্যান্ডলার
    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!name) return toast.error("Identity name cannot be empty");
        if (!currentPassword) return toast.error("Please enter current security key to verify");

        setLoading(true);
        try {
            const res = await fetch('/api/auth/update', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    userId: currentUser._id, 
                    currentPassword, // ভেরিফিকেশনের জন্য পাঠানো হচ্ছে
                    newName: name, 
                    newPassword: newPassword || undefined 
                }),
            });
            
            const data = await res.json();

            if (res.ok) {
                setCurrentUser(data.user);
                localStorage.setItem('cashbookUser', JSON.stringify(data.user));
                toast.success('Security identity updated');
                setCurrentPassword(''); // ফিল্ড ক্লিয়ার
                setNewPassword(''); // ফিল্ড ক্লিয়ার
            } else {
                toast.error(data.message || 'Protocol update failed');
            }
        } catch (error) {
            toast.error('Network synchronization failure');
        } finally {
            setLoading(false);
        }
    };

    // ২. অ্যাকাউন্ট ডিলিট লজিক (আগের মতই)
    const handleDeleteAccount = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/auth/delete', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUser._id }),
            });
            if (res.ok) {
                toast.success('Vault Terminated');
                onLogout();
            } else {
                toast.error('Termination Failed');
            }
        } catch (error) { toast.error('Server error'); } finally { setLoading(false); }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pb-24 max-w-4xl mx-auto space-y-8 px-2">
            
            <div className="anim-fade-up">
                <h2 className="text-3xl font-black text-[var(--text-main)] uppercase italic tracking-tighter">Identity Protocol</h2>
                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[3px] mt-1">Manage encryption and secure access</p>
            </div>

            {/* PROFILE CARD */}
            <div className="app-card p-8 relative overflow-hidden group border-orange-500/10">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <ShieldCheck size={120} className="text-orange-500" />
                </div>
                <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                    <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center text-4xl font-black text-white shadow-2xl shadow-orange-500/30 border-4 border-white/10 uppercase italic">
                        {currentUser?.username?.charAt(0)}
                    </div>
                    <div className="text-center md:text-left flex-1">
                        <h3 className="text-2xl font-black text-[var(--text-main)] uppercase tracking-tight italic">{currentUser?.username}</h3>
                        <div className="flex items-center justify-center md:justify-start gap-2 text-[var(--text-muted)] text-xs mt-2 font-bold tracking-wider">
                            <Mail size={14} className="text-orange-500" /> {currentUser?.email}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* UPDATE FORM */}
                <div className="app-card p-8 space-y-6">
                    <h4 className="text-xs font-black text-[var(--text-main)] uppercase tracking-[3px] flex items-center gap-3 italic">
                        <div className="p-2 bg-orange-500/10 rounded-lg text-orange-500"><User size={16}/></div>
                        Personal Data
                    </h4>
                    <form onSubmit={handleUpdateProfile} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Full Identity Name</label>
                            <input type="text" className="app-input font-bold uppercase" value={name} onChange={(e) => setName(e.target.value)} />
                        </div>

                        <div className="space-y-2 pt-2 border-t border-[var(--border-color)]">
                            <label className="text-[9px] font-black text-orange-500 uppercase tracking-widest ml-1">Current Security Key (Verify)</label>
                            <input 
                                type="password" 
                                placeholder="REQUIRED FOR CHANGES" 
                                className="app-input font-mono border-orange-500/20 focus:border-orange-500" 
                                value={currentPassword} 
                                onChange={(e) => setCurrentPassword(e.target.value)} 
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">New Security Key (Optional)</label>
                            <input 
                                type="password" 
                                placeholder="••••••••" 
                                className="app-input font-mono" 
                                value={newPassword} 
                                onChange={(e) => setNewPassword(e.target.value)} 
                            />
                        </div>

                        <button disabled={loading} className="app-btn-primary w-full py-4 mt-2 shadow-2xl shadow-orange-500/20">
                            {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                            <span className="tracking-[3px] font-black uppercase text-xs">Execute Sync</span>
                        </button>
                    </form>
                </div>

                <div className="space-y-6">
                    <div className="app-card p-8 bg-red-500/5 border-red-500/10">
                        <h4 className="text-xs font-black text-red-500 uppercase tracking-[3px] flex items-center gap-3 italic mb-3">
                            <AlertTriangle size={18} /> Danger Protocol
                        </h4>
                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest leading-relaxed">
                            Permanently erase your identity and all encrypted vaults. This command is irreversible.
                        </p>
                        <button onClick={() => setShowDeleteConfirm(true)} className="mt-6 w-full py-4 rounded-2xl border-2 border-red-500/20 text-red-500 font-black text-[10px] uppercase tracking-[3px] hover:bg-red-500 hover:text-white transition-all">
                            Self Destruct Account
                        </button>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {showDeleteConfirm && (
                    <ModalLayout title="Vault Destruction" onClose={() => setShowDeleteConfirm(false)}>
                        <div className="space-y-6">
                            <div className="p-5 rounded-2xl bg-red-500/10 border border-red-500/20 flex gap-4">
                                <AlertTriangle className="text-red-500 shrink-0" size={24} />
                                <p className="text-[11px] font-bold text-red-500 uppercase leading-relaxed">Final Warning: All financial history will be purged.</p>
                            </div>
                            <button onClick={handleDeleteAccount} disabled={loading} className="w-full py-4 bg-red-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl">
                                {loading ? "PURGING..." : "CONFIRM DESTRUCTION"}
                            </button>
                        </div>
                    </ModalLayout>
                )}
            </AnimatePresence>
        </motion.div>
    );
};