"use client";

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// 🍎 TOAST ITEM INTERFACE
export interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'warning' | 'undo';
  message: string;
  duration?: number;
  countdown?: number;
  onUndo?: () => void;
}

// 🍎 TOAST STATE INTERFACE
export interface ToastState {
  toasts: ToastItem[];
  isInteractionLocked: boolean;
}

// 🍎 TOAST ACTIONS INTERFACE
export interface ToastActions {
  showToast: (toast: Omit<ToastItem, 'id'>) => string;
  hideToast: (id: string) => void;
  clearAllToasts: () => void;
  setInteractionLocked: (locked: boolean) => void;
}

// 🍎 TOAST VAULT INTERFACE
export interface ToastVault extends ToastState, ToastActions {}

// 🍎 TOAST SLICE CREATOR
export const createToastSlice = (set: (updater: (state: ToastState) => Partial<ToastState>) => void, get: () => ToastVault, api: any): ToastVault => ({
  // 📊 INITIAL STATE
  toasts: [],
  isInteractionLocked: false,

  // 🍎 SHOW TOAST
  showToast: (toast: Omit<ToastItem, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast = { ...toast, id };
    
    set((state: ToastState) => {
      return {
        toasts: [...state.toasts.slice(-2), newToast], // Max 3 toasts
      };
    });
    
    return id; // ✅ MUST RETURN THE ID
  },

  // 🍎 HIDE TOAST
  hideToast: (id: string) => {
    set((state: ToastState) => {
      return {
        toasts: state.toasts.filter((toast: ToastItem) => toast.id !== id),
      };
    });
  },

  // 🍎 CLEAR ALL TOASTS
  clearAllToasts: () => {
    set((state: ToastState) => ({ toasts: [] }));
  },

  // 🍎 SET INTERACTION LOCKED
  setInteractionLocked: (locked: boolean) => {
    set((state: ToastState) => ({ isInteractionLocked: locked }));
  },
});
