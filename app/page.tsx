"use client";
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, WifiOff } from 'lucide-react';
import toast from 'react-hot-toast';

// --- Core Logic & Storage ---
import { db } from '@/lib/offlineDB';
import { orchestrator } from '@/lib/vault/SyncOrchestrator'; 
import AuthScreen from '@/components/Auth/AuthScreen';

// --- UI Shell & Layout ---
import { DashboardLayout } from '@/components/Layout/DashboardLayout';

// --- Domain-Driven Sections ---
import { BooksSection } from '@/components/Sections/Books/BooksSection';
import { ReportsSection } from '@/components/Sections/Reports/ReportsSection';
import { TimelineSection } from '@/components/Sections/Timeline/TimelineSection';
import { SettingsSection } from '@/components/Sections/Settings/SettingsSection';
import { ProfileSection } from '@/components/Sections/Profile/ProfileSection';

// --- 🔥 Update 1: CommandHub ইম্পোর্ট ---
import { CommandHub } from '@/components/Layout/CommandHub';

// --- Global Engine Hooks ---
import { useModal } from '@/context/ModalContext';

type NavSection = 'books' | 'reports' | 'timeline' | 'settings' | 'profile';

export default function CashBookApp() {
  const { openModal, closeModal } = useModal();

  // 1. Core Auth States (Safe Initialization)
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 2. Navigation & UI States
  const [currentBook, setCurrentBook] = useState<any>(null);
  const [activeSection, setActiveSection] = useState<NavSection>('books');
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // --- ৩. লাইফসাইকেল কন্ট্রোল (The Initialization Protocol) ---
  useEffect(() => {
    const initApp = async () => {
        const saved = localStorage.getItem('cashbookUser');
        if (saved) {
            const user = JSON.parse(saved);
            setCurrentUser(user);
            setIsLoggedIn(true);
            
            // অটো-হাইড্রেশন ও সিঙ্ক শুরু (সাইলেন্টলি ব্যাকগ্রাউন্ডে হবে)
            orchestrator.hydrate(user._id);
        }
        setIsLoading(false); 
    };
    initApp();

    // নেটওয়ার্ক মনিটর (UI নোটিফিকেশনের জন্য)
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // --- 🔥 Update 2: CommandHub অ্যাকশন হ্যান্ডলার ---
  const handleCommandAction = (actionId: string, book?: any) => {
    if (actionId === 'addBook') {
        openModal('addBook', { onSubmit: handleSaveBookGlobal, currentUser });
    } else if (actionId === 'selectBook' && book) {
        setCurrentBook(book);
        setActiveSection('books');
    }
  };

  // --- ৪. কোর এন্ট্রি লজিক (Offline-First + Orchestrator Trigger) ---

const handleSaveEntryLogic = async (data: any) => {
    if (!currentBook?._id && !currentBook?.localId) return toast.error("Vault reference missing");
    
    try {
        const timestamp = Date.now();
        const cid = data.cid || `cid_${timestamp}_${Math.random().toString(36).substr(2, 5)}`;
        
        const payload = { 
            ...data, 
            cid, 
            userId: String(currentUser._id), 
            bookId: String(currentBook._id || currentBook.localId),
            amount: Number(data.amount), 
            type: String(data.type).toLowerCase(),
            status: String(data.status || 'completed').toLowerCase(),
            synced: 0,
            isDeleted: 0,
            updatedAt: timestamp,
            date: data.date || new Date().toISOString() 
        };

        await db.entries.put(payload);

// 🔥 জাস্ট এই ৩ লাইন: এটি বইয়ের সময় আপডেট করে দেবে
const bKey = currentBook?.localId || currentBook?._id;
if (bKey) {
    await db.books.update(bKey, { updatedAt: timestamp, synced: 0 });
}
 closeModal();
window.dispatchEvent(new Event('vault-updated'));
        toast.success("Secured Locally");
        orchestrator.triggerSync(currentUser._id);
    } catch (err) { toast.error("Save Failed"); }
};

const handleDeleteEntryLogic = async (entry: any) => {
    try {
        const id = entry.localId || entry._id;
        const timestamp = Date.now();
        
        // ১. এন্ট্রি ডিলিট মার্ক করা
        await db.entries.update(id, { isDeleted: 1, synced: 0 });
        
        // ২. 🔥 ফিক্স: বইয়ের সময় আপডেট করা
        const bookId = String(entry.bookId);
        const book = await db.books.where('_id').equals(bookId).or('localId').equals(Number(bookId) || 0).first();
        if (book && book.localId) {
            await db.books.update(book.localId, { updatedAt: timestamp });
        }
        
        closeModal();
        window.dispatchEvent(new Event('vault-updated'));
        toast.success("Entry Erased");
        orchestrator.triggerSync(currentUser._id);
    } catch (err) { toast.error("Delete Failed"); }
};

  // --- ৫. গ্লোবাল বুক সেভ লজিক ---
const handleSaveBookGlobal = async (formData: any) => {
    try {
        const timestamp = Date.now();
        const targetId = currentBook?._id || formData?._id;

        // লোকাল সেভ আগে (Optimistic)
        const localData = {
            ...formData,
            userId: String(currentUser._id),
            updatedAt: timestamp,
            synced: 0,
            isDeleted: 0
        };

        if (targetId) {
            await db.books.where('_id').equals(targetId).or('localId').equals(currentBook?.localId || 0).modify(localData);
        } else {
            await db.books.add(localData);
        }

        window.dispatchEvent(new Event('vault-updated'));
        closeModal();
        if (!targetId) setCurrentBook(null);
        toast.success("Vault Node Secured");

        // সার্ভারে পাঠানোর সময় সব ফিল্ড নিশ্চিত করা
        const res = await fetch('/api/books', { 
            method: targetId ? 'PUT' : 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ 
                name: formData.name, 
                description: formData.description || "",
                userId: String(currentUser._id), 
                _id: targetId 
            }), 
        });

        if (res.ok) {
            const result = await res.json();
            const serverBook = result.book || result.data;
            // সার্ভার আইডি দিয়ে লোকাল ডাটা সিঙ্কড করা
            await db.books.where('updatedAt').equals(timestamp).modify({ _id: serverBook._id, synced: 1 });
        }
    } catch (err) { console.error(err); }
};

  // --- ৬. UI ইন্টারঅ্যাকশন হ্যান্ডলারস ---
  const handleFabClick = () => {
    if (currentBook) {
        openModal('addEntry', { currentUser, currentBook, onSubmit: handleSaveEntryLogic });
    } else {
        setActiveSection('books');
        openModal('addBook', { onSubmit: handleSaveBookGlobal, currentUser });
    }
  };

  const handleOpenGlobalModal = async (type: any) => {
    if (!currentBook?._id) return toast.error("Select a vault node first");
    const bookId = String(currentBook._id);
    const entries = await db.entries.where('bookId').equals(bookId).and(e => e.isDeleted === 0).toArray();
    openModal(type, { entries, bookName: currentBook.name, currentBook });
  };

  // --- ৭. মাস্টার রেন্ডার কন্ট্রোল ---
  if (isLoading) return <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center"><Loader2 className="animate-spin text-orange-500" size={48} /></div>;
  
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
              currentUser={currentUser} currentBook={currentBook} setCurrentBook={setCurrentBook} 
              onGlobalSaveBook={handleSaveBookGlobal} 
           />,
    reports: <ReportsSection currentUser={currentUser} />,
    timeline: <TimelineSection currentUser={currentUser} onBack={() => setActiveSection('books')} />,
    settings: <SettingsSection currentUser={currentUser} setCurrentUser={setCurrentUser} />,
    profile: <ProfileSection currentUser={currentUser} setCurrentUser={setCurrentUser} onLogout={() => orchestrator.logout()} />
  };

  return (
    <>
        {/* 🔥 Update 3: CommandHub এখানে লোড করা হলো */}
        <CommandHub
            isOpen={false} 
            onClose={() => {}} 
            onAction={handleCommandAction}
            currentUser={currentUser}
            setActiveSection={setActiveSection}
            setCurrentBook={setCurrentBook} 
        />
        
        <DashboardLayout
            // @ts-ignore
            activeSection={activeSection} setActiveSection={setActiveSection}
            currentUser={currentUser} currentBook={currentBook} 
            onLogout={() => orchestrator.logout()}
            onBack={() => setCurrentBook(null)}
            onFabClick={handleFabClick}
            onOpenAnalytics={() => handleOpenGlobalModal('analytics')}
            onOpenExport={() => handleOpenGlobalModal('export')}
            onOpenShare={() => handleOpenGlobalModal('share')}
            onEditBook={() => openModal('editBook', { currentBook, currentUser, onSubmit: handleSaveBookGlobal })}
            onDeleteBook={() => {
                if (currentBook) {
                    openModal('deleteConfirm', { 
                        targetName: currentBook.name, 
                        title: "PROTOCOL: TERMINATION", 
                        onConfirm: async () => {
                            if (currentBook._id) {
                                await fetch(`/api/books/${currentBook._id}`, { method: 'DELETE' });
                            }
                            await db.books.update(currentBook.localId, { isDeleted: 1, synced: 1 });
                            
                            closeModal();
                            setCurrentBook(null);
                            window.dispatchEvent(new Event('vault-updated'));
                            toast.success('Node Erased Successfully');
                        }
                    });
                }
            }}
        >
            <AnimatePresence mode="wait">
                <motion.div 
                    key={activeSection} 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    {!isOnline && (
                        <div className="mb-6 p-4 bg-orange-500/10 border border-orange-500/20 rounded-[20px] flex items-center gap-3 text-orange-500 shadow-xl backdrop-blur-md">
                            <WifiOff size={16} />
                            <span className="text-[10px] font-black uppercase tracking-[2px]">Offline Mode: Data Secured Locally</span>
                        </div>
                    )}
                    {sectionMap[activeSection]}
                </motion.div>
            </AnimatePresence>
        </DashboardLayout>
    </>
  );
}