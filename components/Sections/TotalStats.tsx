// src/components/TotalStats.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Wallet, TrendingUp, TrendingDown, Clock } from 'lucide-react';

export const TotalStats = ({ totalIncome, totalExpense, pendingAmount }: any) => {
  const netBalance = totalIncome - totalExpense;

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
    >
      <div className="glass-card p-4 border-l-4 border-blue-500 bg-blue-500/10">
        <Wallet className="text-blue-500 mb-2" size={18} />
        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Net Balance</p>
        <h3 className="text-xl font-mono font-bold text-blue-400">{netBalance.toLocaleString()}</h3>
      </div>
      <div className="glass-card p-4 border-l-4 border-green-500 bg-green-500/5">
        <TrendingUp className="text-green-500 mb-2" size={18} />
        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Income</p>
        <h3 className="text-xl font-mono font-bold text-green-400">+{totalIncome.toLocaleString()}</h3>
      </div>
      <div className="glass-card p-4 border-l-4 border-red-500 bg-red-500/5">
        <TrendingDown className="text-red-500 mb-2" size={18} />
        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Expense</p>
        <h3 className="text-xl font-mono font-bold text-red-400">-{totalExpense.toLocaleString()}</h3>
      </div>
      <div className="glass-card p-4 border-l-4 border-yellow-500 bg-yellow-500/5">
        <Clock className="text-yellow-500 mb-2" size={18} />
        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Pending</p>
        <h3 className="text-xl font-mono font-bold text-yellow-400">{pendingAmount.toLocaleString()}</h3>
      </div>
    </motion.div>
  );
};