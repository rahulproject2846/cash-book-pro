"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Book, WifiOff, History } from 'lucide-react';
import toast from 'react-hot-toast';

// Core Systems
import { db } from '@/lib/offlineDB';
import AuthScreen from '@/components/Auth/AuthScreen';

// Layout & UI Shell
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

export default function CashBookApp() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentBook, setCurrentBook] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('books');
  const [isOnline, setIsOnline] = useState(true);
  
  // Logic Synchronization Refs
  const isSyncingRef = useRef(false);
  const hydrationDoneRef = useRef(false);

  // Global Modal Orchestration
  const [globalModal, setGlobalModal] = useState<'none' | 'addBook' | 'editBook' | 'analytics' | 'export' | 'share' | 'deleteBookConfirm'>('none');
  const [activeEntries, setActiveEntries] = useState<any[]>([]); // For Analytics/Export
  const [bookForm, setBookForm] = useState({ name: '', description: '' });
  const [triggerFab, setTriggerFab] = useState(false);
  const [showFabModal, setShowFabModal] = useState(false);

  // --- 1. CLOUD SYNC ENGINE (Background Processing) ---
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
    } catch (err) {
      console.warn("Vault Sync Engine: Connection Interrupted");
    } finally {
      isSyncingRef.current = false;
    }
  }, [currentUser?._id]);

  // ২. CashBookApp ফাংশনের ভেতরে শেয়ার টগল লজিক যোগ করুন
