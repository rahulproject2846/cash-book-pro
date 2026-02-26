"use client";

import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { useVaultState, useBootStatus } from '@/lib/vault/store/storeHelper';
import { nuclearReset } from '@/lib/system/RecoveryUtil';

export const OfflineToaster: React.FC = () => {
  // 🛡️ UNIFIED STATE MANAGEMENT
  const { 
    networkMode, 
    isSecurityLockdown, 
    syncStatus, 
    registerOverlay,
    unregisterOverlay,
    emergencyHydrationStatus,
    securityErrorMessage
  } = useVaultState();
  const { bootStatus, isSystemReady } = useBootStatus(); 

  const [isVisible, setIsVisible] = useState(true);
  const [showResetButton, setShowResetButton] = useState(false);
  const [lockdownStartTime, setLockdownStartTime] = useState<number | null>(null);

  useEffect(() => {
    if (isSecurityLockdown && !lockdownStartTime) {
      setLockdownStartTime(Date.now());
    } else if (!isSecurityLockdown) {
      setLockdownStartTime(null);
      setShowResetButton(false);
    }
  }, [isSecurityLockdown, lockdownStartTime]);

  useEffect(() => {
    if (isSecurityLockdown) {
      const timer = setInterval(() => {
        if (lockdownStartTime && Date.now() - lockdownStartTime > 30000) {
          setShowResetButton(true);
        }
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isSecurityLockdown, lockdownStartTime]);

  useEffect(() => {
    if (networkMode === 'OFFLINE' || networkMode === 'DEGRADED' || emergencyHydrationStatus === 'hydrating' || (bootStatus && bootStatus !== 'READY')) {
      setIsVisible(true);
      registerOverlay('SystemToast'); // Register toast as overlay
      const autoHideTimer = setTimeout(() => {
        if (!isSecurityLockdown && emergencyHydrationStatus === 'idle' && isSystemReady) {
          setIsVisible(false);
          unregisterOverlay('SystemToast'); // Unregister toast when ready
        }
      }, 5000);
      return () => clearTimeout(autoHideTimer);
    }
  }, [networkMode, isSecurityLockdown, emergencyHydrationStatus, bootStatus, isSystemReady, registerOverlay, unregisterOverlay]);

  const getMessage = () => {
    if (emergencyHydrationStatus === 'hydrating' || (bootStatus && bootStatus !== 'READY' && bootStatus !== 'IDLE')) {
      return {
        title: '⚙️ System Initializing...',
        subtitle: securityErrorMessage || 'Please wait while we prepare your data.'
      };
    }
    if (emergencyHydrationStatus === 'failed') {
      return {
        title: '🚨 Recovery Failed',
        subtitle: 'Automatic recovery failed. Please use Reset App.'
      };
    }
    if (isSecurityLockdown) {
      return {
        title: '🚨 SECURITY BREACH',
        subtitle: showResetButton 
          ? 'Tap "Reset App" to recover' 
          : 'Critical license data missing. Connecting to internet...'
      };
    }
    switch (networkMode) {
      case 'DEGRADED': return { title: '⚠️ Unstable connection', subtitle: 'Real-time paused' };
      case 'OFFLINE': return { title: '📡 You are offline', subtitle: 'Data saved locally' };
      case 'RESTRICTED': return { title: '🔒 SECURITY LOCKDOWN', subtitle: 'App restricted' };
      default: return { title: '', subtitle: '' };
    }
  };

  const message = getMessage();
  if (!message.title && syncStatus !== 'syncing') return null;

  const colorClasses = (isSecurityLockdown || networkMode === 'RESTRICTED' || emergencyHydrationStatus === 'failed')
    ? 'bg-red-500/10 border border-red-500/20 text-red-600'
    : (emergencyHydrationStatus === 'hydrating' || (bootStatus && bootStatus !== 'READY' && bootStatus !== 'IDLE'))
    ? 'bg-blue-500/10 border border-blue-500/20 text-blue-600'
    : networkMode === 'DEGRADED'
    ? 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-600'
    : 'bg-orange-500/10 border border-orange-500/20 text-orange-500';

  return (
    <div 
      className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-[200] shadow-2xl transition-all duration-300 p-5 rounded-[28px] flex items-center gap-4 backdrop-blur-md cursor-pointer ${
        isVisible || isSecurityLockdown || emergencyHydrationStatus !== 'idle' || (bootStatus && bootStatus !== 'READY') ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0 pointer-events-none'
      } ${colorClasses}`}
      onClick={() => {
        if (!isSecurityLockdown && emergencyHydrationStatus === 'idle' && isSystemReady) setIsVisible(false);
      }}
    >
      { (emergencyHydrationStatus === 'hydrating' || (bootStatus && bootStatus !== 'READY' && bootStatus !== 'IDLE')) ? <RefreshCw className="animate-spin" size={20} /> : <WifiOff size={20} />}
      <div className="flex flex-col">
        <span className="text-[10px] font-black      leading-none">{message.title}</span>
        <span className="text-[8px] font-bold text-white/40   mt-1">{message.subtitle}</span>
        {showResetButton && (
          <button 
            onClick={(e) => { e.stopPropagation(); nuclearReset(); }}
            className="mt-3 px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors font-bold"
          >
            Reset App
          </button>
        )}
      </div>
    </div>
  );
};
