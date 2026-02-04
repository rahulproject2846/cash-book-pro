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

// Domain-Driven Sections (Folder Structure Updated)
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

  // --- MODAL STATES ---
  const [bookForm, setBookForm] = useState({ name: '', description: '' });
  const [triggerFab, setTriggerFab] = useState(false);

  // --- ১. গ্লোবাল বুক সেভ লজিক (Centralized) ---
  const handleSaveBookGlobal = async (formData: any) => {
    // লজিক: currentBook থাকলে এবং view 'editBook' হলে এটি আপডেট
    const isEdit = !!currentBook?._id && view === 'editBook'; 
    const bookId = currentBook?._id;

    try {
        const res = await fetch(isEdit ? `/api/books/${bookId}` : '/api/books', { 
            method: isEdit ? 'PUT' : 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ 
                ...formData, 
                _id: isEdit ? bookId : undefined, 
                userId: currentUser._id 
            }), 
        });
        
        if (res.ok) {
            const result = await res.json();
            const bookData = result.book || result.data;
            
            // Local-First: Update IndexDB
            await db.books.put({ ...bookData, updatedAt: Date.now() });
            
            closeModal();
            // নতুন বুক অ্যাড করলে সিলেকশন ক্লিয়ার করা হয়
            if (!isEdit) setCurrentBook(null); 
            
            window.dispatchEvent(new Event('vault-updated'));
            toast.success(isEdit ? "Protocol Updated" : "Ledger Initialized");
        }
    } catch (err) { 
        toast.error("Sync failure"); 
    }
  };

  // --- ২. স্মার্ট বাটন ক্লিক লজিক ---
  const handleFabClick = () => {
    if (currentBook) {
        // যদি বইয়ের ভেতরে থাকি, তবে এন্ট্রি অ্যাড হবে
        setTriggerFab(true); 
    } else if (activeSection === 'books') {
        // ড্যাশবোর্ডে থাকলে নতুন বই অ্যাড হবে
        setCurrentBook(null); // 🔥 সেফটি: সিলেকশন ক্লিয়ার করা হলো
        openModal('addBook', { onSubmit: handleSaveBookGlobal, currentUser });
    } else {
        // অন্য সেকশনে থাকলে শর্টকাট দেখাবে
        openModal('shortcut', { 
            onInitialize: () => {
                setActiveSection('books');
                setCurrentBook(null);
                openModal('addBook', { onSubmit: handleSaveBookGlobal, currentUser });
            }
        });
    }
  };

  // --- ৩. গ্লোবাল মডাল ওপেনার (Export/Analytics) ---
  const handleOpenGlobalModal = async (type: any) => {
    if (type === 'analytics' || type === 'export' || type === 'share') {
        if (!currentBook?._id) return toast.error("Select a vault first");
        
        const entries = await db.entries
            .where('bookId').equals(currentBook._id)
            .and(item => item.isDeleted === 0)
            .toArray();

        openModal(type, { 
            entries, 
            bookName: currentBook.name, 
            currentBook,
            onToggleShare: handleToggleShare 
        });
    }
  };

  // --- ৪. ব্যাকগ্রাউন্ড সিঙ্ক ইঞ্জিন (অপরিবর্তিত) ---
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

// src/app/page.tsx এর ভেতর hydrateVault ফাংশনটি
const hydrateVault = useCallback(async (user: any) => {
    if (!navigator.onLine || !user?._id || hydrationDoneRef.current) return;
    hydrationDoneRef.current = true;
    try {
      const [booksRes, entriesRes, userSettingsRes] = await Promise.all([ // 🔥 ৩য় কল যোগ করা হলো
          fetch(`/api/books?userId=${user._id}`),
          fetch(`/api/entries/all?userId=${user._id}`),
          fetch(`/api/user/settings?userId=${user._id}`) // 🔥 ইউজারের সেটিংস লোড
      ]);

      // ... বাকি লজিক ...

      if (booksRes.ok && entriesRes.ok && userSettingsRes.ok) {
          const bData = await booksRes.json();
          const eData = await entriesRes.json();
          const settingsData = await userSettingsRes.json(); // 🔥 সেটিংস ডাটা পাওয়া গেল

          // ... লোকাল ডেক্সিবি আপডেট লজিক ...

          // 🔥 লোকাল ইউজার অবজেক্ট আপডেট (নতুন সেটিংস সহ)
          const fullUser = { 
              ...user, 
              categories: settingsData.user?.categories || user.categories,
              preferences: settingsData.user?.preferences || user.preferences,
              currency: settingsData.user?.currency || user.currency
          };
          
          setCurrentUser(fullUser);
          localStorage.setItem('cashbookUser', JSON.stringify(fullUser)); // 🔥 লোকাল স্টোরেজ আপডেট

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

  // সেকশন ম্যাপিং: প্রপস পাস করা হচ্ছে যাতে চাইল্ড কম্পোনেন্ট গ্লোবাল লজিক ব্যবহার করতে পারে
  const sectionMap: Record<NavSection, React.ReactNode> = {
    books: <BooksSection 
              currentUser={currentUser} 
              currentBook={currentBook} 
              setCurrentBook={setCurrentBook} 
              triggerFab={triggerFab} 
              setTriggerFab={setTriggerFab} 
              onGlobalSaveBook={handleSaveBookGlobal} // গ্লোবাল সেভ হ্যান্ডলার পাস করা হলো
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
        onEditBook={() => { 
            if (currentBook) { 
                // এডিট মোড: currentBook ডাটা সহ ওপেন হবে
                openModal('editBook', { currentBook, currentUser, onSubmit: handleSaveBookGlobal }); 
            } 
        }}
        onDeleteBook={() => {
            if (currentBook) {
                openModal('deleteBookConfirm', {
                    targetName: currentBook.name,
                    onConfirm: async () => {
                        try {
                            const res = await fetch(`/api/books/${currentBook._id}`, { method: 'DELETE' });
                            if (res.ok) {
                                await db.books.delete(currentBook._id);
                                closeModal();
                                setCurrentBook(null);
                                window.dispatchEvent(new Event('vault-updated'));
                                toast.success('Vault Terminated');
                            }
                        } catch (err) { toast.error("Termination error"); }
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