"use client";
import React from 'react';
import { Layers, Plus, X, AlertCircle, Globe, ChevronDown, Cpu } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

export const GovernanceModule = ({ 
    categories, addCategory, removeCategory, 
    limitBuffer, setLimitBuffer, saveLimit, 
    currency, updateCurrency, newCat, setNewCat 
}: any) => {
    const { T } = useTranslation();

    return (
        <div className="app-card p-8 border-l-4 border-orange-500 relative overflow-hidden bg-[var(--bg-card)] shadow-2xl">
            <div className="absolute -right-10 -top-10 opacity-[0.02] rotate-12"><Layers size={250} /></div>
            
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Registry Tag Manager */}
                <div className="space-y-6">
                    <h4 className="text-xs font-black text-[var(--text-main)] uppercase tracking-[3px] italic flex items-center gap-3">
                        <Cpu size={18} className="text-orange-500" /> {T('registry_tags')}
                    </h4>
                    <div className="flex gap-2">
                        <input 
                            className="app-input flex-1 h-12 text-[10px] font-black uppercase tracking-widest bg-[var(--bg-app)] border-2 border-[var(--border-color)] focus:border-orange-500/40 shadow-inner" 
                            placeholder={T('new_protocol_tag')} 
                            value={newCat}
                            onChange={(e) => setNewCat(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addCategory(newCat)}
                        />
                        <button onClick={() => addCategory(newCat)} className="bg-orange-500 text-white w-12 h-12 rounded-xl flex items-center justify-center hover:bg-orange-600 active:scale-90 transition-all shadow-lg">
                            <Plus size={22} strokeWidth={3} />
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto no-scrollbar">
                        {categories.map((cat: string) => (
                            <div key={cat} className="flex items-center gap-2 bg-[var(--bg-app)] border border-[var(--border-color)] px-4 py-2 rounded-xl group hover:border-orange-500/40 transition-all">
                                <span className="text-[10px] font-black uppercase text-[var(--text-muted)] group-hover:text-orange-500">{cat}</span>
                                <button onClick={() => removeCategory(cat)} className="text-slate-600 hover:text-red-500 transition-colors"><X size={14} /></button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Threshold & Currency */}
                <div className="space-y-10">
                    <div className="space-y-4">
                        <h4 className="text-xs font-black text-[var(--text-main)] uppercase tracking-[3px] italic flex items-center gap-3">
                            <AlertCircle size={18} className="text-red-500" /> {T('expense_threshold')}
                        </h4>
                        <div className="relative">
                            <input 
                                type="number"
                                className="app-input h-14 pl-5 pr-16 text-sm font-black text-[var(--text-main)] border-2 border-red-500/20 focus:border-red-500 bg-red-500/[0.02]" 
                                value={limitBuffer}
                                onChange={(e) => setLimitBuffer(Number(e.target.value))}
                                onBlur={saveLimit}
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[8px] font-black text-red-500 uppercase tracking-widest opacity-40">{T('monthly_cap')}</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-xs font-black text-[var(--text-main)] uppercase tracking-[3px] italic flex items-center gap-3">
                            <Globe size={18} className="text-blue-500" /> {T('base_currency')}
                        </h4>
                        <div className="relative">
                            <select 
                                value={currency}
                                onChange={(e) => updateCurrency(e.target.value)}
                                className="app-input h-14 pl-5 pr-10 text-[11px] font-black uppercase tracking-widest appearance-none cursor-pointer bg-[var(--bg-app)] border-2 border-[var(--border-color)] hover:border-blue-500/40 transition-all"
                            >
                                <option value="BDT (৳)">BDT (৳)</option>
                                <option value="USD ($)">USD ($)</option>
                                <option value="EUR (€)">EUR (€)</option>
                                <option value="INR (₹)">INR (₹)</option>
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 opacity-30 pointer-events-none" size={16} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};