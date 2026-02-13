"use client";
import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { useModal } from '@/context/ModalContext';
import { Plus, Zap } from 'lucide-react';

// Global Engine Hooks & Components
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip';
import { cn } from '@/lib/utils/helpers';

// মডাল কম্পোনেন্ট ইম্পোর্টস
import { 
  ModalLayout, 
  BookModal, 
  EntryModal, 
  DeleteConfirmModal, 
  AdvancedExportModal 
} from './index';
import { ShareModal } from './ShareModal';
import { TerminationModal } from './TerminationModal';
import { ConflictResolverModal } from './ConflictResolverModal';
import { AnalyticsChart } from '@/components/AnalyticsChart'; // পাথ সিঙ্ক করা হয়েছে

/**
 * VAULT PRO: MASTER MODAL REGISTRY (V12.0 ELITE)
 * -----------------------------------------------
 * Status: Final Polish, Safe Lifecycle, Multi-type Payload Handling.
 */
export const ModalRegistry = () => {
  const { view, isOpen, data, closeModal } = useModal();
  const { t, language } = useTranslation();

  return (
    <AnimatePresence mode="popLayout">
      {/* ১. বুক ম্যানেজমেন্ট প্রোটোকল */}
      {(view === 'addBook' || view === 'editBook') && (
        <BookModal 
          key="book-modal"
          isOpen={isOpen}
          onClose={closeModal}
          initialData={data?.currentBook || data?.book || null}
          currentUser={data?.currentUser}
          onSubmit={data?.onSubmit}
        />
      )}

      {/* ২. এন্ট্রি ম্যানেজমেন্ট প্রোটোকল */}
      {(view === 'addEntry' || view === 'editEntry') && (
        <EntryModal 
          key="entry-modal"
          isOpen={isOpen}
          onClose={closeModal}
          currentUser={data?.currentUser}
          currentBook={data?.currentBook || data?.book}
          initialData={data?.entry || data?.initialData || null}
          onSubmit={data?.onSubmit}
        />
      )}

      {/* ৩. ভিজ্যুয়াল ইন্টেলিজেন্স (Analytics) */}
      {view === 'analytics' && (
        <ModalLayout 
          key="analytics-modal" 
          title={t('modal_analytics_title') || "ANALYTICS INTELLIGENCE"} 
          onClose={closeModal}
          isOpen={isOpen}
        >
          <div className="min-h-[450px] py-6 px-2 overflow-y-auto no-scrollbar">
            <AnalyticsChart entries={data?.entries || []} />
          </div>
        </ModalLayout>
      )}

      {/* ৪. ডাটা এক্সট্রাকশন (Export) */}
      {view === 'export' && (
        <AdvancedExportModal 
          key="export-modal" 
          isOpen={isOpen}
          onClose={closeModal} 
          entries={data?.entries || []} 
          bookName={data?.bookName || data?.currentBook?.name} 
        />
      )}

      {/* ৫. শেয়ারড অ্যাক্সেস প্রোটোকল */}
      {view === 'share' && (
        <ShareModal 
          key="share-modal" 
          isOpen={isOpen}
          onClose={closeModal} 
          currentBook={data?.currentBook || data?.book} 
          onToggleShare={data?.onToggleShare} 
        />
      )}

      {/* ৬. টার্মিনেশন প্রোটোকল (Delete Confirmations) */}
      {(view === 'deleteConfirm' || view === 'deleteBookConfirm' || view === 'deleteTagConfirm') && (
        <TerminationModal 
          key="termination-modal"
          isOpen={isOpen}
          onClose={closeModal}
          targetName={data?.targetName}
          title={data?.title}
          desc={data?.desc}
          onConfirm={data?.onConfirm}
        />
      )}

      {/* ৭. সিস্টেম শর্টকাট হাব */}
      {view === 'shortcut' && (
        <ModalLayout 
          key="shortcut-modal" 
          title={t('modal_shortcut_title') || "SYSTEM SHORTCUTS"} 
          onClose={closeModal}
          isOpen={isOpen}
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
                          <p className="font-black uppercase text-sm tracking-[3px] text-[var(--text-main)]">
                            {t('initialize_ledger')}
                          </p>
                          <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1.5 opacity-60">
                            {t('shortcut_desc')}
                          </p>
                        </div>
                        <Zap size={16} className="ml-auto text-orange-500 opacity-20 group-hover:opacity-100 transition-opacity" />
                  </button>
              </Tooltip>
          </div>
        </ModalLayout>
      )}

      {/* ৮. কনফ্লিক্ট রেজোলভার প্রোটোকল */}
      {view === 'conflictResolver' && <ConflictResolverModal />}
    </AnimatePresence>
  );
};