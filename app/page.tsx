"use client";



import React, { useEffect, useState, Suspense } from 'react';

import { motion, AnimatePresence } from 'framer-motion';

import { Loader2 } from 'lucide-react';

import { useSearchParams, useRouter } from 'next/navigation';

import dynamic from 'next/dynamic';

// Core components

const AuthScreen = dynamic(() => import('@/components/Auth/AuthScreen'), { ssr: false });

import { DashboardLayout } from '@/components/Layout/DashboardLayout';

import BooksSection from '@/components/Sections/Books/BooksSection';

import { BookDetails } from '@/components/Sections/Books/BookDetails';

import { SettingsSection } from '@/components/Sections/Settings/SettingsSection';

import { ProfileSection } from '@/components/Sections/Profile/ProfileSection';



// Store hooks & logic

import { useBootStatus, useVaultState } from '@/lib/vault/store/storeHelper';

import { getOrchestrator } from '@/lib/vault/core/SyncOrchestrator';

import { UserManager } from '@/lib/vault/core/user/UserManager';



function CashBookAppContent() {

  // 🛡️ MOUNTING BARRIER: Prevent server-side HTML mismatch
  const [isMounted, setIsMounted] = useState(false);
  
  // Set mounted state on client-side only
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { isSystemReady } = useBootStatus();

  const { 

    activeSection, setActiveSection, activeBook, 

    userId, currentUser, loginSuccess, isCleaning, // 

    bootStatus // ✅ ADDED: Boot status state

  } = useVaultState();

  

  // 🚀 BOOT: Populate memory cache once during app startup
  useEffect(() => {
    const userManager = UserManager.getInstance();
    userManager.boot().catch((error: any) => {
      console.warn('🚨 [APP] UserManager boot failed:', error);
    });
  }, []); // Run once on mount

  const searchParams = useSearchParams();

  const router = useRouter();



  // URL-AWARE STATE SYNC

  const tabFromUrl = searchParams.get('tab');

  const bookIdFromUrl = searchParams.get('id');

  

  const isLoggedIn = !!userId;
  
  // 🛡️ IDENTITY ANCHOR CHECK: Proactive session flag check
  const hasSession = typeof window !== 'undefined' && !!localStorage.getItem('auth_token');

  

  // 🚀 HOLY GRAIL BINARY GATE: PENDING state with Pathor Gate
  const [authState, setAuthState] = useState<'loading' | 'authenticated' | 'unauthenticated' | 'PENDING'>(
    'PENDING' // ✅ BINARY GATE: Always start with PENDING
  );

  

  // 🎯 TRIPLE-LOCK CHECK: Proactive Binary Gate - No Reactive Logic
  useEffect(() => {
    if (bootStatus === 'READY') {
      // Proactive Check: If we have a hydrated ID OR even just a raw session token, assume Authenticated.
      if (isLoggedIn || hasSession) {
        setAuthState('authenticated');
        console.log('🚀 [AUTH] User authenticated - showing dashboard');
        
        // 🔄 STEP 3: Background Verification
        UserManager.getInstance().verifySession().then((isValid: boolean) => {
          if (!isValid) {
            console.log('❌ [AUTH] Background verification failed - showing login screen');
            setAuthState('unauthenticated');
          }
        });
      } else {
        setAuthState('unauthenticated');
        console.log('❌ [AUTH] No user - showing login');
      }
    } else {
      // While booting, ALWAYS stay in loading state (Blank Screen)
      setAuthState('loading');
      console.log('🚀 [AUTH] System booting - blank screen');
    }
  }, [isLoggedIn, hasSession, bootStatus]); // ✅ Add hasSession dependency



  // 🛡️ UNIFIED SECTION LOGIC: Single source of truth for transitions

  const effectiveSection = activeBook ? 'book-details' : (tabFromUrl || activeSection || 'books');



  // 🎯 URL PRIORITY SYNC

  useEffect(() => {

    if (tabFromUrl && tabFromUrl !== activeSection) {

      setActiveSection(tabFromUrl);

    }

  }, [tabFromUrl, activeSection, setActiveSection]);



  const handleLoginSuccess = (user: any) => {
    console.log('🔐 [AUTH] Login success - storing session');
    
    // 🚀 Store session in UserManager
    UserManager.getInstance().storeSession(user);
    
    loginSuccess(user); // 🚀 Let's store handle the heavy lifting

    getOrchestrator().initializeForUser(user._id).catch((err: any) => 
      console.warn('Login hydration failed:', err)
    );
  };



  // 🛡️ PATHOR LOADING SCREEN - Zero-Flicker Experience
  const PathorLoadingScreen = () => (
    <div className="bg-[#0a0a0a] h-screen w-screen" />
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



  // 🚀 CRITICAL: Mounting Barrier - Prevent server-side HTML mismatch
  if (!isMounted) {
    return <div className="fixed inset-0 bg-[#0a0a0a]" />;
  }

  // 🎯 AUTH-BASED RENDERING: Use 3-step auth state with Pathor Gate
  if (authState === 'loading') {
    return <PathorLoadingScreen />;
  }

  if (authState === 'PENDING') {
    // 🛡️ PATHOR GATE: Blank screen during boot phase
    return <div className="bg-[#0a0a0a] h-screen w-screen" />;
  }

  if (authState === 'unauthenticated') {
    return <AuthScreen onLoginSuccess={handleLoginSuccess} />;
  }



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
