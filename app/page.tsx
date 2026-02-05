"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, WifiOff } from 'lucide-react';
import toast from 'react-hot-toast';

// Core Engine
import { db } from '@/lib/offlineDB';
import AuthScreen from '@/components/Auth/AuthScreen';

// UI Shell & Layout
import { DashboardLayout } from '@/components/Layout/DashboardLayout';

// Domain-Driven Sections (Updated Structure)
import { BooksSection } from '@/components/Sections/Books/BooksSection';
import { ReportsSection } from '@/components/Sections/Reports/ReportsSection';
import { TimelineSection } from '@/components/Sections/Timeline/TimelineSection';
import { SettingsSection } from '@/components/Sections/Settings/SettingsSection';
import { ProfileSection } from '@/components/Sections/Profile/ProfileSection';

// Global Modal Engine
import { useModal } from '@/context/ModalContext';

// --- Define Strict Type for Navigation ---
type NavSection = 'books' | 'reports' | 'timeline' | 'settings' | 'profile';

export default function CashBookApp() {
  const { openModal, closeModal, view } = useModal();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentBook, setCurrentBook] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<NavSection>('books');
  
  const [isOnline, setIsOnline] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);
  
  const isSyncingRef = useRef(false);
  const hydrationDoneRef = useRef(false);

  // --- MODAL DATA STATES ---
  const [bookForm, setBookForm] = useState({ name: '', description: '' });
  const [triggerFab, setTriggerFab] = useState(false);

  // --- ১. ব্যাকগ্রাউন্ড সিঙ্ক ইঞ্জিন (Restored Logic with 409 Fix) ---
  const syncOfflineData = useCallback(async () => {
    if (!navigator.onLine || isSyncingRef.current || !currentUser?._id) return;
    
    const pending = await db.entries.where('synced').equals(0).toArray();
    if (pending.length === 0) return;

    isSyncingRef.current = true;
    try {
      for (const entry of pending) {
        // ডিলিট প্রোটোকল
        if (entry.isDeleted === 1 && entry._id) {
          await fetch(`/api/entries/${entry._id}`, { method: 'DELETE' });
          await db.entries.delete(entry.localId!);
          continue;
        }

        const { localId, synced, isDeleted, ...payload } = entry;
        
        // সার্ভারে ডাটা পাঠানো
        const res = await fetch(entry._id ? `/api/entries/${entry._id}` : '/api/entries', {
          method: entry._id ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, userId: currentUser._id }),
        });

        // 409 Conflict Handling
        if (res.ok || res.status === 409) {
          const serverData = await res.json();
          const serverId = serverData.data?._id || serverData.entry?._id || entry._id;
          
          await db.entries.update(entry.localId!, {
            synced: 1,
            _id: serverId
          });
        }
      }
      window.dispatchEvent(new Event('vault-updated'));
    } catch (err) { 
        console.warn("Sync Int."); 
    } finally { 
        isSyncingRef.current = false; 
    }
  }, [currentUser?._id]);

  // --- ২. মডাল কলব্যাক লজিক (RESTORED: Full Logic with editTarget Support) ---
  
  const handleSaveEntryLogic = async (data: any, editTarget?: any, vaultInstance?: any) => {
    // এখানে vaultInstance থেকে saveEntry এবং fetchData কল করা হবে
    if (!vaultInstance) return toast.error("Vault Engine not ready");
    
    try {
        const success = await vaultInstance.saveEntry(data, editTarget);
        if (success) {
            await vaultInstance.fetchData(); // ড্যাশবোর্ড ডাটা রিফ্রেশ
            closeModal(); // মডাল ক্লোজ
            window.dispatchEvent(new Event('vault-updated')); // ইউআই সিঙ্ক
            toast.success("Entry Secured");
            if (navigator.onLine) syncOfflineData();
        }
    } catch (err) {
        toast.error("Protocol Sync Failure");
    }
  };

  const handleDeleteEntryLogic = async (entry: any, vaultInstance?: any) => {
    if (!vaultInstance) return;
    try {
        await vaultInstance.deleteEntry(entry);
        closeModal();
        window.dispatchEvent(new Event('vault-updated'));
        toast.success("Entry Terminated");
        if (navigator.onLine) syncOfflineData();
    } catch (err) {
        toast.error("Termination Failed");
    }
  };

  // --- ৩. গ্লোবাল বুক সেভ লজিক (RESTORED) ---
