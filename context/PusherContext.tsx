"use client";
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import Pusher from 'pusher-js';
import { getVaultStore } from '@/lib/vault/store/storeHelper';
import type { VaultStore } from '@/lib/vault/store';

const PusherContext = createContext<{ pusher: Pusher | null }>({ pusher: null });

export const PusherProvider = ({ children, currentUser }: { children: React.ReactNode, currentUser: any }) => {
    const [pusher, setPusher] = useState<Pusher | null>(null);
    const store = getVaultStore();
    const isSecurityLockdown = store.isSecurityLockdown;
    const bootStatus = store.bootStatus;
    const networkMode = store.networkMode;
    
    // 🛡️ PUSHER GRACE PERIOD: Track consecutive OFFLINE seconds
    const offlineTimerRef = useRef<NodeJS.Timeout | null>(null);
    const consecutiveOfflineSeconds = useRef<number>(0);

    useEffect(() => {
        if (!currentUser?._id || bootStatus !== 'READY') return;

        // পুশার ক্লায়েন্ট কনফিগারেশন
        const pusherInstance = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY || '', {
            cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap2',
            forceTLS: true
        });

        console.log("📡 Pusher: Identity Protocol Linked - READY STATE ONLY");
        setPusher(pusherInstance);

        return () => {
            pusherInstance.disconnect();
        };
    }, [currentUser?._id, bootStatus]);

    // 🧠 MODE CONTROLLER INTEGRATION - Manage Pusher based on network state
    // 🛡️ GRACE PERIOD: Only disconnect after 5 consecutive seconds of OFFLINE
    useEffect(() => {
        if (!pusher) return;

        // Clear any existing timer
        if (offlineTimerRef.current) {
            clearInterval(offlineTimerRef.current);
        }

        if (networkMode === 'OFFLINE') {
            // Start counting consecutive OFFLINE seconds
            consecutiveOfflineSeconds.current = 0;
            
            offlineTimerRef.current = setInterval(() => {
                consecutiveOfflineSeconds.current += 1;
                
                // 🛡️ GRACE PERIOD: Only disconnect after 5 seconds of OFFLINE
                if (consecutiveOfflineSeconds.current >= 5) {
                    console.log('🔴 [PUSHER] State: OFFLINE for 5+ seconds - Disconnecting');
                    pusher.disconnect();
                    if (offlineTimerRef.current) {
                        clearInterval(offlineTimerRef.current);
                        offlineTimerRef.current = null;
                    }
                } else {
                    console.log(`⏳ [PUSHER] OFFLINE grace period: ${consecutiveOfflineSeconds.current}/5 seconds`);
                }
            }, 1000);
        } else if (networkMode === 'DEGRADED') {
            // Clear the timer and reset counter
            if (offlineTimerRef.current) {
                clearInterval(offlineTimerRef.current);
                offlineTimerRef.current = null;
            }
            consecutiveOfflineSeconds.current = 0;
            // 🚨 DEVELOPMENT BYPASS: Keep Pusher connected during DEGRADED mode
            console.log('⚠️ [PUSHER] State: DEGRADED - Keeping connection for development');
        } else if (networkMode === 'SYNCING') {
            if (offlineTimerRef.current) {
                clearInterval(offlineTimerRef.current);
                offlineTimerRef.current = null;
            }
            consecutiveOfflineSeconds.current = 0;
            console.log(' [PUSHER] State: SYNCING - Disconnecting to prevent race conditions');
            pusher.disconnect();
        } else if (networkMode === 'ONLINE' && !isSecurityLockdown && bootStatus === 'READY') {
            if (offlineTimerRef.current) {
                clearInterval(offlineTimerRef.current);
                offlineTimerRef.current = null;
            }
            consecutiveOfflineSeconds.current = 0;
            console.log('🟢 [PUSHER] State: ONLINE - Connecting');
            pusher.connect();
        } else {
            if (offlineTimerRef.current) {
                clearInterval(offlineTimerRef.current);
                offlineTimerRef.current = null;
            }
            consecutiveOfflineSeconds.current = 0;
            console.log('🔒 [PUSHER] Boot Status Guard - Disconnecting');
            pusher.disconnect();
        }

        // 🔄 PUSHER FEEDBACK LOOP: Monitor connection status
        const handlePusherStateChange = (state: string) => {
            console.log(`📡 [PUSHER] Connection state changed: ${state}`);
            
            if (state === 'failed' || state === 'unavailable' || state === 'disconnected') {
                console.warn('⚠️ [PUSHER] Connection degraded - updating network state');
                getVaultStore().setNetworkMode('DEGRADED');
            } else if (state === 'connected') {
                console.log('✅ [PUSHER] Connected - network is stable');
                // Don't immediately set ONLINE, let ModeController verify
            }
        };

        // Bind to Pusher connection events
        pusher.connection.bind('failed', () => handlePusherStateChange('failed'));
        pusher.connection.bind('unavailable', () => handlePusherStateChange('unavailable'));
        pusher.connection.bind('disconnected', () => handlePusherStateChange('disconnected'));
        pusher.connection.bind('connected', () => handlePusherStateChange('connected'));

        // Cleanup on unmount
        return () => {
            if (offlineTimerRef.current) {
                clearInterval(offlineTimerRef.current);
            }
            pusher.connection.unbind('failed');
            pusher.connection.unbind('unavailable');
            pusher.connection.unbind('disconnected');
            pusher.connection.unbind('connected');
        };
    }, [networkMode, pusher, isSecurityLockdown, bootStatus]);

    return (
        <PusherContext.Provider value={{ pusher }}>
            {children}
        </PusherContext.Provider>
    );
};

export const usePusher = () => useContext(PusherContext);