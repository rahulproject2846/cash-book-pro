"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TooltipProps {
    text: string;
    children: React.ReactNode;
    position?: 'top' | 'bottom' | 'left' | 'right';
    visible?: boolean;
}

export const Tooltip = ({ text, children, position = 'top' }: TooltipProps) => {
    const [isVisible, setIsVisible] = useState(false);

    // পজিশন লজিক
   // const positionClasses = {
      //  top: "-top-10 left-1/2 -translate-x-1/2",
     //   bottom: "-bottom-10 left-1/2 -translate-x-1/2",
    //    left: "-left-2 right-full top-1/2 -translate-y-1/2 mr-2",
     //   right: "-right-2 left-full top-1/2 -translate-y-1/2 ml-2",
 //   };
const positionClasses = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  left: "right-full top-1/2 -translate-y-1/2 mr-2",
  right: "left-full top-1/2 -translate-y-1/2 ml-2",
};
    return (
        <div 
            className="relative flex items-center justify-center z-[50]"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
            onClick={() => setIsVisible(false)} // ক্লিক করলে টুলটিপ সরবে
        >
            {children}
            
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: position === 'top' ? 5 : -5 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.15 }}
                        className={`absolute ${positionClasses[position]} z-[1000] pointer-events-none`}
                    >
                        <div className="bg-[var(--bg-card)]  text-[var(--text-main)] text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border border-white/10 shadow-xl whitespace-nowrap">
                            {text}
                            {/* Tiny Arrow */}
                            <div className={`absolute w-2 h-2 bg-[var(--bg-card)] border-r border-b border-[var(--border)] rotate-45 
                                ${position === 'top' ? '-bottom-1 left-1/2 -translate-x-1/2' : ''}
                                ${position === 'bottom' ? '-top-1 left-1/2 -translate-x-1/2 rotate-[225deg]' : ''}
                            `} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};