const handleSaveBookGlobal = async (formData: any) => {
    // 🔥 সিলেকশন আইডি ইজ দ্য আল্টিমেট ট্রুথ
    const targetId = currentBook?._id || currentBook?.id || formData?._id;
    const isEditMode = !!targetId; 

    try {
        const res = await fetch('/api/books', { // সবসময় মেইন এপিআই রুট
            method: isEditMode ? 'PUT' : 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ 
                ...formData, 
                _id: targetId, // আইডি বডির ভেতরে পাঠানো হচ্ছে
                userId: currentUser._id 
            }), 
        });
        
        if (res.ok) {
            const result = await res.json();
            await db.books.put({ ...(result.book || result.data), updatedAt: Date.now() });
            
            closeModal();
            if (!isEditMode) setCurrentBook(null); 
            
            window.dispatchEvent(new Event('vault-updated'));
            toast.success(isEditMode ? "Protocol Updated" : "Ledger Initialized");
        } else {
            const errorData = await res.json();
            toast.error(errorData.message || "Protocol Rejected");
        }
    } catch (err) { toast.error("Sync failure"); }
};

  // --- ৪. স্মার্ট বাটন ক্লিক এবং মডাল হ্যান্ডলারস ---
  const handleFabClick = () => {
    if (currentBook) {
        // BooksSection এর useEffect যাতে ডাবল ফায়ার না করে, সিগন্যাল পাঠানো হচ্ছে
        setTriggerFab(true); 
    } else if (activeSection === 'books') {
        setCurrentBook(null);
        openModal('addBook', { onSubmit: handleSaveBookGlobal, currentUser });
    } else {
        openModal('shortcut', { 
            onInitialize: () => {
                setActiveSection('books');
                setCurrentBook(null);
                openModal('addBook', { onSubmit: handleSaveBookGlobal, currentUser });
            }
        });
    }
  };

  const handleOpenGlobalModal = async (type: any) => {
    if (type === 'analytics' || type === 'export' || type === 'share') {
        if (!currentBook?._id) return toast.error("Select a vault first");
        const entries = await db.entries.where('bookId').equals(currentBook._id).and(item => item.isDeleted === 0).toArray();
        openModal(type, { entries, bookName: currentBook.name, currentBook, onToggleShare: handleToggleShare });
    }
  };

  // --- ৫. ক্লাউড হাইড্রেশন (RESTORED: Full Promise.allSettled Protocol) ---
  const hydrateVault = useCallback(async (user: any) => {
    if (!navigator.onLine || !user?._id || hydrationDoneRef.current) return;
    hydrationDoneRef.current = true;
    
    try {
      const [booksResult, entriesResult, settingsResult] = await Promise.allSettled([
          fetch(`/api/books?userId=${user._id}`),
          fetch(`/api/entries/all?userId=${user._id}`),
          fetch(`/api/user/settings?userId=${user._id}`) 
      ]);

      if (booksResult.status === 'fulfilled' && booksResult.value.ok) {
        const bData = await booksResult.value.json();
        await db.books.bulkPut(Array.isArray(bData) ? bData : (bData.books || []));
      }

      if (entriesResult.status === 'fulfilled' && entriesResult.value.ok) {
        const eData = await entriesResult.value.json();
        const entries = Array.isArray(eData) ? eData : (eData.entries || []);
        for (const item of entries) {
            await db.entries.put({ ...item, synced: 1, isDeleted: 0 });
        }
      }

      let finalUser = user;
      if (settingsResult.status === 'fulfilled' && settingsResult.value.ok) {
          const sData = await settingsResult.value.json();
          finalUser = { ...user, ...sData.user };
      }
      
      setCurrentUser(finalUser);
      localStorage.setItem('cashbookUser', JSON.stringify(finalUser));
      setIsHydrated(true);
      window.dispatchEvent(new Event('vault-updated'));
      syncOfflineData();

    } catch (err) { 
        console.error("Hydration Failed:", err);
        hydrationDoneRef.current = false;
    }
  }, [syncOfflineData]);

  // --- ৬. লাইভ ইভেন্ট মনিটরিং (RESTORED) ---
  useEffect(() => {
    const savedUser = localStorage.getItem('cashbookUser');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setCurrentUser(user);
      setIsLoggedIn(true);
      if (!isHydrated) hydrateVault(user);
    }
    const timer = setTimeout(() => setIsLoading(false), 1000);
    const handleNetwork = () => { if (navigator.onLine) syncOfflineData(); };
    window.addEventListener('online', handleNetwork);
    window.addEventListener('offline', () => setIsOnline(false));
    return () => {
        clearTimeout(timer);
        window.removeEventListener('online', handleNetwork);
    };
  }, [hydrateVault, syncOfflineData, isHydrated]);

  const handleLogout = async () => {
    localStorage.removeItem('cashbookUser');
    await Promise.all([db.books.clear(), db.entries.clear()]);
    window.location.reload();
  };

  const handleToggleShare = async (enable: boolean) => {
    if (!currentBook?._id) return;
    try {
        const res = await fetch('/api/books/share', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bookId: currentBook._id, enable }) });
        const data = await res.json();
        if (res.ok) {
            setCurrentBook({ ...currentBook, isPublic: data.data.isPublic, shareToken: data.data.shareToken });
            toast.success(enable ? "Vault is Live" : "Vault is Private");
        }
    } catch (err) { toast.error("Share failed"); }
  };

  if (isLoading) return <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center"><Loader2 className="animate-spin text-orange-500" size={48} /></div>;
  if (!isLoggedIn) return <AuthScreen onLoginSuccess={(user) => { setCurrentUser(user); setIsLoggedIn(true); hydrateVault(user); }} />;

  const sectionMap: Record<NavSection, React.ReactNode> = {
    books: <BooksSection 
              currentUser={currentUser} currentBook={currentBook} setCurrentBook={setCurrentBook} 
              triggerFab={triggerFab} setTriggerFab={setTriggerFab}
              onGlobalSaveBook={handleSaveBookGlobal} 
              // এন্ট্রি লজিক এখন সরাসরি BooksSection থেকে ডাইভার্ট হবে
              onSaveEntry={handleSaveEntryLogic} 
              onDeleteEntry={handleDeleteEntryLogic}
           />,
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
        onOpenShare={() => handleOpenGlobalModal('share')}
        onEditBook={() => { if (currentBook) openModal('editBook', { currentBook, currentUser, onSubmit: handleSaveBookGlobal }); }}
        onDeleteBook={() => {
            if (currentBook) {
                openModal('deleteBookConfirm', {
                    targetName: currentBook.name,
                    onConfirm: async () => {
                        const res = await fetch(`/api/books/${currentBook._id}`, { method: 'DELETE' });
                        if (res.ok) { await db.books.delete(currentBook._id); closeModal(); setCurrentBook(null); window.dispatchEvent(new Event('vault-updated')); toast.success('Vault Terminated'); }
                    }
                });
            }
        }}
    >
        <AnimatePresence mode="wait">
            <motion.div key={activeSection} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                {!isOnline && <div className="mb-6 p-4 bg-orange-500/10 border border-orange-500/20 rounded-[20px] flex items-center gap-3 text-orange-500 shadow-xl"><WifiOff size={16} /><span className="text-[10px] font-black uppercase">Protocol Offline</span></div>}
                {sectionMap[activeSection]}
            </motion.div>
        </AnimatePresence>
    </DashboardLayout>
  );
}