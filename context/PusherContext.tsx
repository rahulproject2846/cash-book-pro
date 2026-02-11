"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';
import Pusher from 'pusher-js';

const PusherContext = createContext<{ pusher: Pusher | null }>({ pusher: null });

export const PusherProvider = ({ children, currentUser }: { children: React.ReactNode, currentUser: any }) => {
    const [pusher, setPusher] = useState<Pusher | null>(null);

    useEffect(() => {
        if (!currentUser?._id) return;

        // পুশার ক্লায়েন্ট কনফিগারেশন
        const pusherInstance = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY || '', {
            cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap2',
            forceTLS: true
        });

        console.log("📡 Pusher: Identity Protocol Linked.");
        setPusher(pusherInstance);

        return () => {
            pusherInstance.disconnect();
        };
    }, [currentUser?._id]);

    return (
        <PusherContext.Provider value={{ pusher }}>
            {children}
        </PusherContext.Provider>
    );
};

export const usePusher = () => useContext(PusherContext);