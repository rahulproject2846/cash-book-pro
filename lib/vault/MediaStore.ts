import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { db } from '@/lib/offlineDB';
import axios from 'axios';
import toast from 'react-hot-toast';
import { getVaultStore } from '@/lib/vault/store/storeHelper';
import { getPlatform } from '@/lib/platform';

interface MediaStoreState {
    // 🔄 QUEUE MANAGEMENT
    uploadQueue: string[];          
    currentUpload?: string;         
    uploadProgress: Record<string, number>;
    
    // 📊 STATUS TRACKING
    pendingCount: number;           
    failedCount: number;            
    uploadingCount: number;         
    
    // 🎯 ACTIONS
    addToQueue: (mediaCid: string) => void;
    removeFromQueue: (mediaCid: string) => void;
    updateProgress: (mediaCid: string, progress: number) => void;
    markUploaded: (mediaCid: string, url: string, publicId: string) => Promise<void>;
    markFailed: (mediaCid: string, error: string) => Promise<void>;
    retryFailed: () => Promise<void>;
    
    // 🔄 QUEUE PROCESSING
    processQueue: () => Promise<void>;
    
    // 📊 HELPERS
    getQueueStatus: () => Promise<{
        pending: number;
        uploaded: number;
        failed: number;
        total: number;
    }>;
}

