"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, WifiOff, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

// Core Engine
import { db } from '@/lib/offlineDB';
import AuthScreen from '@/components/Auth/AuthScreen';

// UI Shell
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { BooksSection } from '@/components/Sections/BooksSection';
import { ReportsSection } from '@/components/Sections/ReportsSection';
import { TimelineSection } from '@/components/Sections/TimelineSection';
import { SettingsSection } from '@/components/Sections/SettingsSection';
import { ProfileSection } from '@/components/Sections/ProfileSection';

// Global Modals
import { ModalLayout } from '@/components/Modals';
import { AdvancedExportModal } from '@/components/Modals/AdvancedExportModal';
import { AnalyticsChart } from '@/components/AnalyticsChart';
import { ShareModal } from '@/components/Modals/ShareModal';

// --- Define Strict Type for Navigation ---
type NavSection = 'books' | 'reports' | 'timeline' | 'settings' | 'profile';

export default function CashBookApp() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentBook, setCurrentBook] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // FIX: Strictly typing the state to match DashboardLayout requirements
  const [activeSection, setActiveSection] = useState<NavSection>('books');
  
  const [isOnline, setIsOnline] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);
  
  const isSyncingRef = useRef(false);
  const hydrationDoneRef = useRef(false);

  // --- MODAL STATES ---
  const [globalModal, setGlobalModal] = useState<'none' | 'addBook' | 'editBook' | 'analytics' | 'export' | 'share' | 'deleteBookConfirm'>('none');
  const [activeEntries, setActiveEntries] = useState<any[]>([]); 
  const [bookForm, setBookForm] = useState({ name: '', description: '' });
  
  const [triggerFab, setTriggerFab] = useState(false);
  const [showFabModal, setShowFabModal] = useState(false);

  // --- ১. স্মার্ট বাটন ক্লিক লজিক ---
  const handleFabClick = () => {
    if (currentBook) {
        setTriggerFab(true); 
    } else if (activeSection === 'books') {
        setGlobalModal('addBook');
    } else {
        setShowFabModal(true);
    }
  };

  // --- ২. মডাল ডেটা প্রিপারেশন ---
  const handleOpenGlobalModal = async (type: 'analytics' | 'export' | 'share') => {
    if (!currentBook?._id) return toast.error("Select a vault first");
    const data = await db.entries
        .where('bookId').equals(currentBook._id)
        .and(item => item.isDeleted === 0)
        .toArray();
    setActiveEntries(data);
    setGlobalModal(type);
  };

  // --- ৩. ব্যাকগ্রাউন্ড সিঙ্ক ইঞ্জিন ---
  const syncOfflineData = useCallback(async () => {
    if (!navigator.onLine || isSyncingRef.current || !currentUser?._id) return;
    const pending = await db.entries.where('synced').equals(0).toArray();
    if (pending.length === 0) return;
    isSyncingRef.current = true;
    try {
      for (const entry of pending) {
        if (entry.isDeleted === 1 && entry._id) {
          await fetch(`/api/entries/${entry._id}`, { method: 'DELETE' });
          await db.entries.delete(entry.localId!);
          continue;
        }
        const { _id, localId, synced, isDeleted, ...payload } = entry;
        const res = await fetch(entry._id ? `/api/entries/${entry._id}` : '/api/entries', {
          method: entry._id ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, userId: currentUser._id }),
        });
        if (res.ok || res.status === 409) {
          const serverData = await res.json();
          await db.entries.update(entry.localId!, {
            synced: 1,
            _id: serverData.entry?._id || serverData.data?._id || entry._id
          });
        }
      }
      window.dispatchEvent(new Event('vault-updated'));
    } catch (err) { console.warn("Sync Int."); } 
    finally { isSyncingRef.current = false; }
  }, [currentUser?._id]);

  // --- ৪. ক্লাউড হাইড্রেশন ---
  const hydrateVault = useCallback(async (user: any) => {
    if (!navigator.onLine || !user?._id || hydrationDoneRef.current) return;
    hydrationDoneRef.current = true;
    try {
      const [booksRes, entriesRes] = await Promise.all([
          fetch(`/api/books?userId=${user._id}`),
          fetch(`/api/entries/all?userId=${user._id}`)
      ]);
      if (booksRes.ok && entriesRes.ok) {
          const bData = await booksRes.json();
          const eData = await entriesRes.json();
          const books = Array.isArray(bData) ? bData : (bData.books || []);
          const entries = Array.isArray(eData) ? eData : (eData.entries || []);
          if (books.length > 0) await db.books.bulkPut(books);
          if (entries.length > 0) {
              await db.transaction('rw', db.entries, async () => {
                  for (const item of entries) {
                      const local = await db.entries.where('_id').equals(item._id).first();
                      await db.entries.put({
                          ...item,
                          localId: local?.localId,
                          synced: 1,
                          isDeleted: 0,
                          status: (item.status || 'completed').toLowerCase(),
                          type: (item.type || 'expense').toLowerCase()
                      });
                  }
              });
          }
          setIsHydrated(true);
          window.dispatchEvent(new Event('vault-updated'));
          syncOfflineData();
      }
    } catch (err) { hydrationDoneRef.current = false; }
  }, [syncOfflineData]);

  // --- ৫. লাইভ ইভেন্ট মনিটরিং ---
  useEffect(() => {
    const savedUser = localStorage.getItem('cashbookUser');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setCurrentUser(user);
      setIsLoggedIn(true);
      if (!isHydrated) hydrateVault(user);
    }
    const timer = setTimeout(() => setIsLoading(false), 1000);
    const handleNetwork = () => {
        setIsOnline(navigator.onLine);
        if (navigator.onLine) syncOfflineData();
    };
    window.addEventListener('online', handleNetwork);
    window.addEventListener('offline', () => setIsOnline(false));
    return () => {
        clearTimeout(timer);
        window.removeEventListener('online', handleNetwork);
    };
  }, [hydrateVault, syncOfflineData, isHydrated]);

  // --- ৬. সিস্টেম হ্যান্ডলারস ---
  const handleLogout = async () => {
    localStorage.removeItem('cashbookUser');
    await Promise.all([db.books.clear(), db.entries.clear()]);
    window.location.reload();
  };

  const handleLoginSuccess = (user: any) => {
    localStorage.setItem('cashbookUser', JSON.stringify(user));
    setCurrentUser(user);
    setIsLoggedIn(true);
    hydrateVault(user);
  };

  const handleToggleShare = async (enable: boolean) => {
    if (!currentBook?._id) return;
    try {
        const res = await fetch('/api/books/share', { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ bookId: currentBook._id, enable }) 
        });
        const data = await res.json();
        if (res.ok) {
            
            setCurrentBook({ 
                ...currentBook, 
                isPublic: data.data.isPublic, 
                shareToken: data.data.shareToken 
            });
            toast.success(enable ? "Vault is Live" : "Vault is Private");
        }
    } catch (err) { toast.error("Share failed"); }
  };

  if (isLoading) return (
    <div className="min-h-screen bg-[#0F0F0F] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="animate-spin text-orange-500" size={48} />
        <p className="text-[10px] font-black uppercase tracking-[5px] text-white/10">Synchronizing</p>
    </div>
  );
  
  if (!isLoggedIn) return <AuthScreen onLoginSuccess={handleLoginSuccess} />;

  // Sections Mapping
  const sectionMap: Record<NavSection, React.ReactNode> = {
    books: <BooksSection currentUser={currentUser} currentBook={currentBook} setCurrentBook={setCurrentBook} triggerFab={triggerFab} setTriggerFab={setTriggerFab} externalModalType={globalModal} setExternalModalType={setGlobalModal} bookForm={bookForm} setBookForm={setBookForm} />,
    reports: <ReportsSection currentUser={currentUser} />,
    timeline: <TimelineSection currentUser={currentUser} onBack={() => setActiveSection('books')} />,
    settings: <SettingsSection currentUser={currentUser} setCurrentUser={setCurrentUser} />,
    profile: <ProfileSection currentUser={currentUser} setCurrentUser={setCurrentUser} onLogout={handleLogout} />
  };

  return (
    <DashboardLayout
        // @ts-ignore
        activeSection={activeSection} setActiveSection={setActiveSection}
        onLogout={handleLogout} currentUser={currentUser}
        currentBook={currentBook} onBack={() => setCurrentBook(null)}
        onFabClick={handleFabClick}
        onOpenAnalytics={() => handleOpenGlobalModal('analytics')}
        onOpenExport={() => handleOpenGlobalModal('export')}
        onOpenShare={() => setGlobalModal('share')}
        onEditBook={() => { if (currentBook) { setBookForm({ name: currentBook.name, description: currentBook.description || "" }); setGlobalModal('editBook'); } }}
        onDeleteBook={() => setGlobalModal('deleteBookConfirm')}
    >
        <AnimatePresence mode="wait">
            <motion.div key={activeSection} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                {!isOnline && <div className="mb-6 p-4 bg-orange-500/10 border border-orange-500/20 rounded-[20px] flex items-center gap-3 text-orange-500 shadow-xl"><WifiOff size={16} /><span className="text-[10px] font-black uppercase">Protocol Offline</span></div>}
                {sectionMap[activeSection]}
            </motion.div>
        </AnimatePresence>

        {/* --- GLOBAL MODAL LAYER --- */}
        <AnimatePresence>
            {globalModal === 'analytics' && currentBook && (
                <ModalLayout key="analytics-modal" title="Vault Intelligence" onClose={() => setGlobalModal('none')}>
                    <div className="h-[450px] py-4" onClick={(e) => e.stopPropagation()}><AnalyticsChart entries={activeEntries} /></div>
                </ModalLayout>
            )}

            {globalModal === 'export' && currentBook && (
                <AdvancedExportModal key="export-modal" isOpen={true} onClose={() => setGlobalModal('none')} entries={activeEntries} bookName={currentBook.name} />
            )}
            
            {globalModal === 'share' && currentBook && (
                <ShareModal key="share-modal" isOpen={true} onClose={() => setGlobalModal('none')} currentBook={currentBook} onToggleShare={handleToggleShare} />
            )}

            {showFabModal && (
                <ModalLayout title="Protocol Shortcut" onClose={() => setShowFabModal(false)}>
                    <div className="grid grid-cols-1 gap-4 p-2">
                        <button 
                            onClick={() => { 
                                setActiveSection('books'); 
                                setCurrentBook(null); 
                                setGlobalModal('addBook'); 
                                setShowFabModal(false); 
                            }} 
                            className="w-full p-6 bg-white/[0.03] border border-white/[0.05] rounded-[32px] flex items-center gap-5 group hover:bg-orange-500 transition-all duration-300"
                        >
                             <div className="p-4 bg-orange-500 rounded-2xl text-white group-hover:bg-white group-hover:text-orange-500 shadow-lg shadow-orange-500/20">
                                <Plus size={24} strokeWidth={4}/>
                             </div>
                             <div className="text-left">
                                <p className="font-black uppercase text-xs tracking-[2px] text-white">Initialize Ledger</p>
                                <p className="text-[9px] font-bold text-white/30 group-hover:text-white/60 uppercase tracking-widest mt-1">Go to Dashboard and create vault</p>
                             </div>
                        </button>
                    </div>
                </ModalLayout>
            )}
        </AnimatePresence>
    </DashboardLayout>
  );
}