import { useConflictStore } from './ConflictStore';

/**
 * 🚨 CONFLICT BACKGROUND SERVICE
 * -------------------------------
 * Manages persistent timer execution across modal close/re-open cycles
 * In-memory queue with localStorage persistence for survival
 */
export class ConflictBackgroundService {
    private static instance: ConflictBackgroundService;
    private executionQueue: Map<string, number> = new Map();
    private intervalId: NodeJS.Timeout | null = null;
    
    static getInstance(): ConflictBackgroundService {
        if (!this.instance) {
            this.instance = new ConflictBackgroundService();
        }
        return this.instance;
    }
    
    constructor() {
        // 🚨 RESTORE QUEUE ON INITIALIZATION
        this.restoreFromStorage();
        // 🚨 START MONITORING INTERVAL
        this.startMonitoring();
    }
    
    /**
     * 🚨 SCHEDULE BACKGROUND EXECUTION
     */
    scheduleExecution(key: string, expiresAt: number) {
        this.executionQueue.set(key, expiresAt);
        
        // 🚨 PERSIST TO LOCALSTORAGE FOR SURVIVAL
        this.saveToStorage();
        
        console.log(`🚨 [BACKGROUND SERVICE] Scheduled execution for ${key} at ${new Date(expiresAt).toLocaleTimeString()}`);
    }
    
    /**
     * 🚨 CANCEL SCHEDULED EXECUTION
     */
    cancelExecution(key: string) {
        this.executionQueue.delete(key);
        this.saveToStorage();
        console.log(`🚨 [BACKGROUND SERVICE] Cancelled execution for ${key}`);
    }
    
    /**
     * 🚨 GET REMAINING TIME
     */
    getRemainingTime(key: string): number {
        const expiresAt = this.executionQueue.get(key);
        if (!expiresAt) return 0;
        
        const remaining = expiresAt - Date.now();
        return Math.max(0, Math.ceil(remaining / 1000));  // 🚨 ACCURATE SECONDS
    }
    
    /**
     * 🚨 START MONITORING INTERVAL
     */
    private startMonitoring() {
        // 🚨 CHECK EVERY SECOND FOR EXPIRED RESOLUTIONS
        this.intervalId = setInterval(() => {
            this.checkAndExecuteExpired();
        }, 1000);
    }
    
    /**
     * 🚨 CHECK AND EXECUTE EXPIRED RESOLUTIONS
     */
    private async checkAndExecuteExpired() {
        const now = Date.now();
        const expiredKeys: string[] = [];
        
        // 🚨 FIND EXPIRED RESOLUTIONS
        this.executionQueue.forEach((expiresAt, key) => {
            if (expiresAt <= now) {
                expiredKeys.push(key);
            }
        });
        
        if (expiredKeys.length === 0) return;
        
        console.log(`🚨 [BACKGROUND SERVICE] Executing ${expiredKeys.length} expired resolutions`);
        
        // 🚨 EXECUTE EXPIRED RESOLUTIONS
        const { executeExpiredResolutions } = useConflictStore.getState();
        await executeExpiredResolutions();
        
        // 🚨 CLEAN UP EXECUTED ITEMS
        expiredKeys.forEach(key => {
            this.executionQueue.delete(key);
        });
        
        // 🚨 UPDATE STORAGE
        this.saveToStorage();
    }
    
    /**
     * 🚨 SAVE TO LOCALSTORAGE
     */
    private saveToStorage() {
        try {
            if (typeof window === 'undefined') return; // 🚨 SSR Guard
            const queueArray = Array.from(this.executionQueue.entries());
            localStorage.setItem('conflictExecutionQueue', JSON.stringify(queueArray));
        } catch (error) {
            console.warn('🚨 [BACKGROUND SERVICE] Failed to save queue to localStorage:', error);
        }
    }
    
    /**
     * 🚨 RESTORE FROM LOCALSTORAGE
     */
    private restoreFromStorage() {
        try {
            if (typeof window === 'undefined') return; // 🚨 SSR Guard
            const stored = localStorage.getItem('conflictExecutionQueue');
            if (stored) {
                const queueArray = JSON.parse(stored);
                const now = Date.now();
                
                // 🚨 RESTORE ONLY FUTURE EXECUTIONS
                queueArray.forEach(([key, expiresAt]: [string, number]) => {
                    if (expiresAt > now) {
                        this.executionQueue.set(key, expiresAt);
                        console.log(`🚨 [BACKGROUND SERVICE] Restored execution for ${key} at ${new Date(expiresAt).toLocaleTimeString()}`);
                    }
                });
                
                console.log(`🚨 [BACKGROUND SERVICE] Restored ${this.executionQueue.size} pending executions from storage`);
            }
        } catch (error) {
            console.warn('🚨 [BACKGROUND SERVICE] Failed to restore queue from localStorage:', error);
        }
    }
    
    /**
     * 🚨 GET ALL PENDING EXECUTIONS
     */
    getPendingExecutions(): Record<string, number> {
        const result: Record<string, number> = {};
        this.executionQueue.forEach((expiresAt, key) => {
            result[key] = expiresAt;
        });
        return result;
    }
    
    /**
     * 🚨 CLEAR ALL PENDING EXECUTIONS
     */
    clearAllExecutions() {
        this.executionQueue.clear();
        this.saveToStorage();
        console.log('🚨 [BACKGROUND SERVICE] Cleared all pending executions');
    }
    
    /**
     * 🚨 CLEANUP ON SERVICE DESTROY
     */
    destroy() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.clearAllExecutions();
    }
}

// 🚨 GLOBAL INSTANCE FOR IMMEDIATE USE
export const conflictBackgroundService = ConflictBackgroundService.getInstance();
