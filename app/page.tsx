"use client";

import React, { useEffect, Suspense } from 'react';
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

// Providers wrapper
import { Providers } from './providers';

function CashBookAppContent() {
  const { isSystemReady } = useBootStatus();
  const { 
    activeSection, setActiveSection, activeBook, 
    userId, currentUser, loginSuccess // 🚀 Use login actions from store
  } = useVaultState();
  
  const searchParams = useSearchParams();
  const router = useRouter();

  // 🆕 URL-AWARE STATE SYNC
  const tabFromUrl = searchParams.get('tab');
  const bookIdFromUrl = searchParams.get('id');
  
  const isLoggedIn = !!userId;

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

    const effectiveSection = tabFromUrl || activeSection || 'books';
    
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
  if (!isSystemReady) return <LoadingComponent />;

  return (
    <DashboardLayout>
      {renderView()}
    </DashboardLayout>
  );
}

export default function CashBookApp() {
  return (
    <Providers>
      {/* No-flicker fallback */}
      <Suspense fallback={<div className="h-screen w-screen bg-[var(--bg-app)]" />}>
        <CashBookAppContent />
      </Suspense>
    </Providers>
  );
}
