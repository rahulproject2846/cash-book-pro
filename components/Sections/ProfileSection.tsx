"use client";
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    User, Lock, Trash2, Save, ShieldCheck, Mail, 
    AlertTriangle, Loader2, KeyRound, LogOut, Camera, 
    RefreshCcw, Image as ImageIcon, Check, Chrome, ShieldAlert
} from 'lucide-react';
import toast from 'react-hot-toast';
import { ModalLayout } from '@/components/Modals';

export const ProfileSection = ({ currentUser, setCurrentUser, onLogout }: any) => {
    // --- STATES ---
    const [name, setName] = useState(currentUser?.username || '');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    
    // Image States
    const [previewImage, setPreviewImage] = useState(currentUser?.image || '');
    const [isCustomImage, setIsCustomImage] = useState(currentUser?.isCustomImage || false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ডিফল্ট অ্যাভাটার কালার প্যালেট (Studio Presets)
    const avatarPresets = [
        'linear-gradient(135deg, #F97316 0%, #FB923C 100%)', // Orange
        'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)', // Blue
        'linear-gradient(135deg, #10B981 0%, #34D399 100%)', // Green
        'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)', // Purple
        'linear-gradient(135deg, #EF4444 0%, #F87171 100%)', // Red
        'linear-gradient(135deg, #1E293B 0%, #334155 100%)', // Slate
    ];

    // --- HANDLERS ---

    // ১. ইমেজ আপলোড হ্যান্ডলার
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) return toast.error("Image too large (Max 2MB)");
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setPreviewImage(base64String);
                setIsCustomImage(true);
                toast.success("Identity Image Loaded");
            };
            reader.readAsDataURL(file);
        }
    };

    // ২. গুগল ইমেজ সিঙ্ক প্রোটোকল
    const handleGoogleSync = () => {
        if (currentUser?.authProvider !== 'google') {
            return toast.error("Account not linked with Google");
        }
        setPreviewImage(currentUser?.image); // গুগল থেকে আসা অরিজিনাল ইউআরএল
        setIsCustomImage(false); // সিঙ্ক অন করা হলো
        toast.success("Synced with Google Identity");
    };

    // ৩. মেইন আপডেট হ্যান্ডলার
    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) return toast.error("Name is required");
        if (!currentPassword) return toast.error("Verify current security key");

        setLoading(true);
        try {
            const res = await fetch('/api/auth/update', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    userId: currentUser._id, 
                    currentPassword,
                    newName: name, 
                    newPassword: newPassword || undefined,
                    image: previewImage,
                    isCustomImage
                }),
            });
            
            const data = await res.json();
            if (res.ok) {
                setCurrentUser(data.user);
                localStorage.setItem('cashbookUser', JSON.stringify(data.user));
                toast.success('Identity Protocol Synchronized');
                setCurrentPassword('');
                setNewPassword('');
            } else {
                toast.error(data.message || 'Update failed');
            }
        } catch (error) {
            toast.error('Network Error');
        } finally {
            setLoading(false);
        }
    };

    // ৪. অ্যাকাউন্ট ডিলিট
    const handleDeleteAccount = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/auth/delete', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUser._id }),
            });
            if (res.ok) { toast.success('Vault Destroyed'); onLogout(); }
        } catch (error) { toast.error('Protocol Error'); } finally { setLoading(false); }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pb-24 max-w-5xl mx-auto space-y-8 px-2">
            
            <div className="anim-fade-up">
                <h2 className="text-3xl font-black text-[var(--text-main)] uppercase italic tracking-tighter">Identity Protocol</h2>
                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[3px] mt-1">Configure Personal Encryption & Visuals</p>
            </div>

            {/* --- TOP SECTION: VISUAL IDENTITY --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Visual Identity Display */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="app-card p-8 flex flex-col items-center text-center relative overflow-hidden group border-orange-500/10">
                        <div className="relative z-10">
                            <div className="relative">
                                {/* Avatar Display */}
                                <div 
                                    className="w-32 h-32 rounded-[40px] flex items-center justify-center text-5xl font-black text-white shadow-2xl border-4 border-white/10 uppercase italic overflow-hidden"
                                    style={{ 
                                        background: !previewImage ? avatarPresets[0] : 'transparent',
                                    }}
                                >
                                    {previewImage ? (
                                        <img src={previewImage} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        currentUser?.username?.charAt(0)
                                    )}
                                </div>
                                {/* Change Overlay */}
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute -right-2 -bottom-2 p-3 bg-orange-500 text-white rounded-2xl shadow-xl hover:scale-110 transition-all active:scale-95"
                                >
                                    <Camera size={18} strokeWidth={3} />
                                </button>
                                <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                            </div>
                            
                            <h3 className="text-xl font-black text-[var(--text-main)] mt-6 uppercase tracking-tight italic">{currentUser?.username}</h3>
                            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1 opacity-60">{currentUser?.email}</p>
                            
                            {/* Google Sync Badge */}
                            {currentUser?.authProvider === 'google' && !isCustomImage && (
                                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[8px] font-black uppercase tracking-widest">
                                    <Chrome size={10} /> Synced with Google
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Presets & Sync */}
                    <div className="app-card p-6 space-y-4">
                        <h4 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[2px] ml-1">Identity Presets</h4>
                        <div className="grid grid-cols-6 gap-2">
                            {avatarPresets.map((bg, i) => (
                                <button 
                                    key={i} 
                                    onClick={() => { setPreviewImage(''); setIsCustomImage(true); }}
                                    className="h-8 rounded-lg border-2 border-transparent hover:border-orange-500 transition-all"
                                    style={{ background: bg }}
                                />
                            ))}
                        </div>
                        {currentUser?.authProvider === 'google' && isCustomImage && (
                            <button 
                                onClick={handleGoogleSync}
                                className="w-full py-3 mt-2 rounded-xl border border-blue-500/20 bg-blue-500/5 text-blue-400 text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-500 hover:text-white transition-all"
                            >
                                <RefreshCcw size={12} /> Sync with Google
                            </button>
                        )}
                    </div>
                </div>

                {/* --- UPDATE FORM --- */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="app-card p-8 space-y-8">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-orange-500/10 rounded-xl text-orange-500"><User size={20}/></div>
                            <h4 className="text-sm font-black text-[var(--text-main)] uppercase tracking-[2px] italic">Access Configuration</h4>
                        </div>
                        
                        <form onSubmit={handleUpdateProfile} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Identity Name</label>
                                    <input type="text" className="app-input font-bold uppercase h-14" value={name} onChange={(e) => setName(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">New Security Key (Optional)</label>
                                    <input type="password" placeholder="••••••••" className="app-input font-mono h-14" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                                </div>
                            </div>

                            <div className="p-6 bg-orange-500/[0.03] border-2 border-dashed border-orange-500/10 rounded-3xl space-y-4">
                                <div className="flex items-center gap-2 text-orange-500">
                                    <KeyRound size={16} />
                                    <label className="text-[10px] font-black uppercase tracking-widest">Verification Required</label>
                                </div>
                                <input 
                                    type="password" 
                                    placeholder="ENTER CURRENT SECURITY KEY TO EXECUTE SYNC" 
                                    className="app-input font-mono h-14 border-orange-500/20 focus:border-orange-500 bg-[var(--bg-card)]" 
                                    value={currentPassword} 
                                    onChange={(e) => setCurrentPassword(e.target.value)} 
                                    required
                                />
                            </div>

                            <button 
                                disabled={loading} 
                                className="app-btn-primary w-full py-5 shadow-2xl shadow-orange-500/30 text-xs font-black tracking-[4px] hover:scale-[1.01] active:scale-[0.98] transition-all"
                            >
                                {loading ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                                EXECUTE SYNCHRONIZATION
                            </button>
                        </form>
                    </div>

                    {/* Protocol Termination */}
                    <div className="app-card p-8 bg-red-500/[0.02] border-red-500/10 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <div className="p-3 bg-red-500/10 rounded-2xl text-red-500"><ShieldAlert size={24}/></div>
                            <div>
                                <h4 className="text-xs font-black text-red-500 uppercase tracking-widest">Danger Protocol</h4>
                                <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1">Erase identity and purge all vaults permanently</p>
                            </div>
                        </div>
                        <button onClick={() => setShowDeleteConfirm(true)} className="px-6 py-3 rounded-xl border-2 border-red-500/20 text-red-500 font-black text-[9px] uppercase tracking-[2px] hover:bg-red-500 hover:text-white transition-all shrink-0">
                            Self Destruct
                        </button>
                    </div>
                </div>
            </div>

            {/* DELETE MODAL */}
            <AnimatePresence>
                {showDeleteConfirm && (
                    <ModalLayout title="Protocol: Termination" onClose={() => setShowDeleteConfirm(false)}>
                        <div className="space-y-6">
                            <div className="p-5 rounded-2xl bg-red-500/10 border border-red-500/20 flex gap-4">
                                <AlertTriangle className="text-red-500 shrink-0" size={24} />
                                <p className="text-[11px] font-bold text-red-500 uppercase leading-relaxed">
                                    Warning: Executing this command will permanently wipe your identity and all financial archives.
                                </p>
                            </div>
                            <button onClick={handleDeleteAccount} disabled={loading} className="w-full py-4 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-transform">
                                {loading ? "PURGING..." : "CONFIRM TERMINATION"}
                            </button>
                        </div>
                    </ModalLayout>
                )}
            </AnimatePresence>
        </motion.div>
    );
};