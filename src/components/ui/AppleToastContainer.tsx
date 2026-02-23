"use client";

import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { useVaultStore } from '@/lib/vault/store';
import { AppleToast } from './AppleToast';

export const AppleToastContainer = () => {
  const { toasts } = useVaultStore();

  return (
    <div className="fixed inset-x-0 bottom-12 z-[10000] pointer-events-none flex justify-center px-4">
      <AnimatePresence>
        {toasts && toasts.length > 0 && toasts.map((toast) => (
          toast && toast.id ? <AppleToast key={toast.id} {...toast} /> : null
        ))}
      </AnimatePresence>
    </div>
  );
};