"use client";



import React, { useEffect, Suspense } from 'react';

import { motion, AnimatePresence } from 'framer-motion';

import { Loader2 } from 'lucide-react';

import { useSearchParams, useRouter } from 'next/navigation';



// Core components

import AuthScreen from '@/components/Auth/AuthScreen';

import { DashboardLayout } from '@/components/Layout/DashboardLayout';

import BooksSection from '@/components/Sections/Books/BooksSection';

import { BookDetails } from '@/components/Sections/Books/BookDetails';

import { SettingsSection } from '@/components/Sections/Settings/SettingsSection';

import { ProfileSection } from '@/components/Sections/Profile/ProfileSection';



// Store hooks & logic

import { useBootStatus, useVaultState } from '@/lib/vault/store/storeHelper';

import { orchestrator } from '@/lib/vault/core/SyncOrchestrator';



function CashBookAppContent() {

  const { isSystemReady } = useBootStatus();

  const { 

    activeSection, setActiveSection, activeBook, 

    userId, currentUser, loginSuccess, isCleaning // 

  } = useVaultState();

  

  const searchParams = useSearchParams();

  const router = useRouter();



  // URL-AWARE STATE SYNC

  const tabFromUrl = searchParams.get('tab');

  const bookIdFromUrl = searchParams.get('id');

  

  const isLoggedIn = !!userId;



  // 🛡️ UNIFIED SECTION LOGIC: Single source of truth for transitions

  const effectiveSection = activeBook ? 'book-details' : (tabFromUrl || activeSection || 'books');



  // 🎯 URL PRIORITY SYNC

  useEffect(() => {

    if (tabFromUrl && tabFromUrl !== activeSection) {

      setActiveSection(tabFromUrl);

    }

  }, [tabFromUrl, activeSection, setActiveSection]);



  const handleLoginSuccess = (user: any) => {

    loginSuccess(user); // 🚀 Let the store handle the heavy lifting

    orchestrator.initializeForUser(user._id).catch((err: any) => 

      console.warn('Login hydration failed:', err)

    );

  };



  // 🛡️ NATIVE THEME-AWARE LOADER

  const LoadingComponent = () => (

    <div className="min-h-screen bg-[var(--bg-app)] flex flex-col items-center justify-center gap-6">

      <div className="flex flex-col items-center gap-4">

        <Loader2 className="animate-spin text-orange-500" size={56} />

        <span className="text-[10px] font-black text-[var(--text-muted)] animate-pulse  ">

          Verifying Vault Node...

        </span>

      </div>

    </div>

  );



  const renderView = () => {

    // 🛡️ TRIPLE-LINK ID PROTOCOL

    const effectiveBookId = bookIdFromUrl || activeBook?._id || activeBook?.localId;



    if (effectiveBookId) {

      return <BookDetails currentUser={currentUser} bookId={String(effectiveBookId)} />;

    }



    return (

      <div className="relative w-full h-full">

        {/* 🚀 PERSISTENT MOUNTING: Scroll memory and state preserved */}

        <div className={effectiveSection === 'books' ? 'block' : 'hidden'}>

          <BooksSection currentUser={currentUser} router={router} />

        </div>

        <div className={effectiveSection === 'settings' ? 'block' : 'hidden'}>

          <SettingsSection />

        </div>

        <div className={effectiveSection === 'profile' ? 'block' : 'hidden'}>

          <ProfileSection />

        </div>

        <div className={effectiveSection === 'reports' ? 'block' : 'hidden'}>

          <div className="p-20 text-center text-[var(--text-muted)] font-black opacity-20">

            Analytics Node Offline

          </div>

        </div>

        <div className={effectiveSection === 'timeline' ? 'block' : 'hidden'}>

          <div className="p-20 text-center text-[var(--text-muted)] font-black opacity-20">

            Timeline Sequence Locked

          </div>

        </div>

      </div>

    );

  };



  if (!isLoggedIn) return <AuthScreen onLoginSuccess={handleLoginSuccess} />;



  return (

    <DashboardLayout>

      <AnimatePresence mode="wait">

        <motion.div

          key={effectiveSection}

          initial={{ opacity: 0, y: 20 }}

          animate={{ opacity: 1, y: 0 }}

          exit={{ opacity: 0, y: -20 }}

          transition={{ type: "spring", stiffness: 300, damping: 35, mass: 1 }}

          className="relative w-full h-full"

        >

          {renderView()}

        </motion.div>

      </AnimatePresence>

    </DashboardLayout>

  );

}



export default function CashBookApp() {

  return (

    // 🛡️ NO-FLICKER FALLBACK

    <Suspense fallback={<div className="h-screen w-screen bg-[var(--bg-app)]" />}>

      <CashBookAppContent />

    </Suspense>

  );

}