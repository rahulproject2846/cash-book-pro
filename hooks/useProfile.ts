"use client";
import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { db } from '@/lib/offlineDB';

export const useProfile = (currentUser: any, setCurrentUser: any, onLogout: any) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    
    const [formData, setForm] = useState({
        name: currentUser?.username || '',
        currentPassword: '',
        newPassword: '',
        image: currentUser?.image || ''
    });

    // ১. ইমেজ প্রসেসিং
   // ১. স্মার্ট ইমেজ কম্প্রেসর (Fixed for MongoDB Storage)
    const handleImageProcess = useCallback((file: File) => {
        // ফাইল সাইজ চেক (৫ এমবি এর বেশি হলে নিবে না)
        if (file.size > 5 * 1024 * 1024) return toast.error("File too large (Max 5MB)");
        
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // 🔥 ফিক্স: সাইজ কমানো হয়েছে (৩০০px) যাতে ডাটাবেসে সেভ হয়
                const MAX_WIDTH = 300; 
                const scaleSize = MAX_WIDTH / img.width;
                canvas.width = MAX_WIDTH;
                canvas.height = img.height * scaleSize;

                if (ctx) {
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    
                    // 🔥 কোয়ালিটি ০.৬ (৬০%) করা হয়েছে
                    const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6); 
                    
                    setForm(prev => ({ ...prev, image: compressedBase64 }));
                    toast.success("Image Ready for Save");
                }
            };
        };
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

    return {
        formData, setForm,
        isLoading, isExporting,
        handleImageProcess,
        updateProfile,
        exportMasterData,
        importMasterData, // নতুন ফাংশন এক্সপোর্ট
        deleteAccount
    };
};