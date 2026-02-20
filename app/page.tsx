"use client";
import React, { useState, useEffect, useCallback, startTransition, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, WifiOff, Trash2, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';

// --- Core Logic & Storage ---
import { db } from '@/lib/offlineDB';
import { useVaultStore } from '@/lib/vault/store';
import { identityManager } from '@/lib/vault/core/IdentityManager';
import { orchestrator } from '@/lib/vault/core/SyncOrchestrator';
import AuthScreen from '@/components/Auth/AuthScreen';
import { cn } from '@/lib/utils/helpers';

// --- UI Shell & Layout ---
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { CommandHub } from '@/components/Layout/CommandHub';

// --- Domain-Driven Sections ---
import BooksSection from '@/components/Sections/Books/BooksSection';
import { ReportsSection } from '@/components/Sections/Reports/ReportsSection';
import { TimelineSection } from '@/components/Sections/Timeline/TimelineSection';
import { SettingsSection } from '@/components/Sections/Settings/SettingsSection';
import { ProfileSection } from '@/components/Sections/Profile/ProfileSection';

// --- Global Engine Hooks ---
import { useModal } from '@/context/ModalContext';
import { useTranslation } from '@/hooks/useTranslation';
import { usePusher } from '@/context/PusherContext';
import { ToastCountdown } from '@/components/Modals/TerminationModal';
import { EntryCard } from '@/components/UI/EntryCard';
import { BookCard } from '@/components/Sections/Books/BookCard';

type NavSection = 'books' | 'reports' | 'timeline' | 'settings' | 'profile';

export default function CashBookApp() {
  const { openModal, closeModal } = useModal();
  const { t } = useTranslation();
  const { pusher } = usePusher();

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isHydrated, setIsHydrated] = useState(false);

  const { activeBook, setActiveBook, saveBook, saveEntry, deleteEntry, deleteBook, restoreEntry, restoreBook, activeSection, setActiveSection, nextAction, setNextAction } = useVaultStore();

  const deleteTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    const initApp = async () => {
      const userId = identityManager.getUserId();
      if (userId) {
        const saved = localStorage.getItem('cashbookUser');
        if (saved) {
          const user = JSON.parse(saved);
          setCurrentUser(user);
          setIsLoggedIn(true);

          identityManager.setIdentity(user);

          if (!isHydrated) {
            orchestrator.setUserId(user._id);
            setIsHydrated(true);
            orchestrator.initializeForUser(user._id).catch((err: any) => 
              console.warn('Background hydration failed:', err)
            );
          }

          if (pusher) {
            orchestrator.initPusher(pusher, user._id);
          }
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
  }, [isHydrated, pusher]);

  useEffect(() => {
    if (currentUser?._id && pusher) {
      orchestrator.initPusher(pusher, currentUser._id);
    }
  }, [currentUser?._id, pusher]);

  useEffect(() => {
    const handleResourceDeleted = (event: any) => {
      const { type, id } = event.detail;

      if (type === 'book' && (activeBook?._id === id || activeBook?.localId === Number(id))) {
        toast.error('This book was deleted on another device', {
          icon: '📚',
          duration: 5000,
          style: {
            borderRadius: '20px',
            background: 'var(--bg-card)',
            color: 'var(--text-main)',
            border: '1px solid var(--border)',
            fontSize: '12px',
            fontWeight: 'bold'
          }
        });

        startTransition(() => {
          setActiveBook(null);
          setActiveSection('books');
          if (window.location.hash) window.location.hash = '';
        });
      }
    };

    window.addEventListener('resource-deleted', handleResourceDeleted);
    return () => window.removeEventListener('resource-deleted', handleResourceDeleted);
  }, [activeBook, setActiveSection]);

  const handleCommandAction = (actionId: string, book?: any) => {
    if (actionId === 'addBook') {
      openModal('addBook', { onSubmit: handleSaveBookGlobal, currentUser });
    } else if (actionId === 'selectBook' && book) {
      setActiveBook(book);
      setActiveSection('books');
    }
  };

  const handleSaveEntryLogic = async (data: any) => {
    if (!activeBook?._id && !activeBook?.localId) return toast.error(t('err_select_vault'));
    
    const timestamp = Date.now();
    const bKey = activeBook?.localId || activeBook?._id;

    try {
      const success = await saveEntry(data);
      if (success) {
        if (bKey) {
          await db.books.update(Number(bKey) || bKey, { updatedAt: timestamp, synced: 0 });
        }
        closeModal();
        toast.success(t('success_entry_secured'));
        useVaultStore.getState().triggerManualSync();
      }
    } catch (err) { toast.error(t('error_entry_protocol_fault')); }
  };

  const handleSaveBookGlobal = async (formData: any) => {
    try {
      const success = await saveBook(formData, activeBook);
      if (success) {
        closeModal();
        toast.success(t('success_book_secured'));
      }
    } catch (error) {
      console.error('Save book error:', error);
      toast.error(t('err_save_book'));
    }
  };

  const handleFabClick = useCallback(() => {
    if (activeBook?.cid || activeBook?._id) {
      // Inside a book - directly add entry
      openModal('addEntry', { currentUser, currentBook: activeBook, onSubmit: handleSaveEntryLogic });
    } else {
      // No active book - add new book
      openModal('addBook');
    }
  }, [activeBook, activeSection, currentUser, openModal, handleSaveEntryLogic, handleSaveBookGlobal]);

  // State-driven modal handling for Create Book flow
  useEffect(() => {
    if (nextAction === 'addBook') {
      setActiveSection('books');
      openModal('addBook', { 
        currentUser: currentUser,
        onSubmit: handleSaveBookGlobal 
      });
      setNextAction(null);
    }
  }, [nextAction, setActiveSection, openModal, currentUser, handleSaveBookGlobal, setNextAction]);

  const handleDeleteEntryLogic = async (entry: any) => {
    closeModal(); 
    
    try {
      await db.entries.update(Number(entry.localId), { 
        isDeleted: 1, 
        synced: 0, 
        vKey: Date.now(),
        updatedAt: Date.now()
      });
      
      window.dispatchEvent(new Event('vault-updated'));
      
      const deleteKey = `entry-${entry.localId}`;
      const timeoutId = setTimeout(async () => {
        const success = await deleteEntry(entry);
        if (success) {
          deleteTimeoutsRef.current.delete(deleteKey);
        }
      }, 8000);
      
      deleteTimeoutsRef.current.set(deleteKey, timeoutId);
      
      toast.custom((tObj: { id: string; visible: boolean }) => (
        <div className={cn(
          "flex items-center gap-5 bg-black/90 border border-white/10 p-5 rounded-[28px] shadow-2xl backdrop-blur-3xl transition-all duration-500",
          tObj.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        )}>
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 shadow-inner">
            <RotateCcw size={22} className="animate-spin-slow" />
          </div>
          <div className="flex flex-col min-w-[130px]">
            <p className="text-[11px] font-black uppercase text-white tracking-[2px]">{t('success_entry_terminated')}</p>
            <p className="text-[8px] font-bold text-white/40 uppercase mt-1">
              Server sync in <span className="text-orange-500"><ToastCountdown initialSeconds={8} /></span>
            </p>
          </div>
          <button 
            onClick={async () => {
              const timeoutToClear = deleteTimeoutsRef.current.get(deleteKey);
              if (timeoutToClear) {
                clearTimeout(timeoutToClear);
              }
              const restored = await restoreEntry(entry);
              if (restored) {
                toast.dismiss(tObj.id);
                window.dispatchEvent(new Event('vault-updated'));
                toast.success(t("PROTOCOL RESTORED"), { icon: '🛡️' });
              }
              deleteTimeoutsRef.current.delete(deleteKey);
            }}
            className="ml-2 px-6 h-12 bg-orange-500 text-white rounded-xl text-[10px] font-black uppercase tracking-[2px] active:scale-90 transition-all shadow-lg"
          >
            {t('btn_undo')} 
          </button>
        </div>
      ), { duration: 8000, position: 'bottom-center' });
      
    } catch (err) { 
      toast.error(t("Process Fault"));
      console.error('❌ [DEFERRED DELETE] Failed to update local state:', err);
    }
  };

  const handleDeleteBookLogic = async (book: any) => {
    closeModal();
    
    try {
      await db.books.update(Number(book.localId), { 
        isDeleted: 1, 
        synced: 0, 
        vKey: Date.now(),
        updatedAt: Date.now()
      });
      
      setActiveBook(null);
      window.dispatchEvent(new Event('vault-updated'));
      
      const deleteKey = `book-${book.localId}`;
      const timeoutId = setTimeout(async () => {
        const success = await deleteBook(book);
        if (success) {
          deleteTimeoutsRef.current.delete(deleteKey);
        }
      }, 6000);
      
      deleteTimeoutsRef.current.set(deleteKey, timeoutId);
      
      toast.custom((tObj: { id: string; visible: boolean }) => (
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
              const timeoutToClear = deleteTimeoutsRef.current.get(deleteKey);
              if (timeoutToClear) {
                clearTimeout(timeoutToClear);
              }
              const restored = await restoreBook(book);
              if (restored) {
                toast.dismiss(tObj.id);
                window.dispatchEvent(new Event('vault-updated'));
                toast.success(t("PROTOCOL RESTORED"), { icon: '🛡️' });
              }
              deleteTimeoutsRef.current.delete(deleteKey);
            }}
            className="ml-2 px-6 h-12 bg-orange-500 text-white rounded-xl text-[10px] font-black uppercase tracking-[2px] active:scale-90 transition-all shadow-lg"
          >
            {t('btn_undo')}
          </button>
        </div>
      ), { duration: 6000, position: 'bottom-center' });
      
    } catch (err) { 
      toast.error(t("Process Fault"));
      console.error('❌ [DEFERRED DELETE] Failed to update local state:', err);
    }
  };

  const handleOpenGlobalModal = async (type: any) => {
    if (!activeBook?._id) return toast.error(t('err_select_vault'));
    const bookId = String(activeBook._id);
    const entries = await db.entries.where('bookId').equals(bookId).and((e: any) => e.isDeleted === 0).toArray();
    openModal(type, { entries, bookName: activeBook.name, currentBook: activeBook });
  };

  if (!mounted) return (
    <div className="min-h-screen bg-[#0F0F0F]" />
  );

  if (isLoading) return (
    <div className="min-h-screen bg-[#0F0F0F] flex flex-col items-center justify-center gap-6">
        <Loader2 className="animate-spin text-orange-500" size={56} />
        <span className="text-[10px] font-black uppercase tracking-[6px] text-white/20 animate-pulse italic">Loading Vault Data...</span>
    </div>
  );

  if (!isLoggedIn) return (
    <AuthScreen onLoginSuccess={(user) => { 
      localStorage.setItem('cashbookUser', JSON.stringify(user));
      setCurrentUser(user); 
      setIsLoggedIn(true); 
      orchestrator.initializeForUser(user._id).catch((err: any) => 
        console.warn('Login hydration failed:', err)
      );
    }} />
  );

  const sectionMap: Record<NavSection, React.ReactNode> = {
    books: <BooksSection 
              currentUser={currentUser} 
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
            setActiveBook={setActiveBook} 
        />
        
        <DashboardLayout
            activeSection={activeSection} 
            setActiveSection={setActiveSection}
            currentUser={currentUser} 
            currentBook={activeBook} 
            onLogout={() => orchestrator.logout()}
            onBack={() => setActiveBook(null)}
            onFabClick={handleFabClick}
            onOpenAnalytics={() => handleOpenGlobalModal('analytics')}
            onOpenExport={() => handleOpenGlobalModal('export')}
            onOpenShare={() => handleOpenGlobalModal('share')}
            onEditBook={() => openModal('editBook', { currentBook: activeBook, currentUser, onSubmit: handleSaveBookGlobal })}
            onDeleteBook={() => {
                if (activeBook) {
                    openModal('deleteConfirm', { 
                        targetName: activeBook.name, 
                        title: "PROTOCOL: TERMINATION", 
                        onConfirm: () => handleDeleteBookLogic(activeBook)
                    });
                }
            }}
            setActiveBook={setActiveBook}
        >
            <AnimatePresence mode="wait">
                <motion.div 
                    key={activeSection} 
                    initial={{ opacity: 0, y: 15 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                >
                    {!isOnline && (
                        <div className="mb-6 p-5 bg-orange-500/10 border border-orange-500/20 rounded-[28px] flex items-center gap-4 text-orange-500 shadow-xl backdrop-blur-md">
                            <WifiOff size={20} strokeWidth={2.5} />
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase tracking-[2px] leading-none">{t('status_offline')}</span>
                                <span className="text-[8px] font-bold text-white/40 uppercase mt-1">{t('err_no_internet')}</span>
                            </div>
                        </div>
                    )}
                    {sectionMap[activeSection as NavSection]}
                </motion.div>
            </AnimatePresence>
        </DashboardLayout>
    </>
  );
}