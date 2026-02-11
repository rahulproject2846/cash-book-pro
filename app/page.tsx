"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, WifiOff, Trash2, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';

// --- Core Logic & Storage ---
import { db } from '@/lib/offlineDB';
import { orchestrator } from '@/lib/vault/SyncOrchestrator'; 
import AuthScreen from '@/components/Auth/AuthScreen';
import { cn } from '@/lib/utils/helpers'; 

// --- UI Shell & Layout ---
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { CommandHub } from '@/components/Layout/CommandHub';

// --- Domain-Driven Sections ---
import { BooksSection } from '@/components/Sections/Books/BooksSection';
import { ReportsSection } from '@/components/Sections/Reports/ReportsSection';
import { TimelineSection } from '@/components/Sections/Timeline/TimelineSection';
import { SettingsSection } from '@/components/Sections/Settings/SettingsSection';
import { ProfileSection } from '@/components/Sections/Profile/ProfileSection';

// --- Global Engine Hooks ---
import { useModal } from '@/context/ModalContext';
import { useTranslation } from '@/hooks/useTranslation';
import { useVault } from '@/hooks/useVault'; 
import { usePusher } from '@/context/PusherContext'; // 🔥 রিয়েল-টাইম সিঙ্ক হুক
import { ToastCountdown } from '@/components/Modals/TerminationModal';

type NavSection = 'books' | 'reports' | 'timeline' | 'settings' | 'profile';

