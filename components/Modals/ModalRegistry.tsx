"use client";
import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { useModal } from '@/context/ModalContext';
import { Plus } from 'lucide-react';

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
 * VAULT PRO: MASTER MODAL REGISTRY (DATA-SYNC FIXED)
 * -------------------------------------------
 * এই ফাইলটি page.tsx এবং অন্যান্য সেকশন থেকে আসা ডাটা রিসিভ করে 
 * এবং সঠিক মডালটি রেন্ডার করে।
 */
export const ModalRegistry = () => {
  const { view, isOpen, data, closeModal } = useModal();

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* ১. বুক অ্যাড / এডিট মডাল (FIXED: initialData mapping) */}
          {(view === 'addBook' || view === 'editBook') && (
            <BookModal 
              key="book-modal"
              type={view === 'addBook' ? 'add' : 'edit'}
              isOpen={true}
              onClose={closeModal}
              // এখানে ডাটা ম্যাপিং ফিক্স করা হয়েছে
              initialData={data?.currentBook || data?.book || null}
              currentUser={data?.currentUser}
              onSubmit={data?.onSubmit}
              // বুক ফর্ম স্টেট সিঙ্ক
              formData={data?.bookForm}
              setFormData={data?.setBookForm}
            />
          )}

          {/* ২. এন্ট্রি অ্যাড / এডিট মডাল (FIXED: initialData mapping) */}
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
            <ModalLayout key="analytics-modal" title="Vault Intelligence" onClose={closeModal}>
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

          {/* ৭. প্রোটোকল শর্টকাট মডাল */}
          {view === 'shortcut' && (
            <ModalLayout key="shortcut-modal" title="Protocol Shortcut" onClose={closeModal}>
              <div className="grid grid-cols-1 gap-4 p-2">
                  <button 
                      onClick={() => { if (data?.onInitialize) data.onInitialize(); }} 
                      className="w-full p-6 bg-white/[0.03] border border-white/[0.05] rounded-[32px] flex items-center gap-5 group hover:bg-orange-500 transition-all duration-300"
                  >
                        <div className="p-4 bg-orange-500 rounded-2xl text-white group-hover:bg-white group-hover:text-orange-500 shadow-lg shadow-orange-500/20">
                          <Plus size={24} strokeWidth={4}/>
                        </div>
                        <div className="text-left">
                          <p className="font-black uppercase text-xs tracking-[2px] text-white">Initialize Ledger</p>
                          <p className="text-[9px] font-bold text-white/30 group-hover:text-white/60 uppercase tracking-widest mt-1">Go to Dashboard and create vault</p>
                        </div>
                  </button>
              </div>
            </ModalLayout>
          )}
        </>
      )}
    </AnimatePresence>
  );
};