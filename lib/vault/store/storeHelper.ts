import { useVaultStore } from './index';

// Legacy static access (keep for emergency cases)
export const getVaultStore = () => useVaultStore.getState();

// 🚀 UNIFIED REACTIVE HOOKS FOR V9.6

// Simple reactive hook returning full store
export const useVaultState = () => useVaultStore();

// Boot status management hook
export const useBootStatus = () => {
  const store = useVaultStore();
  return {
    bootStatus: store.bootStatus,
    isSystemReady: store.bootStatus === 'READY',
    isSystemInitializing: store.bootStatus !== 'READY' && store.bootStatus !== 'IDLE'
  };
};

// Interaction guard hook
export const useInteractionGuard = () => {
  const store = useVaultStore();
  return {
    activeOverlays: store.activeOverlays,
    isInteractionBlocked: store.activeOverlays.length > 0
  };
};
