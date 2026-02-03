// src/hooks/useGuidance.ts
"use client";
import { useState, useEffect } from 'react';

// Define the steps and their timing
const GUIDANCE_STEPS = [
    { step: 1, delay: 2000, pause: 3000 },  // FAB (2s to show, 3s break)
    { step: 2, delay: 2000, pause: 3000 },  // Reports (2s to show, 3s break)
    { step: 3, delay: 2000, pause: 3000 },  // Settings (2s to show, 3s break)
];

export const useGuidance = (activeSection: string) => {
    const [activeStep, setActiveStep] = useState(0);

    useEffect(() => {
        // ১. সেভ করা স্ট্যাটাস চেক (যদি বন্ধ থাকে তবে কিছুই করবে না)
        const isPermanentlyOff = localStorage.getItem('vault_guidance_off') === 'true';
        if (isPermanentlyOff) return;
        
        // ২. যদি সেটিংসে থাকে, তবে গাইডেন্স বন্ধ থাকবে
        if (activeSection === 'settings') {
            setActiveStep(0);
            return;
        }

        let timers: NodeJS.Timeout[] = [];
        
        // --- ৩. মাস্টার লুপ (The Infinite Guide) ---
        const startGuidanceLoop = () => {
            let totalDelay = 0;
            
            GUIDANCE_STEPS.forEach(({ step, delay, pause }) => {
                // Showing the tooltip (e.g., FAB)
                totalDelay += delay;
                timers.push(setTimeout(() => {
                    setActiveStep(step);
                }, totalDelay));

                // Hiding the tooltip (e.g., FAB disappears)
                totalDelay += pause;
                timers.push(setTimeout(() => {
                    setActiveStep(0);
                }, totalDelay));
            });

            // লুপটি শেষ হওয়ার পর প্রথম স্টেপে ফিরে যাবে (3 সেকেন্ড বিরতি নিয়ে)
            const loopTimer = setTimeout(startGuidanceLoop, totalDelay + 3000); 
            timers.push(loopTimer);
        };
        
        startGuidanceLoop();

        return () => {
            timers.forEach(clearTimeout);
        };
    }, [activeSection]); 

    return activeStep;
};