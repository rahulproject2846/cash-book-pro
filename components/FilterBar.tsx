"use client";
import { Search, Calendar } from 'lucide-react';

export const FilterBar = ({ searchQuery, setSearchQuery, dateFilter, setDateFilter }: any) => {
  const filters = [
    { label: 'All Time', value: 'all' },
    { label: 'Today', value: 'today' },
    { label: 'This Week', value: 'week' },
    { label: 'This Month', value: 'month' },
  ];

  return (
    <div className="space-y-4 mb-8">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-3.5 text-slate-500" size={18} />
        <input 
          type="text" 
          placeholder="Search by title..." 
          className="glass-input w-full pl-12"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Quick Date Filters */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setDateFilter(f.value)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
              dateFilter === f.value 
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' 
              : 'glass-card text-slate-500 border-white/5'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
};