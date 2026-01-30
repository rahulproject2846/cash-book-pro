"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, WifiOff, Book, History } from 'lucide-react';
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
  
  // MODAL & UI STATES
  const [globalModalType, setGlobalModalType] = useState<'none' | 'addBook' | 'addEntry' | 'analytics' | 'export' | 'share' | 'editBook' | 'deleteBookConfirm'>('none');
  const [bookForm, setBookForm] = useState({ name: '', description: '' });
  const [triggerFab, setTriggerFab] = useState(false);
  const [showFabModal, setShowFabModal] = useState(false);
  
  // UX & SYNC STATES
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false); 
  const [lastBackPress, setLastBackPress] = useState(0);

  // --- ১. অফলাইন সিঙ্ক প্রোটোকল (ROBUST VERSION) ---
  const syncOfflineData = useCallback(async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;
    if (isSyncing || !currentUser?._id) return;

    const pending = await db.entries.where('synced').equals(0).toArray();
    if (pending.length === 0) return;

    setIsSyncing(true);
    const syncToastId = toast.loading(`Vault Sync: Uploading ${pending.length} records...`);

    try {
      for (const entry of pending) {
        if (entry.isDeleted === 1 && entry._id) {
            await fetch(`/api/entries/${entry._id}`, { method: 'DELETE' });
            await db.entries.delete(entry.localId!);
            continue;
        }

        const apiMethod = entry._id ? 'PUT' : 'POST';
        const apiUrl = entry._id ? `/api/entries/${entry._id}` : '/api/entries';
        
        const res = await fetch(apiUrl, {
          method: apiMethod,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...entry, userId: currentUser._id }),
        });

        if (res.ok) {
          const serverData = await res.json();
          await db.entries.update(entry.localId!, { 
            synced: 1, 
            _id: entry._id || serverData.entry?._id 
          });
        }
      }
      toast.success("Cloud Sync Complete", { id: syncToastId });
      window.dispatchEvent(new Event('vault-updated'));
    } catch (err) {
      toast.error("Sync Paused (Network Unstable)", { id: syncToastId });
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, currentUser]);

  // --- ২. ইন্টেলিজেন্ট হাইড্রেশন ---
  const hydrateLocalDatabase = useCallback(async (user: any) => {
      if (!navigator.onLine || !user?._id) return;
      try {
        const [booksRes, entriesRes] = await Promise.all([
            fetch(`/api/books?userId=${user._id}`),
            fetch(`/api/entries/all?userId=${user._id}`)
        ]);

        if (booksRes.ok && entriesRes.ok) {
            const books = await booksRes.json();
            const entriesData = await entriesRes.json();
            const entries = Array.isArray(entriesData) ? entriesData : (entriesData.entries || []);

            if (books.length > 0) await db.books.bulkPut(books);
            if (entries.length > 0) {
                await db.transaction('rw', db.entries, async () => {
                    for (const item of entries) {
                        const localItem = await db.entries.where('_id').equals(item._id).first();
                        await db.entries.put({
                            ...item,
                            localId: localItem?.localId,
                            synced: 1,
                            isDeleted: 0
                        });
                    }
                });
            }
            setIsHydrated(true);
            window.dispatchEvent(new Event('vault-updated'));
        }
      } catch (err) { console.error("Hydration Failed", err); }
  }, []);

  // --- ৩. সেশন এবং লাইভ মনিটরিং ---
  useEffect(() => {
    const savedUser = localStorage.getItem('cashbookUser');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setCurrentUser(user);
      setIsLoggedIn(true);
      if (!isHydrated) hydrateLocalDatabase(user);
    }
    setTimeout(() => setIsLoading(false), 800);
  }, [hydrateLocalDatabase, isHydrated]);

  useEffect(() => {
    const handleOnlineStatus = () => {
      setIsOnline(navigator.onLine);
      if (navigator.onLine) syncOfflineData();
    };
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', () => setIsOnline(false));
    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', () => setIsOnline(false));
    };
  }, [syncOfflineData]);

  // --- ৪. হ্যান্ডলার ফাংশনস ---
  const handleAuthSuccess = (userData: any) => {
    localStorage.setItem('cashbookUser', JSON.stringify(userData));
    setCurrentUser(userData);
    setIsLoggedIn(true);
    hydrateLocalDatabase(userData);
  };

  const handleLogout = async () => {
    localStorage.removeItem('cashbookUser');
    try { await Promise.all([db.books.clear(), db.entries.clear()]); } catch (err) {}
    setIsLoggedIn(false);
    setCurrentUser(null);
    setCurrentBook(null);
    setIsHydrated(false);
    toast.success('Vault Locked');
  };

  // --- ৫. রেন্ডার গেটওয়ে ---
  if (isLoading) return (
    <div className="min-h-screen bg-[#0F0F0F] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="animate-spin text-orange-500" size={48} />
        <p className="text-[10px] font-black uppercase tracking-[5px] text-[#2D2D2D] animate-pulse">Establishing Secure Port</p>
    </div>
  );

  if (!isLoggedIn) {
    return <AuthScreen onLoginSuccess={handleAuthSuccess} />;
  }

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
                
                {/* সেকশন রেন্ডারিং */}
                {activeSection === 'books' && (
                    <BooksSection 
                        currentUser={currentUser} currentBook={currentBook} setCurrentBook={setCurrentBook} 
                        triggerFab={triggerFab} setTriggerFab={setTriggerFab}
                        externalModalType={globalModalType as any} setExternalModalType={setGlobalModalType as any}
                        bookForm={bookForm} setBookForm={setBookForm}
                    />
                )}
                {activeSection === 'reports' && <ReportsSection currentUser={currentUser} />}
                {activeSection === 'timeline' && <TimelineSection currentUser={currentUser} />}
                {activeSection === 'settings' && <SettingsSection currentUser={currentUser} setCurrentUser={setCurrentUser} />}
                {activeSection === 'profile' && <ProfileSection currentUser={currentUser} setCurrentUser={setCurrentUser} onLogout={handleLogout} />}
            </motion.div>
        </AnimatePresence>

        {/* FAB Shortcut Modal */}
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
                    </div>
                </ModalLayout>
            )}
        </AnimatePresence>
    </DashboardLayout>
  );
}