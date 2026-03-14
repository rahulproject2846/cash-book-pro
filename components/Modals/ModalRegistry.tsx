"use client";
import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { useModal } from '@/context/ModalContext';
import { Plus, Zap } from 'lucide-react';

// Global Engine Hooks & Components
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip';
import { cn } from '@/lib/utils/helpers';

// Modal Components
import { 
  UnifiedModalWrapper,
  BookModal, 
  EntryModal, 
  AdvancedExportModal,
  ActionMenuModal
} from './index';
import { ShareModal } from './ShareModal';
import { TerminationModal } from './TerminationModal';
import { ConflictResolverModal } from './ConflictResolverModal';
import { AnalyticsChart } from '@/components/AnalyticsChart';

/**
 * VAULT PRO: MASTER MODAL REGISTRY (V13.0 - UNIFIED SHELL)
 * -----------------------------------------------
 * All modals now use UnifiedModalWrapper for consistent physics and positioning.
 */
export const ModalRegistry = () => {
  const { view, isOpen, data, closeModal } = useModal();
  const { t } = useTranslation();

  const renderContent = () => {
    switch (view) {
      case 'actionMenu':
        return (
          <UnifiedModalWrapper isOpen={isOpen} onClose={closeModal}>
            <ActionMenuModal isOpen={isOpen} onClose={closeModal} />
          </UnifiedModalWrapper>
        );

      case 'addBook':
      case 'editBook':
        return (
          <UnifiedModalWrapper 
            isOpen={isOpen && (view === 'addBook' || view === 'editBook')} 
            onClose={closeModal}
          >
            <BookModal 
              isOpen={isOpen}
              onClose={closeModal}
              initialData={data?.editTarget || data?.currentBook || data?.book || null}
              currentUser={data?.currentUser}
            />
          </UnifiedModalWrapper>
        );

      case 'addEntry':
      case 'editEntry':
        return (
          <UnifiedModalWrapper 
            isOpen={isOpen} 
            onClose={closeModal}
          >
            <EntryModal 
              isOpen={isOpen}
              onClose={closeModal}
              currentUser={data?.currentUser}
              currentBook={data?.currentBook || data?.book}
              initialData={data?.entry || data?.initialData || null}
            />
          </UnifiedModalWrapper>
        );

      case 'analytics':
        return (
          <UnifiedModalWrapper 
            isOpen={isOpen} 
            onClose={closeModal}
          >
            <div className="min-h-[450px] py-6 px-2 overflow-y-auto no-scrollbar">
              <AnalyticsChart entries={data?.entries || []} />
            </div>
          </UnifiedModalWrapper>
        );

      case 'export':
        return (
          <UnifiedModalWrapper 
            isOpen={isOpen} 
            onClose={closeModal}
          >
            <AdvancedExportModal 
              isOpen={isOpen}
              onClose={closeModal}
              entries={data?.entries || []} 
              bookName={data?.bookName || data?.currentBook?.name} 
            />
          </UnifiedModalWrapper>
        );

      case 'share':
        return (
          <UnifiedModalWrapper 
            isOpen={isOpen} 
            onClose={closeModal}
          >
            <ShareModal 
              isOpen={isOpen}
              onClose={closeModal}
              currentBook={data?.currentBook || data?.book} 
              onToggleShare={data?.onToggleShare} 
            />
          </UnifiedModalWrapper>
        );

      case 'deleteConfirm':
      case 'deleteBookConfirm':
      case 'deleteTagConfirm':
        return (
          <UnifiedModalWrapper 
            isOpen={isOpen} 
            onClose={closeModal}
          >
            <TerminationModal 
              isOpen={isOpen}
              onClose={closeModal}
              targetName={data?.targetName}
              desc={data?.desc}
              onConfirm={data?.onConfirm}
            />
          </UnifiedModalWrapper>
        );

      case 'shortcut':
        return (
          <UnifiedModalWrapper 
            isOpen={isOpen} 
            onClose={closeModal}
          >
            <div className="p-4 space-y-4">
              <Tooltip text={t('tt_shortcut_initialize')}>
                <button 
                  onClick={() => { if (data?.onInitialize) data.onInitialize(); }} 
                  className={cn(
                    "w-full p-8 bg-[var(--bg-app)] border-2 border-[var(--border)] rounded-[32px]",
                    "flex items-center gap-6 group hover:bg-orange-500/5 hover:border-orange-500/40 transition-all shadow-xl"
                  )}
                >
                  <div className="p-4 bg-orange-500 rounded-2xl text-white shadow-lg shadow-orange-500/20 group-hover:scale-110 transition-transform">
                    <Plus size={28} strokeWidth={4}/>
                  </div>
                  <div className="text-left">
                    <p className="font-black text-sm text-[var(--text-main)]">
                      {t('initialize_ledger')}
                    </p>
                    <p className="text-[10px] font-bold text-[var(--text-muted)] mt-1.5 opacity-60">
                      {t('shortcut_desc')}
                    </p>
                  </div>
                  <Zap size={16} className="ml-auto text-orange-500 opacity-20 group-hover:opacity-100 transition-opacity" />
                </button>
              </Tooltip>
            </div>
          </UnifiedModalWrapper>
        );

      case 'conflictResolver':
        return (
          <UnifiedModalWrapper 
            isOpen={isOpen} 
            onClose={closeModal}
          >
            <ConflictResolverModal 
              isOpen={isOpen}
              onClose={closeModal}
              record={data?.record}
              type={data?.type}
              onResolve={data?.onResolve}
            />
          </UnifiedModalWrapper>
        );

      default:
        return null;
    }
  };

  return (
    <AnimatePresence mode="popLayout">
      {isOpen && renderContent()}
    </AnimatePresence>
  );
};