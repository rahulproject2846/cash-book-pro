"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Book, Plus, WifiOff, Chrome, History } from 'lucide-react';
import toast from 'react-hot-toast';

// Core Logic & Database Protocol (v3)
import { db } from '@/lib/offlineDB';
import AuthScreen from '@/components/Auth/AuthScreen';

// Layout & Sections
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { BooksSection } from '@/components/Sections/BooksSection';
import { ReportsSection } from '@/components/Sections/ReportsSection';
import { SettingsSection } from '@/components/Sections/SettingsSection';
import { ProfileSection } from '@/components/Sections/ProfileSection';
import { TimelineSection } from '@/components/Sections/TimelineSection';
import { ModalLayout } from '@/components/Modals';

export default function CashBookApp() {
  // --- CORE STATES ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null); 
  const [currentBook, setCurrentBook] = useState<any>(null); 
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('books');
  
  // MODAL & AUTH STATES
  const [globalModalType, setGlobalModalType] = useState<'none' | 'addBook' | 'addEntry' | 'analytics' | 'export' | 'share' | 'editBook' | 'deleteBookConfirm' | 'register'>('none');
  const [bookForm, setBookForm] = useState({ name: '', description: '' });
  
  // OTP & Auth States
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ username: '', email: '', password: '' });
  
  const [triggerFab, setTriggerFab] = useState(false);
  const [showFabModal, setShowFabModal] = useState(false);
  
  // UX & SYNC STATES
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false); // Loop Breaker
  const [lastBackPress, setLastBackPress] = useState(0);

  // --- ১. অফলাইন সিঙ্ক প্রোটোকল (ROBUST VERSION) ---
  const syncOfflineData = useCallback(async () => {
    // ১. স্ট্রিক্ট চেক: নেট না থাকলে বা অলরেডি সিঙ্ক চললে চুপচাপ ফিরে যাবে
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;
    if (isSyncing) return;
    if (!currentUser?._id) return;

    // ২. পেন্ডিং ডাটা চেক (synced === 0)
    const pending = await db.entries.where('synced').equals(0).toArray();
    
    if (pending.length === 0) return;

    setIsSyncing(true);
    // ৩. টোস্ট আইডি রাখা (যাতে পরে এটাকে রিমুভ করা যায়)
    const syncToastId = toast.loading(`Vault Sync: Uploading ${pending.length} records...`);

    try {
      for (const entry of pending) {
        
        // ডিলিট রিকোয়েস্ট হ্যান্ডলিং
        if (entry.isDeleted === 1 && entry._id) {
            await fetch(`/api/entries/${entry._id}`, { method: 'DELETE' });
            await db.entries.delete(entry.localId!);
            continue;
        }

        // ক্রিয়েট বা আপডেট লজিক
        const apiMethod = entry._id ? 'PUT' : 'POST';
        const apiUrl = entry._id ? `/api/entries/${entry._id}` : '/api/entries';
        
        const payload = { 
            ...entry, 
            userId: currentUser._id,
            bookId: entry.bookId 
        };

        const res = await fetch(apiUrl, {
          method: apiMethod,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (res.ok || res.status === 409) { // 409 = Duplicate handled
          const serverData = await res.json();
          // লোকাল ডাটাবেস আপডেট: synced = 1
          await db.entries.update(entry.localId!, { 
            synced: 1, 
            _id: entry._id || serverData.entry?._id || serverData.data?._id 
          });
        }
      }
      
      // ৪. সফল হলে লোডিং টোস্ট সরিয়ে সাকসেস মেসেজ
      toast.success("Cloud Sync Complete", { id: syncToastId });
      window.dispatchEvent(new Event('vault-updated'));

    } catch (err) {
      // ৫. ফেইল করলে লোডিং সরিয়ে এরর মেসেজ (ঝুলে থাকবে না)
      toast.error("Sync Paused (Network Unstable)", { id: syncToastId });
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, currentUser]);

  // --- ২. ইন্টেলিজেন্ট হাইড্রেশন (LOOP-FREE) ---
  const hydrateLocalDatabase = useCallback(async (user: any) => {
      if (!navigator.onLine || !user?._id) return;
      
      try {
        console.log("🔄 Hydrating Local Vault...");
        const [booksRes, entriesRes] = await Promise.all([
            fetch(`/api/books?userId=${user._id}`),
            fetch(`/api/entries/all?userId=${user._id}`)
        ]);

        if (booksRes.ok && entriesRes.ok) {
            const booksData = await booksRes.json();
            const entriesData = await entriesRes.json();

            // বই সেভ করা
            const books = Array.isArray(booksData) ? booksData : (booksData.books || []);
            if (books.length > 0) await db.books.bulkPut(books);

            // এন্ট্রি সেভ করা
            const entries = Array.isArray(entriesData) ? entriesData : (entriesData.entries || []);
            if (entries.length > 0) {
                await db.transaction('rw', db.entries, async () => {
                    for (const item of entries) {
                        const localItem = await db.entries.where('_id').equals(item._id).first();
                        await db.entries.put({
                            ...item,
                            localId: localItem?.localId, // আগের localId রাখা জরুরি
                            synced: 1,
                            isDeleted: 0,
                            cid: item.cid || localItem?.cid || `cid_${Date.now()}`
                        });
                    }
                });
            }
            setIsHydrated(true); // লুপ ব্রেকার
            window.dispatchEvent(new Event('vault-updated'));
        }
      } catch (err) { console.error("Hydration Failed", err); }
  }, []);

  // --- ৩. লাইভ মনিটরিং ---
  useEffect(() => {
    const handleOnlineStatus = () => {
      setIsOnline(navigator.onLine);
      if (navigator.onLine) syncOfflineData(); // নেট আসলে সিঙ্ক হবে
    };

    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', () => setIsOnline(false));
    
    // ব্যাক বাটন হ্যান্ডলিং
    const handleBackButton = () => {
        if (currentBook) setCurrentBook(null);
        else if (activeSection !== 'books') setActiveSection('books');
        else {
            const now = Date.now();
            if (now - lastBackPress < 2000) return; 
            setLastBackPress(now);
            toast("Press back again to exit Vault", { icon: '🛡️' });
            window.history.pushState({ view: 'list' }, '');
        }
    };
    window.addEventListener('popstate', handleBackButton);

    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', () => setIsOnline(false));
      window.removeEventListener('popstate', handleBackButton);
    };
  }, [currentBook, activeSection, syncOfflineData, lastBackPress]); // ডিপেন্ডেন্সি ফিক্সড

  // --- ৪. সেশন এবং অটো-হাইড্রেশন ---
  useEffect(() => {
    const savedUser = localStorage.getItem('cashbookUser');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setCurrentUser(user);
      setIsLoggedIn(true);
      // শুধুমাত্র একবার কল হবে যদি হাইড্রেটেড না থাকে
      if (!isHydrated) hydrateLocalDatabase(user);
    }
    setTimeout(() => setIsLoading(false), 800);
  }, [hydrateLocalDatabase, isHydrated]);

  const handleLogout = async () => {
    localStorage.removeItem('cashbookUser');
    try {
        await Promise.all([db.books.clear(), db.entries.clear()]);
    } catch (err) {}
    setIsLoggedIn(false);
    setCurrentUser(null);
    setCurrentBook(null);
    setIsHydrated(false);
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
        hydrateLocalDatabase(data.user); // লগইনের পর ফোর্স কল
        toast.success(`Welcome Back, ${data.user.username}`);
    } else {
        toast.error(data.message || 'Invalid Credentials');
    }
  };

  const handleRegisterInitiate = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpSent(true); 
    toast.success('Security code sent to your email');
  };

  const handleFinalRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/auth/register', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ ...registerForm, otp: otpCode }) 
    });
    const data = await res.json();
    if (res.ok) { 
      toast.success('Vault Created! Please Login.'); 
      setGlobalModalType('none'); 
      setOtpSent(false);
      setOtpCode('');
    } else { 
      toast.error(data.message || 'Verification Failed'); 
    }
  };

  const handleGoogleLogin = () => {
    toast("Redirecting to Google Secure Auth...", { icon: '🚀' });
  };

  // --- ৫. রেন্ডার গেটওয়ে ---
  if (isLoading) return (
    <div className="min-h-screen bg-[#0F0F0F] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="animate-spin text-orange-500" size={48} />
        <p className="text-[10px] font-black uppercase tracking-[5px] text-[#2D2D2D] animate-pulse">Establishing Secure Port</p>
    </div>
  );
  // --- ৫. ডাইনামিক সেকশন কনফিগারেশন ---
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
          externalModalType={globalModalType}
          setExternalModalType={setGlobalModalType}
          bookForm={bookForm}
          setBookForm={setBookForm}
        />
      ) 
    },
    { id: 'reports', component: <ReportsSection currentUser={currentUser} /> },
    { id: 'timeline', component: <TimelineSection currentUser={currentUser} /> }, 
    { id: 'settings', component: <SettingsSection currentUser={currentUser} setCurrentUser={setCurrentUser} /> },
    { id: 'profile', component: <ProfileSection currentUser={currentUser} setCurrentUser={setCurrentUser} onLogout={handleLogout} /> },
  ];

  const currentComponent = dashboardSections.find(s => s.id === activeSection)?.component;

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F0F0F] p-4 font-sans">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="app-card w-full max-w-md p-10 text-center relative overflow-hidden border-[#2D2D2D]">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.5)]"></div>
          <h2 className="text-5xl font-black mb-10 text-white italic tracking-tighter uppercase leading-none">
            VAULT<span className="text-orange-500">PRO.</span>
          </h2>
          
          <form onSubmit={handleLogin} className="space-y-4">
              <input type="email" placeholder="IDENTITY EMAIL" className="app-input font-bold" value={loginForm.email} onChange={e => setLoginForm({...loginForm, email: e.target.value})} required />
              <input type="password" placeholder="SECURITY KEY" className="app-input font-bold" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} required />
              <button type="submit" className="app-btn-primary w-full py-4.5 shadow-2xl">UNSEAL ACCESS</button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-[#2D2D2D]"></span></div>
            <div className="relative flex justify-center text-[9px] uppercase font-black tracking-widest"><span className="bg-[#1A1A1B] px-4 text-[#444]">Secure Middleware</span></div>
          </div>

          <button onClick={handleGoogleLogin} className="w-full py-4 border-2 border-[#2D2D2D] rounded-2xl flex items-center justify-center gap-3 text-[11px] font-black uppercase tracking-widest text-white hover:bg-white hover:text-black transition-all">
             <Chrome size={18} /> Continue with Google
          </button>
          
          <p onClick={() => setGlobalModalType('register')} className="text-[#888888] text-[10px] mt-10 hover:text-orange-500 cursor-pointer font-black uppercase tracking-widest transition-colors">
              New Operator? <span className="text-orange-500 underline decoration-2">Initialize Account</span>
          </p>
        </motion.div>

        <AnimatePresence>
          {globalModalType === 'register' && (
            <ModalLayout title="Vault Initialization" onClose={() => {setGlobalModalType('none'); setOtpSent(false);}}>
                {!otpSent ? (
                  <form onSubmit={handleRegisterInitiate} className="space-y-4">
                      <input type="text" placeholder="FULL OPERATOR NAME" className="app-input font-bold" value={registerForm.username} onChange={e => setRegisterForm({...registerForm, username: e.target.value})} required/>
                      <input type="email" placeholder="SECURE EMAIL ADDRESS" className="app-input font-bold" value={registerForm.email} onChange={e => setRegisterForm({...registerForm, email: e.target.value})} required/>
                      <input type="password" placeholder="CREATE SECURITY KEY" className="app-input font-bold" value={registerForm.password} onChange={e => setRegisterForm({...registerForm, password: e.target.value})} required/>
                      <button type="submit" className="app-btn-primary w-full py-4 mt-2">SEND VERIFICATION CODE</button>
                  </form>
                ) : (
                  <form onSubmit={handleFinalRegister} className="space-y-5">
                      <div className="p-4 bg-orange-500/5 border border-orange-500/10 rounded-2xl text-center"><p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">Code sent to {registerForm.email}</p></div>
                      <input type="text" placeholder="ENTER 6-DIGIT CODE" className="app-input text-center text-2xl font-black tracking-[10px]" maxLength={6} value={otpCode} onChange={e => setOtpCode(e.target.value)} required/>
                      <button type="submit" className="app-btn-primary w-full py-4">VALIDATE & INITIALIZE</button>
                  </form>
                )}
            </ModalLayout>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // --- ৬. ড্যাশবোর্ড রেন্ডার ---
  return (
    <DashboardLayout 
        activeSection={activeSection} setActiveSection={setActiveSection}
        onLogout={handleLogout} currentUser={currentUser}
        currentBook={currentBook} onBack={() => setCurrentBook(null)}
        onFabClick={() => { if (activeSection === 'books') setTriggerFab(true); else setShowFabModal(true); }}
        onOpenAnalytics={() => setGlobalModalType('analytics')}
        onOpenExport={() => setGlobalModalType('export')}
        onOpenShare={() => setGlobalModalType('share')}
        onEditBook={() => {
            if (currentBook) {
                setBookForm({ name: currentBook.name, description: currentBook.description || "" });
                setGlobalModalType('editBook');
            }
        }}
        onDeleteBook={() => setGlobalModalType('deleteBookConfirm')}
    >
        <AnimatePresence mode="wait">
            <motion.div key={activeSection + (currentBook?._id || '')} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                {!isOnline && (
                    <div className="mb-6 p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center gap-3 text-orange-500">
                        <WifiOff size={20} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Protocol Offline: Data queued for sync</span>
                    </div>
                )}
                {currentComponent}
            </motion.div>
        </AnimatePresence>

        {/* FAB Modal */}
        <AnimatePresence>
            {showFabModal && (
                <ModalLayout title="Protocol Shortcut" onClose={() => setShowFabModal(false)}>
                    <div className="grid grid-cols-1 gap-4">
                        <button onClick={() => { setActiveSection('books'); setCurrentBook(null); setTriggerFab(true); setShowFabModal(false); }} className="w-full p-6 bg-orange-500/5 border border-orange-500/10 rounded-3xl flex items-center gap-5 group hover:bg-orange-500 transition-all">
                             <div className="p-3 bg-orange-500 rounded-2xl text-white group-hover:bg-white group-hover:text-orange-500"><Book size={24}/></div>
                             <div className="text-left">
                                <p className="font-black uppercase text-xs tracking-widest group-hover:text-white">New Ledger</p>
                                <p className="text-[9px] font-bold text-[#555] group-hover:text-white/60">Initialize a new financial vault</p>
                             </div>
                        </button>
                        <button onClick={() => { setActiveSection('timeline'); setShowFabModal(false); }} className="w-full p-6 bg-blue-500/5 border border-blue-500/10 rounded-3xl flex items-center gap-5 group hover:bg-blue-500 transition-all">
                             <div className="p-3 bg-blue-500 rounded-2xl text-white group-hover:bg-white group-hover:text-blue-500"><History size={24}/></div>
                             <div className="text-left">
                                <p className="font-black uppercase text-xs tracking-widest group-hover:text-white">Global Timeline</p>
                                <p className="text-[9px] font-bold text-[#555] group-hover:text-white/60">Audit all transactions chronological</p>
                             </div>
                        </button>
                    </div>
                </ModalLayout>
            )}
        </AnimatePresence>
    </DashboardLayout>
  );
}