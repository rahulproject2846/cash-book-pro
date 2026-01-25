"use client";
import { X, Loader2 } from 'lucide-react';

export const ModalLayout = ({ title, children, onClose }: any) => (
  <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
    <div className="glass-card w-full max-w-md p-8 border border-white/10 relative animate-in zoom-in duration-200">
      <X className="absolute right-6 top-6 cursor-pointer text-slate-500 hover:text-white" onClick={onClose} />
      <h2 className="text-2xl font-black text-white mb-8 tracking-tighter uppercase">{title}</h2>
      {children}
    </div>
  </div>
);

export const DeleteConfirmModal = ({ targetName, confirmName, setConfirmName, onConfirm, onClose }: any) => (
  <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
    <div className="glass-card w-full max-w-sm p-8 border border-red-500/20">
      <h2 className="text-xl font-black text-red-500 mb-4 uppercase tracking-tighter">Security Check</h2>
      <p className="text-slate-400 text-xs mb-6 leading-relaxed">
        To confirm, type exactly: <br/><span className="text-white font-black text-sm uppercase">"{targetName}"</span>
      </p>
      <input 
        placeholder="Type here..." 
        className="glass-input w-full mb-6 border-red-500/10 focus:border-red-500" 
        value={confirmName} 
        onChange={e => setConfirmName(e.target.value)} 
      />
      <div className="flex gap-3">
        <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-white/5 font-bold text-slate-400">Cancel</button>
        <button 
          onClick={onConfirm} 
          disabled={confirmName !== targetName} 
          className={`flex-1 py-3 rounded-xl font-bold transition-all ${confirmName === targetName ? 'bg-red-600 text-white' : 'bg-red-900/10 text-red-900/40 cursor-not-allowed'}`}
        >Confirm</button>
      </div>
    </div>
  </div>
);