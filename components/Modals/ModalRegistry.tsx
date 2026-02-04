"use client";
import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { useModal } from '@/context/ModalContext';
import { Plus } from 'lucide-react';

// Global Engine Hooks & Components
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip';

// মডাল কম্পোনেন্ট ইম্পোর্টস
import { 
  ModalLayout, 
  BookModal, 
  EntryModal, 
  DeleteConfirmModal, 
  AdvancedExportModal 
} from './index';
import { ShareModal } from './ShareModal';
import { AnalyticsChart } from '@/components/AnalyticsChart';

/**
 * VAULT PRO: MASTER MODAL REGISTRY (STABILIZED)
 * -------------------------------------------
 * Acts as the single injection point for all system modals.
 * Fully integrated with Global Spacing, Language, and Guidance.
 */
export const ModalRegistry = () => {
  const { view, isOpen, data, closeModal } = useModal();
  const { T, t } = useTranslation();

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* ১. বুক অ্যাড / এডিট মডাল */}
          {(view === 'addBook' || view === 'editBook') && (
            <BookModal 
              key="book-modal"
              type={view === 'addBook' ? 'add' : 'edit'}
              isOpen={true}
              onClose={closeModal}
              initialData={data?.currentBook || data?.book || null}
              currentUser={data?.currentUser}
              onSubmit={data?.onSubmit}
              formData={data?.bookForm}
              setFormData={data?.setBookForm}
            />
          )}

          {/* ২. এন্ট্রি অ্যাড / এডিট মডাল */}
          {(view === 'addEntry' || view === 'editEntry') && (
            <EntryModal 
              key="entry-modal"
              isOpen={true}
              onClose={closeModal}
              currentUser={data?.currentUser}
              currentBook={data?.currentBook || data?.book}
              initialData={data?.entry || data?.initialData || null}
              onSubmit={data?.onSubmit}
            />
          )}

          {/* ৩. এনালাইটিক্স মডাল */}
          {view === 'analytics' && (
            <ModalLayout 
              key="analytics-modal" 
              title={T('modal_analytics_title') || "Vault Intelligence"} 
              onClose={closeModal}
            >
              <div className="h-[450px] py-4" onClick={(e) => e.stopPropagation()}>
                <AnalyticsChart entries={data?.entries || []} />
              </div>
            </ModalLayout>
          )}

          {/* ৪. এক্সপোর্ট মডাল */}
          {view === 'export' && (
            <AdvancedExportModal 
              key="export-modal" 
              isOpen={true} 
              onClose={closeModal} 
              entries={data?.entries || []} 
              bookName={data?.bookName} 
            />
          )}

          {/* ৫. শেয়ার মডাল */}
          {view === 'share' && (
            <ShareModal 
              key="share-modal" 
              isOpen={true} 
              onClose={closeModal} 
              currentBook={data?.currentBook || data?.book} 
              onToggleShare={data?.onToggleShare} 
            />
          )}

          {/* ৬. ডিলিট কনফার্মেশন */}
          {(view === 'deleteConfirm' || view === 'deleteBookConfirm') && (
            <DeleteConfirmModal 
              key="delete-confirm-modal"
              targetName={data?.targetName}
              onConfirm={data?.onConfirm}
              onClose={closeModal}
            />
          )}

          {/* ৭. প্রোটোকল শর্টকাট মডাল (Fully Refactored for UX) */}
          {view === 'shortcut' && (
            <ModalLayout 
              key="shortcut-modal" 
              title={T('modal_shortcut_title') || "Protocol Shortcut"} 
              onClose={closeModal}
            >
              <div className="grid grid-cols-1 gap-[var(--app-gap,1rem)] p-2">
                  <Tooltip text={t('tt_shortcut_initialize')}>
                      <button 
                          onClick={() => { if (data?.onInitialize) data.onInitialize(); }} 
                          className="w-full p-[var(--card-padding,1.5rem)] bg-white/[0.03] border-2 border-[var(--border-color)] rounded-[var(--radius-card,32px)] flex items-center gap-[var(--app-gap,1.25rem)] group hover:bg-orange-500 transition-all duration-300 shadow-lg"
                      >
                            <div className="p-4 bg-orange-500 rounded-2xl text-white group-hover:bg-[var(--bg-app)] group-hover:text-orange-500 shadow-lg shadow-orange-500/20 transition-all">
                              <Plus size={24} strokeWidth={4}/>
                            </div>
                            <div className="text-left">
                              <p className="font-black uppercase text-xs tracking-[2px] text-[var(--text-main)]">
                                {T('initialize_ledger')}
                              </p>
                              <p className="text-[9px] font-bold text-[var(--text-muted)] group-hover:bg-[var(--bg-app)]uppercase tracking-widest mt-1">
                                {t('shortcut_desc') || "Go to Dashboard and create vault"}
                              </p>
                            </div>
                      </button>
                  </Tooltip>
              </div>
            </ModalLayout>
          )}
        </>
      )}
    </AnimatePresence>
  );
};