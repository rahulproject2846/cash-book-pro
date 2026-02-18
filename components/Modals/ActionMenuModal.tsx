"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Zap, Book, PlusCircle } from 'lucide-react';
import { useModal } from '@/context/ModalContext';
import { useVaultStore } from '@/lib/vault/store';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils/helpers';
import { ModalLayout } from './index';

export const ActionMenuModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { t } = useTranslation();
  const { openModal, closeModal, switchModal } = useModal();
  const { books, saveBook, setActiveBook, setNextAction } = useVaultStore();

  const handleCreateBook = () => {
    closeModal(() => {
      setNextAction('addBook'); // Trigger state-driven flow after cleanup
    });
  };

  const handleQuickEntry = async () => {
    // Check if Quick Entry book exists
    let quickEntryBook = books.find(b => b.name === 'Quick Entry');
    
    // If not exists, create it silently first
    if (!quickEntryBook) {
      try {
        const result = await saveBook({
          name: 'Quick Entry',
          type: 'general',
          description: 'Quick entry book for fast transactions'
        });
        
        if (result.success) {
          quickEntryBook = result.book;
        }
      } catch (error) {
        console.error('Failed to create Quick Entry book:', error);
        return;
      }
    }

    // Use switchModal for seamless transition - no flash
    if (quickEntryBook) {
      switchModal('addEntry', { 
        currentUser: null, // Will be set by modal context
        currentBook: quickEntryBook,
        onSubmit: async (formData: any) => {
          // Entry submission logic will be handled by EntryModal
          closeModal(); // Close entry modal
        }
      });
    }
  };

  return (
    <ModalLayout 
      title={t('action_menu_title') || "QUICK ACTIONS"} 
      onClose={onClose}
      isOpen={isOpen}
    >
      <div className="space-y-4 p-2">
        {/* Create Book Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleCreateBook}
          className={cn(
            "w-full p-6 bg-linear-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700",
            "text-white rounded-2xl shadow-xl shadow-blue-500/25",
            "flex items-center gap-4 group transition-all duration-200"
          )}
        >
          <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
            <Book size={28} strokeWidth={2.5} />
          </div>
          <div className="flex-1 text-left">
            <h3 className="font-black text-lg tracking-wide">
              {t('create_new_book') || 'Create New Book'}
            </h3>
            <p className="text-sm opacity-90 font-medium mt-1">
              {t('create_book_desc') || 'Start a new ledger'}
            </p>
          </div>
          <PlusCircle size={20} className="opacity-70 group-hover:opacity-100 transition-opacity" />
        </motion.button>

        {/* Quick Entry Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleQuickEntry}
          className={cn(
            "w-full p-6 bg-linear-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700",
            "text-white rounded-2xl shadow-xl shadow-orange-500/25",
            "flex items-center gap-4 group transition-all duration-200"
          )}
        >
          <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
            <Zap size={28} strokeWidth={2.5} />
          </div>
          <div className="flex-1 text-left">
            <h3 className="font-black text-lg tracking-wide">
              {t('quick_entry') || 'Quick Entry'}
            </h3>
            <p className="text-sm opacity-90 font-medium mt-1">
              {t('quick_entry_desc') || 'Fast transaction entry'}
            </p>
          </div>
          <Zap size={20} className="opacity-70 group-hover:opacity-100 transition-opacity" />
        </motion.button>
      </div>
    </ModalLayout>
  );
};
