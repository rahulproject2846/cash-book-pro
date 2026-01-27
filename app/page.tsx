"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// 🔥 1. Book & Plus added to imports
import { Loader2, Book, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

// Layout & Sections
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { BooksSection } from '@/components/Sections/BooksSection';
import { ReportsSection } from '@/components/Sections/ReportsSection';
import { SettingsSection } from '@/components/Sections/SettingsSection';
import { ProfileSection } from '@/components/Sections/ProfileSection';
import { ModalLayout } from '@/components/Modals';

interface UserState {
  _id: string;
  username: string;
  email: string;
  categories?: string[];
  currency?: string;
  preferences?: any;
}

export default function CashBookApp() {
  // --- 1. Core States ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserState | null>(null); 
  const [currentBook, setCurrentBook] = useState<any>(null); 
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('books');
  const [modalType, setModalType] = useState<'none' | 'register'>('none');

  // New State for FAB (Floating Action Button)
  const [triggerFab, setTriggerFab] = useState(false);
  
  // 🔥 2. New State for FAB Modal
  const [showFabModal, setShowFabModal] = useState(false);

  // Form States
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ username: '', email: '', password: '' });

  // --- 2. Initial Load ---
  useEffect(() => {
    const savedUser = localStorage.getItem('cashbookUser');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
      setIsLoggedIn(true);
    }
    setIsLoading(false);
  }, []);

  // --- 3. Handlers ---
  const handleLogout = () => {
    localStorage.removeItem('cashbookUser');
    setIsLoggedIn(false);
    setCurrentUser(null);
    setCurrentBook(null);
    toast.success('Vault Locked');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
    });
    if (res.ok) {
        const user = await res.json();
        localStorage.setItem('cashbookUser', JSON.stringify(user));
        setCurrentUser(user);
        setIsLoggedIn(true);
        toast.success(`Welcome, ${user.username}`);
    } else {
        toast.error('Invalid Credentials');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerForm),
    });
    if (res.ok) {
        toast.success('Account Created! Please Login.');
        setModalType('none');
        setRegisterForm({ username: '', email: '', password: '' });
    } else {
        toast.error('Registration Failed');
    }
  };

  // 🔥 3. Smart FAB Handler
  const handleFabClick = () => {
    if (activeSection === 'books') {
        // If already in Dashboard/Books, trigger internal action
        setTriggerFab(true);
    } else {
        // If in other tabs, show options
        setShowFabModal(true);
    }
  };

  // --- 4. Dashboard Configuration ---
  const dashboardSections = [
    { 
      id: 'books', 
      name: currentBook ? currentBook.name : 'Ledgers', 
      component: (
        <BooksSection 
            currentUser={currentUser} 
            currentBook={currentBook} 
            setCurrentBook={setCurrentBook} 
            triggerFab={triggerFab} 
            setTriggerFab={setTriggerFab} 
        />
      ) 
    },
    { 
      id: 'reports', 
      name: 'Analytics', 
      component: <ReportsSection currentUser={currentUser} /> 
    },
    { 
      id: 'settings', 
      name: 'System', 
      component: (
        <SettingsSection 
            currentUser={currentUser} 
            setCurrentUser={setCurrentUser} 
        />
      ) 
    },
    { 
      id: 'profile', 
      name: 'Profile', 
      component: (
        <ProfileSection 
            currentUser={currentUser} 
            setCurrentUser={setCurrentUser} 
            onLogout={handleLogout} 
        />
      ) 
    },
  ];

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-[var(--bg-app)]"><Loader2 className="animate-spin text-orange-500" size={40} /></div>;

  // --- 5. AUTH UI ---
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-app)] p-4 anim-fade-up">
        <div className="app-card w-full max-w-md p-10 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-orange-500"></div>
          <h2 className="text-5xl font-black mb-10 text-[var(--text-main)] italic tracking-tighter uppercase leading-none">
            CASH<span className="text-orange-500">BOOK.</span>
          </h2>
          
          <form onSubmit={handleLogin} className="space-y-5">
              <input 
                type="email" 
                placeholder="EMAIL ADDRESS" 
                className="app-input font-bold tracking-wider" 
                value={loginForm.email} 
                onChange={e => setLoginForm({...loginForm, email: e.target.value})} 
                required
              />
              <input 
                type="password" 
                placeholder="PASSWORD" 
                className="app-input font-bold tracking-wider" 
                value={loginForm.password} 
                onChange={e => setLoginForm({...loginForm, password: e.target.value})} 
                required
              />
              <button type="submit" className="app-btn app-btn-primary w-full py-4 shadow-xl">
                Unlock Vault
              </button>
          </form>
          
          <p onClick={() => setModalType('register')} className="text-[var(--text-muted)] text-xs mt-6 hover:text-orange-500 cursor-pointer font-bold uppercase tracking-widest transition-colors">
              New user? <span className="text-orange-500 underline">Create Account</span>
          </p>
        </div>

        <AnimatePresence>
          {modalType === 'register' && (
            <ModalLayout title="Create Account" onClose={() => setModalType('none')}>
                <form onSubmit={handleRegister} className="space-y-5">
                    <div>
                      <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1.5 block">Full Name</label>
                      <input type="text" placeholder="YOUR NAME" className="app-input font-bold" value={registerForm.username} onChange={e => setRegisterForm({...registerForm, username: e.target.value})} required/>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1.5 block">Email</label>
                      <input type="email" placeholder="EMAIL ADDRESS" className="app-input font-bold" value={registerForm.email} onChange={e => setRegisterForm({...registerForm, email: e.target.value})} required/>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1.5 block">Security Key</label>
                      <input type="password" placeholder="PASSWORD" className="app-input font-bold" value={registerForm.password} onChange={e => setRegisterForm({...registerForm, password: e.target.value})} required/>
                    </div>
                    <button type="submit" className="app-btn app-btn-primary w-full py-4 mt-2">
                        Initialize Account
                    </button>
                </form>
            </ModalLayout>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // --- 6. MAIN DASHBOARD (UPDATED RETURN) ---
  return (
    <>
        <DashboardLayout 
            sections={dashboardSections} 
            onLogout={handleLogout}
            activeSection={activeSection}
            setActiveSection={setActiveSection}
            currentUser={currentUser}
            // 🔥 Updated Handler
            onFabClick={handleFabClick}
        />

        {/* 🔥 Smart FAB Modal */}
        <AnimatePresence>
            {showFabModal && (
                <ModalLayout title="Quick Action Vault" onClose={() => setShowFabModal(false)}>
                    <div className="space-y-3">
                        <button 
                            onClick={() => { setActiveSection('books'); setCurrentBook(null); setTriggerFab(true); setShowFabModal(false); }}
                            className="w-full p-5 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center gap-4 text-orange-500 hover:bg-orange-500 hover:text-white transition-all group"
                        >
                            <div className="p-3 bg-orange-500 rounded-xl text-white group-hover:bg-white group-hover:text-orange-500"><Book size={20}/></div>
                            <div className="text-left">
                                <p className="font-black uppercase text-xs tracking-widest">New Ledger</p>
                                <p className="text-[10px] font-bold opacity-60">Initialize a new financial vault</p>
                            </div>
                        </button>

                        <button 
                            onClick={() => { setActiveSection('books'); setShowFabModal(false); }}
                            className="w-full p-5 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center gap-4 text-blue-500 hover:bg-blue-500 hover:text-white transition-all group"
                        >
                            <div className="p-3 bg-blue-500 rounded-xl text-white group-hover:bg-white group-hover:text-blue-500"><Plus size={20}/></div>
                            <div className="text-left">
                                <p className="font-black uppercase text-xs tracking-widest">New Entry</p>
                                <p className="text-[10px] font-bold opacity-60">Log record in last active book</p>
                            </div>
                        </button>
                    </div>
                </ModalLayout>
            )}
        </AnimatePresence>
    </>
  );
}