"use client";
import React from 'react';
import { Zap, Tag, Filter } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useVaultState } from '@/lib/vault/store/storeHelper';
import { HubHeader } from '@/components/Layout/HubHeader';
import { AppleMenu } from '@/components/UI/AppleMenu';
import { cn } from '@/lib/utils/helpers';

export const DetailsToolbar = () => {
    const { t } = useTranslation();

    // AUTONOMOUS STORE ACCESS - NO PROPS
    const {
        entrySortConfig, entryCategoryFilter, entrySearchQuery,
        setEntrySortConfig, setEntryCategoryFilter, setEntrySearchQuery,
        processedEntries, allEntries, setMobileFilterOpen
    } = useVaultState();

    // Calculate subtitle with entry count
    const entryCount = processedEntries?.length || 0;
    const subtitle = `${entryCount} ${t('units_secured') || 'RECORDS'}`;

    // Map sort config to display option
    const getSortOption = () => {
        switch (entrySortConfig.key) {
            case 'createdAt': return 'Date';
            case 'amount': return 'Amount';
            case 'title': return 'Title';
            default: return 'Date';
        }
    };

    // Extract unique categories from all entries
    const getUniqueCategories = () => {
        if (!allEntries || allEntries.length === 0) return ['all'];
        const categories = new Set(['all']);
        allEntries.forEach((entry: any) => {
            if (entry.category && typeof entry.category === 'string') {
                categories.add(entry.category);
            }
        });
        return Array.from(categories);
    };

    const categories = getUniqueCategories();

    // Handle sort change
    const handleSortChange = (option: string) => {
        let key: string;
        switch (option) {
            case 'Date': key = 'createdAt'; break;
            case 'Amount': key = 'amount'; break;
            case 'Title': key = 'title'; break;
            default: key = 'createdAt';
        }
        setEntrySortConfig({ key, direction: 'desc' });
    };

    return (
        <HubHeader
            title={t('ledger_live_feed') || "RECORDS"}
            subtitle={subtitle}
            icon={Zap}
            searchQuery={entrySearchQuery}
            onSearchChange={setEntrySearchQuery}
            sortOption={getSortOption()}
            sortOptions={['Date', 'Amount', 'Title']}
            onSortChange={handleSortChange}
            hideIdentity={true}
            fullWidthSearch={true}
        >
            {/* Mobile Filter Button */}
            <button
                onClick={() => setMobileFilterOpen(true)}
                className="md:hidden h-11 w-11 flex items-center justify-center bg-(--bg-card) border border-(--border) rounded-[20px] transition-all active:scale-95 outline-none shadow-sm text-(--text-muted) hover:border-orange-500/30 hover:text-(--text-main)"
            >
                <Filter size={14} />
            </button>
            
            {/* Classification Menu */}
            <AppleMenu
                trigger={
                    <button 
                        className={cn(
                            "h-11 w-11 lg:w-auto lg:px-4 flex items-center justify-center lg:justify-between",
                            "bg-(--bg-card) border border-(--border) rounded-[20px] transition-all",
                            "active:scale-95 outline-none shadow-sm",
                            "text-(--text-muted) hover:border-orange-500/30 hover:text-(--text-main)"
                        )}
                    >
                        <div className="flex items-center gap-3">
                            <Tag size={14} className="text-orange-500" />
                            <span className="hidden lg:block text-[10px] font-black     truncate max-w-25">
                                {entryCategoryFilter === 'all' ? 'All' : entryCategoryFilter}
                            </span>
                        </div>
                    </button>
                }
                headerText="CLASSIFICATION"
                width="w-60"
            >
                {categories.map((opt: string) => {
                    const isSelected = entryCategoryFilter === opt;
                    return (
                        <button
                            key={opt}
                            onClick={() => setEntryCategoryFilter(opt)}
                            className={cn(
                                "w-full flex items-center justify-between px-5 py-3.5 rounded-2xl transition-all mb-1 last:mb-0",
                                "text-[10px] font-black    ",
                                isSelected 
                                    ? "text-orange-500 bg-orange-500/10 shadow-sm" 
                                    : "text-(--text-muted) hover:bg-(--bg-app) hover:text-(--text-main)"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                {isSelected && <div className="w-1 h-1 rounded-full bg-orange-500 animate-pulse" />}
                                {opt === 'all' ? 'All Categories' : opt}
                            </div>
                            {isSelected && <div className="w-2 h-2 rounded-full bg-orange-500" />}
                        </button>
                    );
                })}
            </AppleMenu>
        </HubHeader>
    );
};