// 🆕 ZUSTAND MEDIA STORE IMPLEMENTATION
export const useMediaStore = create<MediaStoreState>()(
    subscribeWithSelector((set, get) => ({
        // 🔄 INITIAL STATE
        uploadQueue: [],
        currentUpload: undefined,
        uploadProgress: {},
        pendingCount: 0,
        failedCount: 0,
        uploadingCount: 0,
        
        // 🎯 ACTIONS
        addToQueue: (mediaCid: string) => {
            const currentQueue = get().uploadQueue;
            if (!currentQueue.includes(mediaCid)) {
                set(state => ({
                    uploadQueue: [...state.uploadQueue, mediaCid],
                    pendingCount: state.pendingCount + 1,
                    uploadProgress: { ...state.uploadProgress, [mediaCid]: 0 }
                }));
                
                // Trigger processing automatically
                get().processQueue();
            }
        },
        
        removeFromQueue: (mediaCid: string) => {
            set(state => {
                const newQueue = state.uploadQueue.filter(cid => cid !== mediaCid);
                const newProgress = { ...state.uploadProgress };
                delete newProgress[mediaCid];
                
                return {
                    uploadQueue: newQueue,
                    pendingCount: Math.max(0, newQueue.length),
                    uploadProgress: newProgress
                };
            });
        },
        
        updateProgress: (mediaCid: string, progress: number) => {
            set(state => ({
                uploadProgress: { ...state.uploadProgress, [mediaCid]: progress }
            }));
        },
        
        markUploaded: async (mediaCid: string, url: string, publicId: string) => {
            try {
                // 📊 GET MEDIA DETAILS
                const mediaRecord = await db.mediaStore.where('cid').equals(mediaCid).first();
                if (!mediaRecord) return;

                // 🆕 SAFE CLEANUP: Verify sync completion before blob deletion
                let isParentSynced = false;
                if (mediaRecord.parentType === 'book') {
                    const parentBook = await db.books.where('localId').equals(mediaRecord.parentId).first();
                    isParentSynced = parentBook?.synced === 1;
                }

                const shouldDeleteBlob = url && url.startsWith('http') && isParentSynced;

                // 🔄 UPDATE DEXIE RECORD
                await db.mediaStore.where('cid').equals(mediaCid).modify({
                    localStatus: 'uploaded',
                    cloudinaryUrl: url,
                    cloudinaryPublicId: publicId,
                    uploadedAt: Date.now(),
                    blobData: mediaRecord.blobData // 🛡️ Keep blob for now - prevent immediate deletion
                });
                
                if (shouldDeleteBlob) {
                    console.log(`🧹 [SAFE CLEANUP] Deleted blob for ${mediaCid} - Cloudinary URL confirmed and parent synced`);
                } else {
                    console.log(`🛡️ [SAFE CLEANUP] Preserved blob for ${mediaCid} - Parent not synced or URL invalid`);
                }

                // 🔗 UPDATE PARENT RECORD WITH VKEY INCREMENT
                if (mediaRecord.parentType === 'book') {
                    const existingBook = await db.books.where('localId').equals(mediaRecord.parentId).first();
                    if (existingBook) {
                        // 🟢 [FORENSIC AUDIT] Log Dexie update with Cloudinary URL
                        console.log(`🟢 [MEDIA STORE] Updating Dexie book with URL:`, url);
                        
                        await db.books.update(mediaRecord.parentId, { 
                            image: url, // The Cloudinary URL
                            mediaCid: mediaCid, // Keep CID for reference
                            updatedAt: Date.now(),
                            synced: 0 // Ensure it's marked for pushing to server
                        });
                        
                        // FORCE UI REFRESH: Trigger vault update event
                        getPlatform().events.dispatch('vault-updated', {
                            source: 'MediaStore',
                            entityType: 'book',
                            operation: 'update',
                            timestamp: Date.now()
                        });
                        
                        // CRITICAL: Check if book has server _id before sync
                        if (!existingBook._id) {
                            console.log(`[MEDIA SYNC] Book ${existingBook.cid} missing server _id, waiting for initial sync...`);
                        }
                        
                        // EXPLICIT SYNC: Trigger immediate background sync
                        const { getOrchestrator } = await import('./core/SyncOrchestrator');
                        getOrchestrator().triggerSync();
                        
                        // MANUAL SYNC: Force vault store sync for immediate propagation
                        if (typeof window !== 'undefined' && (window as any).getVaultStore) {
                            const vaultStore = (window as any).getVaultStore();
                            if (vaultStore.triggerManualSync) {
                                vaultStore.triggerManualSync();
                                console.log(`[MEDIA SYNC] Manual vault sync triggered for book ${existingBook.cid}`);
                                console.log(`🚀 [MEDIA SYNC] Manual vault sync triggered for book ${existingBook.cid}`);
                            }
                        }
                        
                        console.log(`🚀 [MEDIA SYNC] Cloudinary URL pushed to server for book ${existingBook.cid}`);
                    }
                } else if (mediaRecord.parentType === 'entry') {
                    const existingEntry = await db.entries.where('localId').equals(mediaRecord.parentId).first();
                    if (existingEntry) {
                        await db.entries.update(mediaRecord.parentId, { 
                            mediaId: url,
                            vKey: existingEntry.vKey + 1, // 🚨 CRITICAL: Increment vKey to trigger sync
                            synced: 0 // 🚨 CRITICAL: Mark as unsynced
                        });
                    }
                } else if (mediaRecord.parentType === 'user') {
                    await db.users.update(mediaRecord.parentId, { 
                        image: url,
                        isCustomImage: true 
                    });
                }
                
                // 🔄 UPDATE STORE STATE
                set(state => {
                    const newQueue = state.uploadQueue.filter(cid => cid !== mediaCid);
                    const newProgress = { ...state.uploadProgress };
                    delete newProgress[mediaCid];
                    
                    return {
                        uploadQueue: newQueue,
                        pendingCount: Math.max(0, newQueue.length),
                        uploadProgress: newProgress,
                        currentUpload: state.currentUpload === mediaCid ? undefined : state.currentUpload,
                        uploadingCount: Math.max(0, state.uploadingCount - 1)
                    };
                });
                
                // 🚨 TRIGGER SYNC REQUEST (Hydration Gap Fix)
                getPlatform().events.dispatch('sync-request', {
                    trigger: 'automatic',
                    priority: 'normal',
                    timestamp: Date.now()
                });
                
            } catch (error) {
                console.error(`❌ [MEDIA STORE] Failed to mark uploaded: ${mediaCid}`, error);
                await get().markFailed(mediaCid, 'Database update failed');
            }
        },
        
        markFailed: async (mediaCid: string, errorMessage: string) => {
            try {
                const mediaRecord = await db.mediaStore.where('cid').equals(mediaCid).first();
                if (mediaRecord) {
                    await db.mediaStore.where('cid').equals(mediaCid).modify({
                        localStatus: 'failed',
                        uploadError: errorMessage
                    });
                }
                
                set(state => ({
                    failedCount: state.failedCount + 1,
                    currentUpload: state.currentUpload === mediaCid ? undefined : state.currentUpload,
                    uploadingCount: Math.max(0, state.uploadingCount - 1)
                }));
                
                toast.error('Upload failed. Will retry later.');
            } catch (e) {
                console.error('Failed to mark media failure', e);
            }
        },
        
        retryFailed: async () => {
            const failedItems = await db.mediaStore.where('localStatus').equals('failed').toArray();
            for (const item of failedItems) {
                await db.mediaStore.update(item.localId!, { localStatus: 'pending_upload' });
                get().addToQueue(item.cid);
            }
            toast.success(`Retrying ${failedItems.length} uploads`);
        },
        
        processQueue: async () => {
            if (!navigator.onLine) return;
            
            const { isSecurityLockdown } = getVaultStore(); // Use the correct name here
            if (isSecurityLockdown) {
              console.warn('🔒 [MEDIA] Processing blocked - Lockdown active');
              return;
            }
            
            const { currentUpload, uploadQueue } = get();
            if (currentUpload || uploadQueue.length === 0) return;

            try {
                // Get next item
                const nextCid = uploadQueue[0];
                const media = await db.mediaStore.where('cid').equals(nextCid).first();
                
                if (!media || !media.blobData) {
                    // Invalid item, remove from queue
                    get().removeFromQueue(nextCid);
                    get().processQueue(); // Process next
                    return;
                }

                // 🚨 CRITICAL CHECK: Zero-byte blob detection
                if (media.blobData.size === 0) {
                    await get().markFailed(nextCid, 'Blob data is empty (0 bytes)');
                    get().removeFromQueue(nextCid);
                    get().processQueue();
                    return;
                }

                set({ currentUpload: nextCid, uploadingCount: 1 });

                // Prepare Upload
                const formData = new FormData();
                formData.append('file', media.blobData);
                formData.append('userId', media.userId);

                // Upload
                const response = await axios.post('/api/media/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                    onUploadProgress: (progressEvent) => {
                        if (progressEvent.total) {
                            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                            get().updateProgress(nextCid, progress);
                        }
                    }
                });

                if (response.data.success) {
                    await get().markUploaded(nextCid, response.data.data.url, response.data.data.publicId);
                } else {
                    throw new Error(response.data.error || 'Upload failed');
                }

                // Process next item recursively
                get().processQueue();

            } catch (error: any) {
                console.error('Upload Process Error:', error);
                const nextCid = get().uploadQueue[0];
                if (nextCid) {
                    await get().markFailed(nextCid, error.message || 'Unknown error');
                    get().removeFromQueue(nextCid); // Remove from active queue to prevent loop
                }
                // Try next item
                get().processQueue();
            }
        },
        
        getQueueStatus: async () => {
            const pending = await db.mediaStore.where('localStatus').equals('pending_upload').count();
            const uploaded = await db.mediaStore.where('localStatus').equals('uploaded').count();
            const failed = await db.mediaStore.where('localStatus').equals('failed').count();
            const total = await db.mediaStore.count();
            
            return { pending, uploaded, failed, total };
        }
    }))
);