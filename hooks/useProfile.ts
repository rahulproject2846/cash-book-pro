"use client";
import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { db } from '@/lib/offlineDB';
import { processMedia } from '@/lib/utils/mediaProcessor';
import { useMediaStore } from '@/lib/vault/MediaStore';
import { identityManager } from '@/lib/vault/core/IdentityManager';
import { generateCID } from '@/lib/offlineDB';

export const useProfile = (currentUser: any, setCurrentUser: any, onLogout: any) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    
    const [formData, setForm] = useState({
        name: currentUser?.username || '',
        currentPassword: '',
        newPassword: '',
        image: currentUser?.image || ''
    });

    // ১. ইমেজ প্রসেসিং (🚀 BANKING-GRADE MEDIA ENGINE)
    const handleImageProcess = useCallback(async (file: File) => {
        try {
            console.log(`🚀 [PROFILE IMAGE] Processing profile image:`, {
                name: file.name,
                size: `${(file.size / 1024).toFixed(2)} KB`,
                type: file.type
            });
            
            // 🗜️ SMART COMPRESSION: Use our new media processor
            const { blob, compressedSize, compressionRatio } = await processMedia(file);
            
            console.log(`✅ [PROFILE IMAGE] Compression complete:`, {
                original: `${(file.size / 1024).toFixed(2)} KB`,
                compressed: `${(compressedSize / 1024).toFixed(2)} KB`,
                saved: `${compressionRatio.toFixed(1)}%`
            });
            
            // 🆔 GENERATE MEDIA CID
            const mediaCid = generateCID();
            const userId = identityManager.getUserId();
            
            if (!userId) {
                toast.error('User not logged in');
                return;
            }
            
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
            
            // 🔄 UPDATE USER RECORD: Reference media CID and mark as custom
            await db.users.update(userId, { 
                image: mediaCid, // 🚨 Store CID reference
                isCustomImage: true // 🚨 Mark as custom upload
            });
            
            // 📤 ADD TO UPLOAD QUEUE
            const mediaStore = useMediaStore.getState();
            mediaStore.addToQueue(mediaCid);
            
            // 🎯 UPDATE FORM STATE: Show loading state
            setForm(prev => ({ ...prev, image: mediaCid }));
            
            toast.success('Image uploaded successfully! Processing...');
            
        } catch (error) {
            console.error('❌ [PROFILE IMAGE] Upload failed:', error);
            toast.error('Image upload failed');
        }
    }, []);

    // ২. প্রোফাইল আপডেট
    const updateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (currentUser?.authProvider === 'credentials' && !formData.currentPassword) {
             return toast.error("Please enter current password to save changes");
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
                setCurrentUser(data.user);
                localStorage.setItem('cashbookUser', JSON.stringify(data.user));
                setForm(prev => ({ ...prev, currentPassword: '', newPassword: '' }));
                toast.success('Profile Updated Successfully');
            } else {
                toast.error(data.message || 'Update Failed');
            }
        } catch (error) {
            toast.error('Connection Error');
        } finally {
            setIsLoading(false);
        }
    };

    // ৩. ডাটা এক্সপোর্ট
    const exportMasterData = async () => {
        setIsExporting(true);
        try {
            if (!db.isOpen()) await db.open();
            const [books, entries] = await Promise.all([db.books.toArray(), db.entries.toArray()]);

            const backupData = {
                meta: {
                    user: currentUser?.username, // মালিকানা চেক করার জন্য
                    email: currentUser?.email,
                    date: new Date().toISOString()
                },
                books,
                entries
            };

            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", `Backup_${currentUser?.username}_${new Date().toISOString().slice(0,10)}.json`);
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
            toast.success("Backup Downloaded");
        } catch (err) { toast.error("Export Failed"); } 
        finally { setIsExporting(false); }
    };

    // ৪. ডাটা রিস্টোর (Import)
    const importMasterData = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                
                // সিকিউরিটি চেক: ফাইলটি কি এই ইউজারের?
                if (json.meta?.email && json.meta.email !== currentUser?.email) {
                    const confirmRestore = confirm(`Warning: This backup belongs to "${json.meta.user}". Do you still want to merge it?`);
                    if (!confirmRestore) return;
                }

                setIsLoading(true);
                
                // লোকাল ডাটাবেস আপডেট
                if (json.books?.length) await db.books.bulkPut(json.books);
                if (json.entries?.length) await db.entries.bulkPut(json.entries);

                toast.success("Data Restored Successfully!");
                window.dispatchEvent(new Event('vault-updated')); // UI রিফ্রেশ
                
                // ব্যাকগ্রাউন্ড সিঙ্ক ট্রিগার
                if(navigator.onLine) window.dispatchEvent(new Event('online'));

            } catch (err) {
                toast.error("Invalid Backup File");
            } finally {
                setIsLoading(false);
                if(e.target) e.target.value = ''; // ইনপুট রিসেট
            }
        };
        reader.readAsText(file);
    };

    // ৫. একাউন্ট ডিলিট
    const deleteAccount = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/auth/delete', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUser._id }),
            });
            if (res.ok) { 
                toast.success('Account Deleted'); 
                onLogout(); 
            }
        } catch (error) { toast.error('Error'); } 
        finally { setIsLoading(false); }
    };

    // 🗑️ REMOVE IMAGE LOGIC: Re-enable Google sync
    const handleRemoveImage = async () => {
        try {
            if (!currentUser?._id) {
                toast.error('User not found');
                return;
            }
            
            setIsLoading(true);
            
            // 🔄 UPDATE SERVER: Remove custom image and re-enable Google sync
            const res = await fetch('/api/auth/update', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    userId: currentUser._id,
                    image: '', // 🗑️ Clear image
                    isCustomImage: false // 🗑️ Re-enable Google sync
                }),
            });
            
            if (res.ok) {
                const data = await res.json();
                setCurrentUser(data.user);
                localStorage.setItem('cashbookUser', JSON.stringify(data.user));
                setForm(prev => ({ ...prev, image: '' }));
                toast.success('Image removed. Google sync re-enabled');
            } else {
                toast.error(data.message || 'Failed to remove image');
            }
        } catch (error) {
            toast.error('Connection error');
        } finally {
            setIsLoading(false);
        }
    };

    return {
        formData, setForm,
        isLoading, isExporting,
        handleImageProcess,
        handleRemoveImage, // 🗑️ NEW: Remove image logic
        updateProfile,
        exportMasterData,
        importMasterData, // নতুন ফাংশন এক্সপোর্ট
        deleteAccount
    };
};