export default function CashBookApp() {
  const { openModal, closeModal } = useModal();
  const { T, t } = useTranslation();
  const { pusher } = usePusher(); // 🔥 পুশার ইনস্ট্যান্স নেওয়া হলো

  // 1. Core States
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentBook, setCurrentBook] = useState<any>(null);
  const [activeSection, setActiveSection] = useState<NavSection>('books');
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isHydrated, setIsHydrated] = useState(false);

  // ২. রিঅ্যাক্টিভ ইঞ্জিন (useVault V12.0)
  const { saveEntry, deleteEntry, restoreEntry, deleteBook, restoreBook } = useVault(currentUser, currentBook);

  // --- ৩. লাইফসাইকেল কন্ট্রোল (The Initialization Protocol) ---
  useEffect(() => {
    const initApp = async () => {
        const saved = localStorage.getItem('cashbookUser');
        if (saved) {
            const user = JSON.parse(saved);
            setCurrentUser(user);
            setIsLoggedIn(true);
            
            // ১. ডেল্টা হাইড্রেশন শুরু করো
            if (!isHydrated) {
                await orchestrator.hydrate(user._id);
                setIsHydrated(true);
            }

            // ২. রিয়েল-টাইম পুশার সিগন্যাল লিসেনার চালু করো
            if (pusher) {
                orchestrator.initPusher(pusher, user._id);
            }
        }
        setIsLoading(false); 
    };
    initApp();

    const handleNetwork = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleNetwork);
    window.addEventListener('offline', handleNetwork);
    
    return () => {
        window.removeEventListener('online', handleNetwork);
        window.removeEventListener('offline', handleNetwork);
    };
  }, [isHydrated, pusher]); // Pusher ডিপেন্ডেন্সি যোগ করা হলো

  useEffect(() => {
    if (currentUser?._id && pusher) {
        console.log("📡 Initializing Pusher Listener for User:", currentUser._id);
        orchestrator.initPusher(pusher, currentUser._id);
    }
  }, [currentUser?._id, pusher]);

  // --- ৪. কমান্ড হাব হ্যান্ডলার ---
  const handleCommandAction = (actionId: string, book?: any) => {
    if (actionId === 'addBook') {
        openModal('addBook', { onSubmit: handleSaveBookGlobal, currentUser });
    } else if (actionId === 'selectBook' && book) {
        setCurrentBook(book);
        setActiveSection('books');
    }
  };

  // --- ৫. গ্লোবাল এন্ট্রি লজিক ---
  const handleSaveEntryLogic = async (data: any) => {
    if (!currentBook?._id && !currentBook?.localId) return toast.error(T('err_select_vault'));
    
    const timestamp = Date.now();
    const bKey = currentBook?.localId || currentBook?._id;

    try {
        const success = await saveEntry(data);
        if (success) {
            // প্যারেন্ট বুক অ্যাক্টিভিটি সিঙ্ক
            if (bKey) {
                await db.books.update(Number(bKey) || bKey, { updatedAt: timestamp, synced: 0 });
            }
            closeModal();
            toast.success(T('success_entry_secured'));
            orchestrator.triggerSync(currentUser._id);
        }
    } catch (err) { toast.error("Entry Protocol Fault"); }
  };

  // ৫.১ এন্ট্রি ডিলিট লজিক (Undo Toast)
  const handleDeleteEntryLogic = async (entry: any) => {
    closeModal(); 
    try {
        const success = await deleteEntry(entry);
        if (success) {
            window.dispatchEvent(new Event('vault-updated'));

            toast.custom((tObj) => (
                <div className={cn(
                    "flex items-center gap-5 bg-black/90 border border-white/10 p-5 rounded-[28px] shadow-2xl backdrop-blur-3xl transition-all duration-500",
                    tObj.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                )}>
                    <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 shadow-inner">
                        <RotateCcw size={22} className="animate-spin-slow" />
                    </div>
                    <div className="flex flex-col min-w-[130px]">
                        <p className="text-[11px] font-black uppercase text-white tracking-[2px]">{T('success_entry_terminated')}</p>
                        <p className="text-[8px] font-bold text-white/40 uppercase mt-1">
                            Expires in <span className="text-orange-500"><ToastCountdown initialSeconds={6} /></span>
                        </p>
                    </div>
                    <button 
                        onClick={async () => {
                            await restoreEntry(entry);
                            toast.dismiss(tObj.id);
                            window.dispatchEvent(new Event('vault-updated'));
                            toast.success("PROTOCOL RESTORED", { icon: '🛡️' });
                        }}
                        className="ml-2 px-6 h-12 bg-orange-500 text-white rounded-xl text-[10px] font-black uppercase tracking-[2px] active:scale-90 transition-all"
                    >
                        {T('btn_undo')}
                    </button>
                </div>
            ), { duration: 6000, position: 'bottom-center' });

            setTimeout(async () => {
                const current = await db.entries.get(Number(entry.localId));
                if (current && current.isDeleted === 1) orchestrator.triggerSync(currentUser._id);
            }, 6500);
        }
    } catch (err) { toast.error("Process Fault"); }
  };

  // ৫.২ ভল্ট টার্মিনেশন লজিক (Book Soft-Delete)
  const handleDeleteBookLogic = async (book: any) => {
    closeModal();
    const success = await deleteBook(book);
    if (success) {
        setCurrentBook(null); 
        toast.custom((tObj) => (
            <div className={cn(
                "flex items-center gap-5 bg-black/90 border border-orange-500/20 p-5 rounded-[28px] shadow-2xl backdrop-blur-2xl transition-all duration-500",
                tObj.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            )}>
                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 shadow-inner">
                    <Trash2 size={22} />
                </div>
                <div className="flex flex-col min-w-[130px]">
                    <p className="text-[11px] font-black uppercase text-white tracking-[2px]">Vault Node Purged</p>
                    <p className="text-[8px] font-bold text-white/40 uppercase mt-1">
                        Expires in <span className="text-orange-500"><ToastCountdown initialSeconds={6} /></span>
                    </p>
                </div>
                <button 
                    onClick={async () => {
                        await restoreBook(book); 
                        toast.dismiss(tObj.id);
                        window.dispatchEvent(new Event('vault-updated'));
                        toast.success("VAULT RESTORED", { icon: '🛡️' });
                    }}
                    className="ml-2 px-6 h-12 bg-orange-500 text-white rounded-xl text-[10px] font-black uppercase tracking-[2px] active:scale-90 transition-all shadow-lg"
                >
                    {T('btn_undo')}
                </button>
            </div>
        ), { duration: 6000, position: 'bottom-center' });

        setTimeout(async () => {
            const current = await db.books.get(Number(book.localId));
            if (current && current.isDeleted === 1) orchestrator.triggerSync(currentUser._id);
        }, 6500);
    }
  };

  // --- ৬. গ্লোবাল বুক সেভ লজিক ---
  const handleSaveBookGlobal = async (formData: any) => {
    const localId = currentBook?.localId || formData?.localId;
    const serverId = currentBook?._id || formData?._id;

    try {
        const timestamp = Date.now();
        const localData = {
            ...formData,
            localId: localId ? Number(localId) : undefined, 
            _id: serverId || undefined,
            userId: String(currentUser._id),
            updatedAt: timestamp,
            synced: 0,
            isDeleted: 0
        };

        await db.books.put(localData);
        window.dispatchEvent(new Event('vault-updated'));
        closeModal();
        
        const res = await fetch('/api/books', { 
            method: serverId ? 'PUT' : 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ ...formData, _id: serverId, userId: String(currentUser._id) }), 
        });

        if (res.ok) {
            const result = await res.json();
            const serverBook = result.book || result.data;
            await db.books.where('updatedAt').equals(timestamp).modify({ _id: serverBook._id, synced: 1 });
            orchestrator.triggerSync(currentUser._id);
        }
    } catch (err) { console.error(err); }
  };

  const handleOpenGlobalModal = async (type: any) => {
    if (!currentBook?._id) return toast.error(T('err_select_vault'));
    const bookId = String(currentBook._id);
    const entries = await db.entries.where('bookId').equals(bookId).and(e => e.isDeleted === 0).toArray();
    openModal(type, { entries, bookName: currentBook.name, currentBook });
  };

  // --- ৭. রেন্ডার প্রোটেকশন ---
  if (isLoading) return (
    <div className="min-h-screen bg-[#0F0F0F] flex flex-col items-center justify-center gap-6">
        <Loader2 className="animate-spin text-orange-500" size={56} />
        <span className="text-[10px] font-black uppercase tracking-[6px] text-white/20 animate-pulse italic">Initializing Vault Core...</span>
    </div>
  );
  
  if (!isLoggedIn) return (
    <AuthScreen onLoginSuccess={(user) => { 
      localStorage.setItem('cashbookUser', JSON.stringify(user));
      setCurrentUser(user); 
      setIsLoggedIn(true); 
      orchestrator.hydrate(user._id);
    }} />
  );

  const sectionMap: Record<NavSection, React.ReactNode> = {
    books: <BooksSection 
              currentUser={currentUser} 
              currentBook={currentBook} 
              setCurrentBook={setCurrentBook} 
              onGlobalSaveBook={handleSaveBookGlobal} 
              onSaveEntry={handleSaveEntryLogic}
              onDeleteEntry={handleDeleteEntryLogic}
           />,
    reports: <ReportsSection currentUser={currentUser} />,
    timeline: <TimelineSection 
                  currentUser={currentUser} 
                  onBack={() => setActiveSection('books')}
                  onSaveEntry={handleSaveEntryLogic}
                  onDeleteEntry={handleDeleteEntryLogic}
              />,
    settings: <SettingsSection currentUser={currentUser} setCurrentUser={setCurrentUser} />,
    profile: <ProfileSection currentUser={currentUser} setCurrentUser={setCurrentUser} onLogout={() => orchestrator.logout()} />
  };

  return (
    <>
        <CommandHub
            isOpen={false} 
            onAction={handleCommandAction}
            currentUser={currentUser}
            setActiveSection={setActiveSection}
            setCurrentBook={setCurrentBook} 
        />
        
        <DashboardLayout
            
            activeSection={activeSection} setActiveSection={setActiveSection}
            currentUser={currentUser} currentBook={currentBook} 
            onLogout={() => orchestrator.logout()}
            onBack={() => setCurrentBook(null)}
            onFabClick={() => openModal('addEntry', { currentUser, currentBook, onSubmit: handleSaveEntryLogic })}
            onOpenAnalytics={() => handleOpenGlobalModal('analytics')}
            onOpenExport={() => handleOpenGlobalModal('export')}
            onOpenShare={() => handleOpenGlobalModal('share')}
            onEditBook={() => openModal('editBook', { currentBook, currentUser, onSubmit: handleSaveBookGlobal })}
            onDeleteBook={() => {
                if (currentBook) {
                    openModal('deleteConfirm', { 
                        targetName: currentBook.name, 
                        title: "PROTOCOL: TERMINATION", 
                        onConfirm: () => handleDeleteBookLogic(currentBook)
                    });
                }
            }}
            setCurrentBook={setCurrentBook}
        >
            <AnimatePresence mode="wait">
                <motion.div 
                    key={activeSection} 
                    initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                >
                    {!isOnline && (
                        <div className="mb-6 p-5 bg-orange-500/10 border border-orange-500/20 rounded-[28px] flex items-center gap-4 text-orange-500 shadow-xl backdrop-blur-md">
                            <WifiOff size={20} strokeWidth={2.5} />
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase tracking-[2px] leading-none">{T('status_offline')}</span>
                                <span className="text-[8px] font-bold uppercase opacity-60 mt-1">Working on local node</span>
                            </div>
                        </div>
                    )}
                    {sectionMap[activeSection]}
                </motion.div>
            </AnimatePresence>
        </DashboardLayout>
    </>
  );
}