const handleToggleShare = async (enable: boolean) => {
    try {
        const res = await fetch('/api/books/share', { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ bookId: currentBook._id, enable }) 
        });
        const data = await res.json();
        if (res.ok) {
            // লোকাল ডেক্সি ডাটাবেসেও আপডেট করুন যাতে সাথে সাথে UI পরিবর্তন হয়
            await db.books.update(currentBook._id, { 
                isPublic: data.data.isPublic, 
                shareToken: data.data.shareToken 
            }as any);
            // currentBook স্টেট আপডেট করা হলো
            setCurrentBook({ ...currentBook, isPublic: data.data.isPublic, shareToken: data.data.shareToken });
            toast.success(enable ? "Vault is now Live" : "Vault is now Private");
        }
    } catch (err) {
        toast.error("Sharing protocol failed");
    }
};

  // --- 2. DATA HYDRATION (Syncing Cloud to Local) ---
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
          window.dispatchEvent(new Event('vault-updated'));
          syncOfflineData();
      }
    } catch (err) { 
        hydrationDoneRef.current = false;
    }
  }, [syncOfflineData]);

  // --- 3. MODAL DATA PREPARATION ---
  const handleOpenGlobalModal = async (type: 'analytics' | 'export' | 'share') => {
    if (!currentBook?._id) return toast.error("Select a vault first");
    
    // Fetch latest local entries for the modal
    const data = await db.entries
        .where('bookId').equals(currentBook._id)
        .and(item => item.isDeleted === 0)
        .toArray();
    
    setActiveEntries(data);
    setGlobalModal(type);
  };

  // --- 4. LIFECYCLE & EVENT MONITORING ---
  useEffect(() => {
    const savedUser = localStorage.getItem('cashbookUser');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setCurrentUser(user);
      setIsLoggedIn(true);
      hydrateVault(user);
    }
    
    const lTimer = setTimeout(() => setIsLoading(false), 1000);

    const handleNetworkActivity = () => {
        setIsOnline(navigator.onLine);
        if (navigator.onLine) syncOfflineData();
    };

    window.addEventListener('online', handleNetworkActivity);
    window.addEventListener('offline', () => setIsOnline(false));

    return () => {
        clearTimeout(lTimer);
        window.removeEventListener('online', handleNetworkActivity);
    };
  }, [hydrateVault, syncOfflineData]);

  // --- 5. SYSTEM HANDLERS ---
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

  if (isLoading) return (
    <div className="min-h-screen bg-[#0F0F0F] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="animate-spin text-orange-500" size={48} />
        <p className="text-[10px] font-black uppercase tracking-[5px] text-white/10">Establishing Protocol</p>
    </div>
  );

  if (!isLoggedIn) return <AuthScreen onLoginSuccess={handleLoginSuccess} />;

  // --- 6. VIEW ROUTING ---
  const sectionMap: Record<string, React.ReactNode> = {
    books: (
        <BooksSection 
            currentUser={currentUser} 
            currentBook={currentBook} 
            setCurrentBook={setCurrentBook} 
            triggerFab={triggerFab} 
            setTriggerFab={setTriggerFab} 
            externalModalType={globalModal} 
            setExternalModalType={setGlobalModal} 
            bookForm={bookForm} 
            setBookForm={setBookForm} 
        />
    ),
    reports: <ReportsSection currentUser={currentUser} />,
    timeline: <TimelineSection currentUser={currentUser} />,
    settings: <SettingsSection currentUser={currentUser} setCurrentUser={setCurrentUser} />,
    profile: <ProfileSection currentUser={currentUser} setCurrentUser={setCurrentUser} onLogout={handleLogout} />
  };

  return (
    <DashboardLayout
        activeSection={activeSection} setActiveSection={setActiveSection}
        onLogout={handleLogout} currentUser={currentUser}
        currentBook={currentBook} onBack={() => setCurrentBook(null)}
        onFabClick={() => { if (activeSection === 'books') setTriggerFab(true); else setShowFabModal(true); }}
        
        // Header Integration (Lifts state from header to root)
        onOpenAnalytics={() => handleOpenGlobalModal('analytics')}
    onOpenExport={() => handleOpenGlobalModal('export')}
    onOpenShare={() => setGlobalModal('share')}
        
        onEditBook={() => { 
            if (currentBook) { 
                setBookForm({ name: currentBook.name, description: currentBook.description || "" }); 
                setGlobalModal('editBook'); 
            } 
        }}
        onDeleteBook={() => setGlobalModal('deleteBookConfirm')}
    >
        <AnimatePresence mode="wait">
            <motion.div key={activeSection + (currentBook?._id || '')} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                {!isOnline && (
                    <div className="mb-6 p-4 bg-orange-500/10 border border-orange-500/20 rounded-[20px] flex items-center gap-3 text-orange-500 shadow-xl">
                        <WifiOff size={20} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Protocol Offline: Vault Secured Locally</span>
                    </div>
                )}
                {sectionMap[activeSection]}
            </motion.div>
        </AnimatePresence>

        {/* --- ROOT LEVEL MODAL LAYER --- */}
<AnimatePresence>
    {/* ১. এনালিটিক্স মডাল */}
    {globalModal === 'analytics' && currentBook && (
        <ModalLayout 
            key="analytics-modal" // ইউনিক কি দিন
            title="Vault Intelligence" 
            onClose={() => setGlobalModal('none')}
        >
            <div className="h-[450px] py-4" onClick={(e) => e.stopPropagation()}>
                <AnalyticsChart entries={activeEntries} />
            </div>
        </ModalLayout>
    )}

    {/* ২. এক্সপোর্ট মডাল */}
    {globalModal === 'export' && currentBook && (
        <AdvancedExportModal 
            key="export-modal"
            isOpen={true} 
            onClose={() => setGlobalModal('none')} 
            entries={activeEntries} 
            bookName={currentBook.name} 
        />
    )}
    
    {/* ৩. শেয়ার মডাল */}
    {globalModal === 'share' && currentBook && (
        <ModalLayout 
            key="share-modal"
            title="Protocol Sharing" 
            onClose={() => setGlobalModal('none')}
        >
            {/* আপনার শেয়ারিং লজিক এখানে */}
            <div className="p-10 text-center text-[10px] font-black uppercase tracking-widest text-white/20">
                Sharing Protocol Initializing...
            </div>
        </ModalLayout>
    )}
    <ShareModal 
        isOpen={globalModal === 'share'}
        onClose={() => setGlobalModal('none')}
        currentBook={currentBook}
        onToggleShare={handleToggleShare}
    />
</AnimatePresence>
    </DashboardLayout>
  );
}