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

// Domain-Driven Sections
import { BooksSection } from '@/components/Sections/Books/BooksSection';
import { ReportsSection } from '@/components/Sections/Reports/ReportsSection';
import { TimelineSection } from '@/components/Sections/Timeline/TimelineSection';
import { SettingsSection } from '@/components/Sections/Settings/SettingsSection';
import { ProfileSection } from '@/components/Sections/Profile/ProfileSection';

// Global Modal Engine
import { useModal } from '@/context/ModalContext';

// --- Types ---
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

  // --- ১. ব্যাকগ্রাউন্ড সিঙ্ক ইঞ্জিন (Smart Conflict Handling) ---
  const syncOfflineData = useCallback(async () => {
    if (!navigator.onLine || isSyncingRef.current || !currentUser?._id) return;
    
    // শুধু আন-সিঙ্কড ডাটা খুঁজবে
    const pending = await db.entries.where('synced').equals(0).toArray();
    if (pending.length === 0) return;

    isSyncingRef.current = true;
    try {
for (const entry of pending) {
    // 🔥 ফিক্স: এখন শুধু এমাউন্ট না থাকলে ডিলিট করবে, টাইটেল না থাকলেও সমস্যা নেই
    if (entry.amount === undefined || entry.amount === null) {
        await db.entries.delete(entry.localId!);
        continue;
    }

        const { localId, synced, isDeleted, ...payload } = entry;
        
        // সার্ভারে ডাটা পাঠানো
        const res = await fetch(entry._id ? `/api/entries/${entry._id}` : '/api/entries', {
          method: entry._id ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, userId: currentUser._id,cid: entry.cid }),
        });

        // 🔥 409 Conflict Handling: ডাটা অলরেডি সার্ভারে থাকলে আপডেট করে নাও
        if (res.ok || res.status === 409) {
          const serverData = await res.json();
          const serverId = serverData.data?._id || serverData.entry?._id || entry._id;
          
          // লোকাল ডাটাকে সিঙ্কড মার্ক করা
          await db.entries.update(entry.localId!, {
            synced: 1,
            _id: serverId
          });
        }
      }
      window.dispatchEvent(new Event('vault-updated'));
    } catch (err) { 
        console.warn("Sync Paused: Network instability"); 
    } finally { 
        isSyncingRef.current = false; 
        window.dispatchEvent(new Event('vault-synced'));
    }
  }, [currentUser?._id]);

  // --- ২. গ্লোবাল এন্ট্রি সেভ লজিক (CID Guard Added) ---
  const handleSaveEntryLogic = async (data: any) => {
    if (!currentBook?._id) return toast.error("Vault reference missing");
    
    try {
        const timestamp = Date.now();
        // 🔥 CID জেনারেশন: এটি ডুপ্লিকেট আটকাবে
        const cid = data.cid || `cid_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
        
        const payload = { 
            ...data, 
            cid, // এই ইউনিক আইডিটি গার্ড হিসেবে কাজ করবে
            userId: currentUser._id, 
            bookId: currentBook._id,
            synced: 0,
            updatedAt: timestamp
        };

        // লোকাল ডেক্সিতে সেভ (নতুন স্কিমা অনুযায়ী)
        await db.entries.put(payload);
        
        closeModal();
        window.dispatchEvent(new Event('vault-updated'));
        toast.success("Entry Secured Locally");

        if (navigator.onLine) syncOfflineData();
    } catch (err) {
        toast.error("Local Save Failed");
    }
  };

  // --- ৩. গ্লোবাল ডিলিট লজিক ---
  const handleDeleteEntryLogic = async (entry: any) => {
    try {
        const id = entry.localId || entry._id;
        // সফট ডিলিট: সার্ভারকে জানানোর জন্য মার্ক করা হলো
        await db.entries.update(id, { isDeleted: 1, synced: 0 });
        
        closeModal();
        window.dispatchEvent(new Event('vault-updated'));
        toast.success("Entry Marked for Deletion");

        if (navigator.onLine) syncOfflineData();
    } catch (err) {
        toast.error("Termination Failed");
    }
  };

  // --- ৪. গ্লোবাল বুক সেভ লজিক ---
  const handleSaveBookGlobal = async (formData: any) => {
    const targetId = currentBook?._id || currentBook?.id || formData?._id;
    const isEditMode = !!targetId; 

    try {
        const res = await fetch('/api/books', { 
            method: isEditMode ? 'PUT' : 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ ...formData, _id: targetId, userId: currentUser._id }), 
        });
        
        if (res.ok) {
            const result = await res.json();
            // বইয়ের ডাটা ডেক্সিতে আপডেট
            await db.books.put({ ...(result.book || result.data), updatedAt: Date.now() });
            
            closeModal();
            if (!isEditMode) setCurrentBook(null); 
            
            window.dispatchEvent(new Event('vault-updated'));
            toast.success(isEditMode ? "Protocol Updated" : "Vault Initialized");
        } else {
            const errorData = await res.json();
            toast.error(errorData.message || "Protocol Rejected");
        }
    } catch (err) { toast.error("Network Error"); }
  };

  // --- ৫. স্মার্ট বাটন ক্লিক ---
  const handleFabClick = (e?: any) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (currentBook) {
        openModal('addEntry', { currentUser, currentBook, onSubmit: handleSaveEntryLogic });
    } else if (activeSection === 'books') {
        setCurrentBook(null);
        openModal('addBook', { onSubmit: handleSaveBookGlobal, currentUser });
    } else {
        openModal('shortcut', { 
            onInitialize: () => { setActiveSection('books'); setCurrentBook(null); openModal('addBook', { onSubmit: handleSaveBookGlobal, currentUser }); }
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

  // --- ৬. ক্লাউড হাইড্রেশন (Pro Level) ---
// --- ৬. ক্লাউড হাইড্রেশন (Smart Merge Protocol) ---
const hydrateVault = useCallback(async (user: any) => {
    if (!navigator.onLine || !user?._id || hydrationDoneRef.current) return;
    hydrationDoneRef.current = true;
    
    try {
      const [booksResult, entriesResult, settingsResult] = await Promise.allSettled([
          fetch(`/api/books?userId=${user._id}`),
          fetch(`/api/entries/all?userId=${user._id}`),
          fetch(`/api/user/settings?userId=${user._id}`) 
      ]);

      // ১. বই আপডেট
     // hydrateVault ফাংশনের ভেতরের আপডেট
if (booksResult.status === 'fulfilled' && booksResult.value.ok) {
    const bData = await booksResult.value.json();
    const serverBooks = Array.isArray(bData) ? bData : (bData.books || []);
    
    // 🔥 ফিক্স: bulkPut এর বদলে লুপ ব্যবহার করে ডাটাবেজ লক হওয়া কমানো হয়েছে
    for (const book of serverBooks) {
        await db.books.put(book);
    }
}

if (entriesResult.status === 'fulfilled' && entriesResult.value.ok) {
    const eData = await entriesResult.value.json();
    const serverEntries = Array.isArray(eData) ? eData : (eData.entries || []);
    
    await db.transaction('rw', db.entries, async () => {
        for (const item of serverEntries) {
            // 🔥 ফিক্স: ID এবং CID চেক করে মার্জ লজিক
            const existing = await db.entries
                .where('_id').equals(item._id)
                .or('cid').equals(item.cid || "")
                .first();

            await db.entries.put({
                ...item,
                localId: existing?.localId,
                synced: 1,
                isDeleted: 0,
                status: (item.status || 'completed').toLowerCase(),
                type: (item.type || 'expense').toLowerCase()
            });
        }
    });
}

      // ৩. সেটিংস আপডেট
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
    return () => window.removeEventListener('online', handleNetwork);
  }, [hydrateVault, syncOfflineData, isHydrated]);







useEffect(() => {
    console.log("COMPONENT_MOUNTED: BooksSection");
    return () => console.log("COMPONENT_UNMOUNTED: BooksSection");
}, []);





  // --- ৭. লগআউট গার্ড (Data Safety) ---
  const handleLogout = async () => {
    // 🔥 Guard Logic: চেক করো আন-সিঙ্কড ডাটা আছে কি না
    const unsyncedCount = await db.entries.where('synced').equals(0).count();
    
    if (unsyncedCount > 0) {
        if (!confirm(`WARNING: ${unsyncedCount} records are not synced with the cloud yet. Logging out will lose this data. Continue?`)) {
            // ইউজার না বললে লগআউট বাতিল
            return;
        }
    }

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
              onGlobalSaveBook={handleSaveBookGlobal} 
              onEditEntry={(e: any) => openModal('addEntry', { entry: e, currentBook, currentUser, onSubmit: handleSaveEntryLogic })}
              onDeleteEntry={(e: any) => openModal('deleteConfirm', { targetName: e.title, onConfirm: () => handleDeleteEntryLogic(e) })}
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