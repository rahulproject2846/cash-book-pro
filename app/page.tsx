"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Book, Plus, WifiOff } from 'lucide-react';
import toast from 'react-hot-toast';

// Offline DB logic
import { db } from '@/lib/offlineDB';

// Layout & Sections
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { BooksSection } from '@/components/Sections/BooksSection';
import { ReportsSection } from '@/components/Sections/ReportsSection';
import { SettingsSection } from '@/components/Sections/SettingsSection';
import { ProfileSection } from '@/components/Sections/ProfileSection';
import { ModalLayout } from '@/components/Modals';

export default function CashBookApp() {
  // --- STATES ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null); 
  const [currentBook, setCurrentBook] = useState<any>(null); 
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('books');
  
  // ✅ UPDATE: Modal Type expanded to handle Analytics, Export, Share, etc.
  const [modalType, setModalType] = useState<'none' | 'register' | 'analytics' | 'export' | 'share' | 'editBook' | 'deleteBookConfirm'>('none');
  
  const [triggerFab, setTriggerFab] = useState(false);
  const [showFabModal, setShowFabModal] = useState(false);
  
  // UX States
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastBackPress, setLastBackPress] = useState(0);

  // --- ১. অফলাইন সিঙ্ক প্রোটোকল ---
  const syncOfflineData = useCallback(async () => {
    if (!navigator.onLine || isSyncing) return;
    
    const pending = await db.pendingEntries.toArray();
    if (pending.length === 0) return;

    setIsSyncing(true);
    const syncToast = toast.loading(`Synchronizing ${pending.length} offline records...`);

    try {
      for (const entry of pending) {
        const res = await fetch('/api/entries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry.data),
        });

        if (res.ok) {
          await db.pendingEntries.delete(entry.id!);
        }
      }
      toast.success("All data secured in Cloud Vault", { id: syncToast });
      window.dispatchEvent(new Event('vault-synced'));
    } catch (err) {
      toast.error("Sync partial failure", { id: syncToast });
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing]);

  // --- ২. স্মার্ট ন্যাভিগেশন ও ব্যাক-বাটন ---
  useEffect(() => {
    if (currentBook) {
      window.history.pushState({ view: 'detail' }, '');
    } else {
      window.history.pushState({ view: 'list' }, '');
    }

    const handleBackButton = (e: PopStateEvent) => {
      if (currentBook) {
        setCurrentBook(null);
      } else if (activeSection !== 'books') {
        setActiveSection('books');
      } else {
        const now = Date.now();
        if (now - lastBackPress < 2000) {
           return; 
        }
        setLastBackPress(now);
        toast("Press back again to exit Vault", { icon: '🛡️' });
        window.history.pushState({ view: 'list' }, '');
      }
    };

    const handleOnlineStatus = () => {
      setIsOnline(navigator.onLine);
      if (navigator.onLine) syncOfflineData();
    };

    window.addEventListener('popstate', handleBackButton);
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);

    return () => {
      window.removeEventListener('popstate', handleBackButton);
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, [currentBook, lastBackPress, activeSection, syncOfflineData]);

  // --- ৩. অথেনটিকেশন ও ইনিশিয়ালাইজেশন ---
  useEffect(() => {
    const savedUser = localStorage.getItem('cashbookUser');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
      setIsLoggedIn(true);
      setActiveSection('books');
    }
    setTimeout(() => setIsLoading(false), 800);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('cashbookUser');
    setIsLoggedIn(false);
    setCurrentUser(null);
    setCurrentBook(null);
    setActiveSection('books');
    toast.success('Vault Locked');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
    });
    const data = await res.json();
    if (res.ok) {
        localStorage.setItem('cashbookUser', JSON.stringify(data.user));
        setCurrentUser(data.user);
        setIsLoggedIn(true);
        setActiveSection('books');
        toast.success(`Access Granted: ${data.user.username}`);
    } else {
        toast.error(data.message || 'Invalid Credentials');
    }
  };

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ username: '', email: '', password: '' });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/auth/register', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(registerForm) 
    });
    const data = await res.json();
    if (res.ok) { 
      toast.success('Vault Created! Please Login.'); 
      setModalType('none'); 
      setRegisterForm({ username: '', email: '', password: '' }); 
    } else { 
      toast.error(data.message || 'Registration Failed'); 
    }
  };

  // --- ৪. ডাইনামিক সেকশন রেন্ডারার ---
  const dashboardSections = [
    { 
      id: 'books', 
      component: (
        <BooksSection 
          currentUser={currentUser} 
          currentBook={currentBook} 
          setCurrentBook={setCurrentBook} 
          triggerFab={triggerFab} 
          setTriggerFab={setTriggerFab}
          // ✅ Passing modal state down to BooksSection
          externalModalType={modalType}
          setExternalModalType={setModalType}
        />
      ) 
    },
    { id: 'reports', component: <ReportsSection currentUser={currentUser} /> },
    { id: 'settings', component: <SettingsSection currentUser={currentUser} setCurrentUser={setCurrentUser} /> },
    { id: 'profile', component: <ProfileSection currentUser={currentUser} setCurrentUser={setCurrentUser} onLogout={handleLogout} /> },
  ];

  const currentComponent = dashboardSections.find(s => s.id === activeSection)?.component;

  // --- ৫. স্কেলিটন গ্লো লোডার ---
  if (isLoading) return (
    <div className="min-h-screen bg-[#0F0F0F] p-6 space-y-8 flex flex-col items-center justify-center">
        <div className="w-full max-w-5xl space-y-8">
            <div className="flex justify-between items-center">
                <div className="h-10 w-48 skeleton"></div>
                <div className="h-12 w-12 rounded-2xl skeleton"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="h-32 skeleton"></div>
                <div className="h-32 skeleton"></div>
                <div className="h-32 skeleton"></div>
            </div>
            <div className="h-64 skeleton w-full"></div>
        </div>
        <p className="text-[10px] font-black uppercase tracking-[5px] text-[#2D2D2D] animate-pulse">Establishing Secure Connection</p>
    </div>
  );

  // --- ৬. অথেনটিকেশন গেটওয়ে ---
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F0F0F] p-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="app-card w-full max-w-md p-10 text-center relative overflow-hidden border-[#2D2D2D]">
          <div className="absolute top-0 left-0 w-full h-1 bg-orange-500"></div>
          <h2 className="text-5xl font-black mb-10 text-white italic tracking-tighter uppercase leading-none">
            VAULT<span className="text-orange-500">.</span>
          </h2>
          
          <form onSubmit={handleLogin} className="space-y-5">
              <input type="email" placeholder="IDENTITY EMAIL" className="app-input font-bold" value={loginForm.email} onChange={e => setLoginForm({...loginForm, email: e.target.value})} required />
              <input type="password" placeholder="SECURITY KEY" className="app-input font-bold" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} required />
              <button type="submit" className="app-btn-primary w-full py-4 shadow-xl">UNSEAL VAULT</button>
          </form>
          
          <p onClick={() => setModalType('register')} className="text-[#888888] text-[10px] mt-8 hover:text-orange-500 cursor-pointer font-black uppercase tracking-widest transition-colors">
              New User? <span className="text-orange-500 underline decoration-2">Initialize Account</span>
          </p>
        </motion.div>

        <AnimatePresence>
          {modalType === 'register' && (
            <ModalLayout title="Vault Initialization" onClose={() => setModalType('none')}>
                <form onSubmit={handleRegister} className="space-y-5">
                    <input type="text" placeholder="FULL NAME" className="app-input font-bold" value={registerForm.username} onChange={e => setRegisterForm({...registerForm, username: e.target.value})} required/>
                    <input type="email" placeholder="EMAIL ADDRESS" className="app-input font-bold" value={registerForm.email} onChange={e => setRegisterForm({...registerForm, email: e.target.value})} required/>
                    <input type="password" placeholder="CREATE SECURITY KEY" className="app-input font-bold" value={registerForm.password} onChange={e => setRegisterForm({...registerForm, password: e.target.value})} required/>
                    <button type="submit" className="app-btn-primary w-full py-4 mt-2 font-black tracking-widest uppercase">Create Vault</button>
                </form>
            </ModalLayout>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // --- ৭. মেইন ড্যাশবোর্ড রেন্ডার ---
  return (
    <DashboardLayout 
        onLogout={handleLogout}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        currentUser={currentUser}
        currentBook={currentBook}
        onBack={() => setCurrentBook(null)}
        onFabClick={() => {
            if (activeSection === 'books') setTriggerFab(true);
            else setShowFabModal(true);
        }}
        // ✅ UPDATE: Passing handlers to open specific modals from DashboardLayout
        onOpenAnalytics={() => setModalType('analytics')}
        onOpenExport={() => setModalType('export')}
        onOpenShare={() => setModalType('share')}
        onEditBook={() => setModalType('editBook')}
        onDeleteBook={() => setModalType('deleteBookConfirm')}
    >
        <AnimatePresence mode="wait">
            <motion.div 
                key={activeSection + (currentBook?._id || '')}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
            >
                {!isOnline && (
                    <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 anim-fade-up">
                        <WifiOff size={18} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Protocol Offline: Data will be queued for sync</span>
                    </div>
                )}
                {currentComponent}
            </motion.div>
        </AnimatePresence>

        {/* সেন্ট্রালাইজড স্মার্ট প্লাস বাটন মডাল */}
        <AnimatePresence>
            {showFabModal && (
                <ModalLayout title="Smart Entry System" onClose={() => setShowFabModal(false)}>
                    <div className="grid grid-cols-1 gap-4 py-2">
                        <button 
                            onClick={() => { setActiveSection('books'); setCurrentBook(null); setTriggerFab(true); setShowFabModal(false); }} 
                            className="w-full p-6 bg-orange-500/5 border border-orange-500/10 rounded-3xl flex items-center gap-5 hover:bg-orange-500 hover:text-white transition-all group"
                        >
                             <div className="p-3 bg-orange-500 rounded-2xl text-white group-hover:bg-white group-hover:text-orange-500"><Book size={24}/></div>
                             <div className="text-left">
                                <p className="font-black uppercase text-xs tracking-widest">Create Ledger</p>
                                <p className="text-[10px] font-bold opacity-60">Open a new secure financial vault</p>
                             </div>
                        </button>
                    </div>
                </ModalLayout>
            )}
        </AnimatePresence>
    </DashboardLayout>
  );
}