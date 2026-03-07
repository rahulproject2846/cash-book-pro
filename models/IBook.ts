export interface IBook extends Document {
  cid: string;        
  name: string;
  entryCount?: number;
  description?: string;
  vKey: number;         
  syncAttempts: number; 
  lastAttempt?: number; 
  isPinned?: number;     
  userId: string; 
  isPublic: number;
  shareToken?: string;
  type: 'general' | 'customer' | 'supplier';
  phone?: string;
  image?: string; 
  isDeleted?: number;
  conflicted?: number;
  conflictReason?: string;
  serverData?: any;
  createdAt: number;
  updatedAt: number; // 🚨 DNA HARDENING: Changed from Date to number for consistency
  mediaCid?: string; // ✅ ADDED: Cloudinary URL reference
}
