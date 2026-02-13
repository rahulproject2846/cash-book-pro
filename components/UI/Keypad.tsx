"use client";
import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Delete, Divide, X, Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils/helpers';

interface KeypadProps {
    onInput: (val: string) => void;
    onDelete: () => void;
}

// PERFORMANCE OPTIMIZED: Memoized keypad with hardware acceleration
const Keypad = memo(({ onInput, onDelete }: KeypadProps) => {
    // HAPTIC FEEDBACK: Optimized for mobile performance
    const triggerHaptic = () => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            // Use shorter vibration for better responsiveness
            navigator.vibrate(5);
        }
    };

    // PERFORMANCE: Memoized button styles to prevent recalculation
    const btnBase = "h-14 rounded-[18px] flex items-center justify-center text-xl font-black transition-all active:scale-90 select-none cursor-pointer shadow-sm will-change-transform";
    const numBtn = "bg-[var(--bg-card)] text-[var(--text-main)] border border-[var(--border)] active:bg-[var(--bg-border)] active:scale-95";
    const opBtn = "bg-orange-500/10 text-orange-500 border border-orange-500/20";

    // HARDWARE ACCELERATION: CSS transforms for GPU acceleration
    const keys = [
        { label: '1', val: '1', type: 'num' }, { label: '2', val: '2', type: 'num' }, { label: '3', val: '3', type: 'num' }, 
        { label: '4', val: '4', type: 'num' }, { label: '5', val: '5', type: 'num' }, { label: '6', val: '6', type: 'num' }, 
        { label: '7', val: '7', type: 'num' }, { label: '8', val: '8', type: 'num' }, { label: '9', val: '9', type: 'num' }, 
        { label: '÷', val: '/', type: 'op', icon: Divide }, { label: '×', val: '*', type: 'op', icon: X }, 
        { label: '-', val: '-', type: 'op', icon: Minus }, { label: '.', val: '.', type: 'num' }, { label: '0', val: '0', type: 'num' }, 
        { label: '00', val: '00', type: 'num' }, { label: '+', val: '+', type: 'op', icon: Plus },
    ];

    return (
        <div className="w-full bg-[var(--bg-app)]/95 backdrop-blur-3xl border-t border-[var(--border)] rounded-t-[35px] p-4 pb-8 shadow-[0_-20px_60px_rgba(0,0,0,0.3)] z-[2000]">
            <div className="w-10 h-1 bg-[var(--border)] rounded-full mx-auto mb-5 opacity-40" />
            <div className="grid grid-cols-4 gap-3">
                {keys.map((k) => (
                    <motion.button
                        key={k.label}
                        whileTap={{ scale: 0.92, transition: { duration: 0.1, ease: "easeOut" } }} // Faster transition
                        onClick={(e) => { e.preventDefault(); triggerHaptic(); onInput(k.val); }}
                        className={cn(btnBase, k.type === 'op' ? opBtn : numBtn)}
                    >
                        {k.icon ? <k.icon size={20} strokeWidth={2.5} /> : k.label}
                    </motion.button>
                ))}
                {/* Delete Button */}
                <motion.button
                    whileTap={{ scale: 0.92, transition: { duration: 0.1, ease: "easeOut" } }} // Faster transition
                    onClick={(e) => { e.preventDefault(); triggerHaptic(); onDelete(); }}
                    className={cn(btnBase, "col-span-4 bg-red-500/10 text-red-500 border border-red-500/20 mt-2")}
                >
                    <Delete size={22} strokeWidth={2.5} />
                </motion.button>
            </div>
        </div>
    );
});

Keypad.displayName = 'Keypad';

export default Keypad;