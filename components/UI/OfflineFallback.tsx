"use client";

import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, AlertTriangle } from 'lucide-react';

interface OfflineFallbackProps {
    onRetry?: () => void;
    message?: string;
}

export const OfflineFallback = React.memo(({ 
    onRetry, 
    message = "You're currently offline. Some features may not be available." 
}: OfflineFallbackProps) => {
    const [isRetrying, setIsRetrying] = useState(false);
    const [retryCount, setRetryCount] = useState(0);

    useEffect(() => {
        const handleOnline = () => {
            // Auto-hide when connection is restored
            window.location.reload();
        };

        window.addEventListener('online', handleOnline);
        return () => window.removeEventListener('online', handleOnline);
    }, []);

    const handleRetry = async () => {
        if (!onRetry) return;
        
        setIsRetrying(true);
        setRetryCount(prev => prev + 1);
        
        try {
            await onRetry();
        } catch (error) {
            console.error('Retry failed:', error);
        } finally {
            setIsRetrying(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl border border-gray-200">
                {/* Icon and Title */}
                <div className="flex flex-col items-center text-center mb-6">
                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                        <WifiOff className="w-8 h-8 text-orange-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">
                        No Internet Connection
                    </h2>
                    <p className="text-gray-600 text-sm leading-relaxed">
                        {message}
                    </p>
                </div>

                {/* Retry Button */}
                {onRetry && (
                    <button
                        onClick={handleRetry}
                        disabled={isRetrying}
                        className="w-full bg-blue-600 text-white rounded-xl px-6 py-3 font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isRetrying ? (
                            <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                Retrying...
                            </>
                        ) : (
                            <>
                                <RefreshCw className="w-4 h-4" />
                                Try Again
                            </>
                        )}
                    </button>
                )}

                {/* Retry Count */}
                {retryCount > 0 && (
                    <div className="mt-4 text-center">
                        <p className="text-xs text-gray-500">
                            Retry attempts: {retryCount}
                        </p>
                    </div>
                )}

                {/* Offline Tips */}
                <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <div className="text-xs text-gray-600">
                            <p className="font-medium mb-1">While offline:</p>
                            <ul className="space-y-1 text-gray-500">
                                <li>• Your data is saved locally</li>
                                <li>• Changes will sync when online</li>
                                <li>• Check your internet connection</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Auto-retry indicator */}
                <div className="mt-4 text-center">
                    <p className="text-xs text-gray-400">
                        This page will automatically refresh when connection is restored
                    </p>
                </div>
            </div>
        </div>
    );
});

OfflineFallback.displayName = 'OfflineFallback';
