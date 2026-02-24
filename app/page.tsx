"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation'; // ✅ Fixed: Added useRouter

// Core components - ✅ Fixed: Using Curly Brackets for Named Exports
import AuthScreen from '@/components/Auth/AuthScreen';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import BooksSection from '@/components/Sections/Books/BooksSection';
import { BookDetails } from '@/components/Sections/Books/BookDetails';
import { SettingsSection } from '@/components/Sections/Settings/SettingsSection';

// Store hooks
import { useBootStatus, useVaultState } from '@/lib/vault/store/storeHelper';

// Core managers
import { identityManager } from '@/lib/vault/core/IdentityManager';
import { orchestrator } from '@/lib/vault/core/SyncOrchestrator';

function CashBookAppContent() {
  const { isSystemReady } = useBootStatus();
  const { activeSection, setActiveSection, activeBook } = useVaultState();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  // 🆕 URL-AWARE STATE SYNC: Read tab parameter from URL
  const tabFromUrl = searchParams.get('tab');
  const bookIdFromUrl = searchParams.get('id');
  
  // 🎯 URL PRIORITY: URL takes precedence over Zustand state
  useEffect(() => {
    if (tabFromUrl && tabFromUrl !== activeSection) {
      setActiveSection(tabFromUrl);
    }
  }, [tabFromUrl, activeSection, setActiveSection]);

  useEffect(() => {
    // Check initial auth state
    const userId = identityManager.getUserId();
    if (userId) {
      const savedUser = localStorage.getItem('cashbookUser');
      if (savedUser) {
        try {
          const userData = JSON.parse(savedUser);
          setCurrentUser(userData);
          setIsLoggedIn(true);
        } catch (e) {
          console.error("Auth initialization failed", e);
        }
      }
    }

    // Subscribe to identity changes
    const unsubscribe = identityManager.subscribe((userId) => {
      if (userId) {
        const savedUser = localStorage.getItem('cashbookUser');
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          setCurrentUser(userData);
          setIsLoggedIn(true);
        }
      } else {
        setCurrentUser(null);
        setIsLoggedIn(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLoginSuccess = (user: any) => {
    identityManager.setIdentity(user);
    setCurrentUser(user);
    setIsLoggedIn(true);
    orchestrator.initializeForUser(user._id).catch((err: any) => 
      console.warn('Login hydration failed:', err)
    );
  };

  const LoadingComponent = () => (
    <div className="min-h-screen bg-[#0F0F0F] flex flex-col items-center justify-center gap-6">
      <div className="flex-1 relative overflow-hidden">
        <Loader2 className="animate-spin text-orange-500" size={56} />
        <span className="text-[10px] font-black uppercase tracking-[6px] text-white/20 animate-pulse italic">
          Loading Vault Data...
        </span>
      </div>
    </div>
  );

  // ✅ VIEW ROUTER - PERSISTENT COMPONENT ARCHITECTURE
  const renderView = () => {
    const effectiveBookId = bookIdFromUrl || activeBook?._id || activeBook?.localId;

    // Priority 1: If we have a Book ID (URL or State), show Details
    if (effectiveBookId) {
      return <BookDetails currentUser={currentUser} bookId={String(effectiveBookId)} />;
    }

    // Priority 2: URL-based Section Navigation (URL > State)
    const effectiveSection = tabFromUrl || activeSection || 'books';
    
    // 🆕 PERSISTENT RENDERING: Keep all sections mounted, use CSS display
    return (
      <div className="relative w-full h-full">
        <div className={effectiveSection === 'books' ? 'block' : 'hidden'}>
          <BooksSection currentUser={currentUser} router={router} />
        </div>
        <div className={effectiveSection === 'settings' ? 'block' : 'hidden'}>
          <SettingsSection currentUser={currentUser} setCurrentUser={setCurrentUser} />
        </div>
        <div className={effectiveSection === 'reports' ? 'block' : 'hidden'}>
          <div className="p-8 text-center text-(--text-muted)">Reports Section Coming Soon</div>
        </div>
        <div className={effectiveSection === 'timeline' ? 'block' : 'hidden'}>
          <div className="p-8 text-center text-(--text-muted)">Timeline Section Coming Soon</div>
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
    <Suspense fallback={<div className="h-screen w-screen bg-[#F2F2F7] dark:bg-black" />}>
      <CashBookAppContent />
    </Suspense>
  );
}