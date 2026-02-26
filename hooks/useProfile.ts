"use client";
import { useState, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';
import { db } from '@/lib/offlineDB';
import { processMedia } from '@/lib/utils/mediaProcessor';
import { useMediaStore } from '@/lib/vault/MediaStore';
import { identityManager } from '@/lib/vault/core/IdentityManager';
import { generateCID } from '@/lib/offlineDB';
import { useVaultStore } from '@/lib/vault/store/index';

/**
 * 🏆 MASTER PROFILE ENGINE (V12.0)
 * -----------------------------------------
 * Logic: Fully Autonomous & Atomic.
 * Sync: Integrated with VaultStore SSOT.
 * Handshake: Dispatches local-mutation events.
 */
export const useProfile = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    
    // 🚀 STORE ACCESS
    const { currentUser, loginSuccess, logout } = useVaultStore();

    const [formData, setForm] = useState({
        name: currentUser?.username || '',
        currentPassword: '',
        newPassword: '',
        image: currentUser?.image || ''
    });

    // Sync form data when store identity changes
    useEffect(() => {
        if (currentUser) {
            setForm(prev => ({
                ...prev,
                name: currentUser.username || '',
                image: currentUser.image || ''
            }));
        }
    }, [currentUser]);

    // 🤝 THE ATOMIC HANDSHAKE
    const dispatchHandshake = useCallback(() => {
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('vault-updated', { 
                detail: { source: 'useProfile', origin: 'local-mutation' } 
            }));
        }
    }, []);

    // ১. ইমেজ প্রসেসিং (🚀 BANKING-GRADE MEDIA ENGINE)
    const handleImageProcess = useCallback(async (file: File) => {
        try {
            const { blob } = await processMedia(file);
            const mediaCid = generateCID();
            const userId = identityManager.getUserId();
            
            if (!userId) return toast.error('Identity Node Offline');
            
            // 📤 SAVE TO MEDIA STORE
            await db.mediaStore.add({
                cid: mediaCid,
                parentType: 'user',
                parentId: userId,
                localStatus: 'pending_upload',
                blobData: blob,
                mimeType: file.type,
                originalSize: file.size,
                compressedSize: blob.size,
                createdAt: Date.now(),
                userId
            });
            
            // 🔄 UPDATE LOCAL DEXIE USER
            await db.users.update(userId, { image: mediaCid, isCustomImage: true });
            
            // 📤 ADD TO UPLOAD QUEUE
            useMediaStore.getState().addToQueue(mediaCid);
            
            // 🎯 UPDATE UI STATE
            setForm(prev => ({ ...prev, image: mediaCid }));
            
            // 🤝 SYNC HANDSHAKE: Ensure Header & Store are notified
            const updatedUser = { ...currentUser, image: mediaCid, isCustomImage: true };
            loginSuccess(updatedUser); // Update Zustand & IdentityManager
            dispatchHandshake();
            
            toast.success('Identity visual updated');
        } catch (error) {
            toast.error('Visual processing failed');
        }
    }, [currentUser, loginSuccess, dispatchHandshake]);

    // ২. প্রোফাইল আপডেট (Atomic API Bridge)
    const updateProfile = async (e: React.FormEvent) => {
        if (e) e.preventDefault();
        
        if (currentUser?.authProvider === 'credentials' && !formData.currentPassword) {
             return toast.error("Verification password required");
        }

        setIsLoading(true);
        try {
            const res = await fetch('/api/auth/update', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    userId: currentUser._id, 
                    currentPassword: formData.currentPassword,
                    newName: formData.name, 
                    newPassword: formData.newPassword || undefined,
                    image: formData.image, 
                    isCustomImage: true
                }),
            });
            
            const data = await res.json();
            if (res.ok) {
                // 🚀 UPDATE GLOBAL IDENTITY
                loginSuccess(data.user);
                setForm(prev => ({ ...prev, currentPassword: '', newPassword: '' }));
                dispatchHandshake();
                toast.success('Core Identity Re-verified');
            } else {
                toast.error(data.message || 'Update Rejected');
            }
        } catch (error) {
            toast.error('Network Interruption');
        } finally {
            setIsLoading(false);
        }
    };

    // ৩. ডাটা এক্সপোর্ট
    const exportMasterData = async () => {
        setIsExporting(true);
        try {
            const [books, entries] = await Promise.all([db.books.toArray(), db.entries.toArray()]);
            const backupData = {
                meta: { user: currentUser?.username, email: currentUser?.email, date: new Date().toISOString() },
                books,
                entries
            };

            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", `VAULT_BACKUP_${new Date().toISOString().slice(0,10)}.json`);
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
            toast.success("Master Data Secured (JSON)");
        } catch (err) { 
            toast.error("Export Protocol Failed"); 
        } finally { 
            setIsExporting(false); 
        }
    };

    // ৪. ডাটা রিস্টোর (Import)
    const importMasterData = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                if (json.meta?.email && json.meta.email !== currentUser?.email) {
                    if (!confirm(`Warning: Backup mismatch. Proceed anyway?`)) return;
                }

                setIsLoading(true);
                if (json.books?.length) await db.books.bulkPut(json.books);
                if (json.entries?.length) await db.entries.bulkPut(json.entries);

                toast.success("Database Restoration Complete");
                dispatchHandshake(); // UI Refresh & Sync
            } catch (err) {
                toast.error("Corrupted Backup File");
            } finally {
                setIsLoading(false);
                if(e.target) e.target.value = '';
            }
        };
        reader.readAsText(file);
    };

    // ৫. একাউন্ট ডিলিট
    const deleteAccount = async () => {
        if (!confirm("🚨 TOTAL ERASURE: This will delete your account forever. Proceed?")) return;
        setIsLoading(true);
        try {
            const res = await fetch('/api/auth/delete', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUser._id }),
            });
            if (res.ok) { 
                toast.success('Account Terminated'); 
                logout(); // Atomic Store Logout
                window.location.href = '/';
            }
        } catch (error) { 
            toast.error('Erasure Protocol Interrupted'); 
        } finally { 
            setIsLoading(false); 
        }
    };

    // 🗑️ REMOVE IMAGE LOGIC
    const handleRemoveImage = async () => {
        try {
            setIsLoading(true);
            const res = await fetch('/api/auth/update', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUser._id, image: '', isCustomImage: false }),
            });
            
            if (res.ok) {
                const data = await res.json();
                loginSuccess(data.user);
                dispatchHandshake();
                toast.success('Visual Reset Complete');
            }
        } catch (error) {
            toast.error('Identity Reset Failed');
        } finally {
            setIsLoading(false);
        }
    };

    return {
        formData, setForm, isLoading, isExporting,
        handleImageProcess, handleRemoveImage,
        updateProfile, exportMasterData, importMasterData, deleteAccount
    };
};