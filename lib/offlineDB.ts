"use client";

import Dexie, { Table } from 'dexie';

/**
 * 🛡️ VAULT PRO: CORE DATABASE ENGINE (V38.0 - THE FINAL STABILIZER)
 * ---------------------------------------------------------------
 * Fixes: Added missing 'riskScore' and 'email' indices for the users table.
 * Version: 38 (Mandatory upgrade to clear SchemaErrors)
 */

// --- ১. ডাটা টাইপ ডিফিনিশনস ---

export interface LocalUser {
  _id: string;          
  userId?: string;       
  username: string;
  email: string;
  image?: string;
  synced: 0 | 1;  // 🆕 ADDED: Sync status for user profile
  preferences: {
    language: 'en' | 'bn';
    compactMode: boolean;
    currency: string;
    turboMode?: boolean;
    isMidnight?: boolean;
    autoLock?: boolean;
    dailyReminder?: boolean;
    weeklyReports?: boolean;
    highExpenseAlert?: boolean;
    showTooltips?: boolean;
    expenseLimit?: number;
  };
  categories: string[];
  currency: string;
  vKey: number;
  updatedAt: number;
  plan?: 'free' | 'pro';
  offlineExpiry?: number;
  riskScore?: number;
  receiptId?: string;
  licenseSignature?: string;
  isMigrated?: boolean;
}

export interface LocalBook {
  localId?: number;     
  _id?: string;         
  cid: string;          
  sequenceNumber?: number;
  name: string;
  entryCount?: number;
  description?: string;
  type: 'general' | 'customer' | 'supplier';
  phone?: string;     
  color?: string;
  updatedAt: number;
  createdAt: number;  
  synced: 0 | 1;        
  isDeleted: 0 | 1;     
  vKey: number;         
  syncAttempts: number; 
  lastAttempt?: number; 
  isPinned?: number;     
  userId: string;        
  conflicted?: 0 | 1;     
  conflictReason?: string;    
  serverData?: any;        
  image?: string;         
  mediaCid?: string;       
  isPublic?: number;     
  shareToken?: string | null;    
  localStatus?: 'pending_media' | 'ready'; 
  lastSniperFetch?: number;
  cachedBalance?: number;
  mutationType?: 'CREATE' | 'UPDATE' | 'PATCH';
}

export interface LocalEntry {
  localId?: number;     
  _id?: string;         
  cid: string;          
  sequenceNumber?: number;
  bookId: string;       
  userId: string;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  paymentMethod: string;
  note?: string;
  date: string;
  time: string;
  status: 'completed' | 'pending';
  synced: 0 | 1;        
  isDeleted: 0 | 1;     
  createdAt: number;
  updatedAt: number;
  vKey: number;         
  checksum: string;     
  syncAttempts: number; 
  lastAttempt?: number; 
  _emergencyFlushed?: boolean;
  _emergencyFlushAt?: number;
  isPinned?: number;     
  conflicted?: 0 | 1;     
  conflictReason?: string;    
  serverData?: any;        
  mediaId?: string;        
  // 🎯 METADATA HARDENING: Track mutation type for intelligent dispatch
  mutationType?: 'CREATE' | 'UPDATE' | 'PATCH';
}

export interface LocalTelemetry {
  id?: number;
  type: 'SYNC_ERROR' | 'APP_OPEN' | 'TRANS_COUNT';
  details: string;
  synced: 0 | 1;
  timestamp: number;
}

export interface LocalAuditLog {
  localId?: number;
  cid: string;
  type: 'book' | 'entry';
  decision: 'local' | 'server';
  timestamp: number;
  userId: string;
}

export interface LocalSnapshot {
  localId?: number;
  cid: string;
  type: 'book' | 'entry';
  record: any;               
  timestamp: number;
  reason: 'pre_resolution_backup' | 'auto_backup' | 'manual_backup';
  userId: string;
}

export interface LocalMedia {
  localId?: number;
  cid: string;                    
  parentType: 'book' | 'entry' | 'user';  
  parentId: string;               
  localStatus: 'pending_upload' | 'uploaded' | 'failed';  
  blobData?: Blob;                
  cloudinaryUrl?: string;         
  cloudinaryPublicId?: string;    
  mimeType: string;               
  originalSize: number;           
  compressedSize?: number;        
  uploadProgress?: number;        
  uploadError?: string;           
  createdAt: number;
  uploadedAt?: number;            
  userId: string;                 
}

// --- ২. হেল্পার ফাংশনস ---

export const generateEntryChecksum = async (entry: any): Promise<string> => {
    const payload = `${entry.amount}:${entry.date}:${entry.time || ""}:${entry.title || ""}:${entry.note || ""}:${entry.category || ""}:${entry.paymentMethod || ""}:${entry.type || ""}:${entry.status || ""}`;
    const msgUint8 = new TextEncoder().encode(payload);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return `sha256_${hashArray.map(b => b.toString(16).padStart(2, '0')).join('')}`;
};

export const generateCID = () => {
  const uuid = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
  return `cid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${uuid}`;
};

// --- ৩. ডাটাবেজ ইঞ্জিন ---

export class VaultProDB extends Dexie {
  books!: Table<LocalBook>;
  entries!: Table<LocalEntry>;
  users!: Table<LocalUser>; 
  telemetry!: Table<LocalTelemetry>;
  audits!: Table<any>;
  auditLogs!: Table<LocalAuditLog>;
  snapshots!: Table<LocalSnapshot>;
  mediaStore!: Table<LocalMedia>;
  syncPoints!: Table<any>;
  migrationCheckpoints!: Table<any>;

  constructor() {
    super('VaultPro_Core_V1'); 
    
    // 🚀 Version 38: THE FINAL STABILIZER (REINFORCED)
    // Adds ALL missing indices: synced, conflicted, riskScore, email, plan
    this.version(38).stores({
      books: '++localId, _id, userId, &cid, sequenceNumber, synced, conflicted, isDeleted, updatedAt, isPinned, [userId+isDeleted+updatedAt]',
      entries: '++localId, _id, &cid, bookId, userId, sequenceNumber, synced, conflicted, isDeleted, updatedAt, [userId+isDeleted+bookId], [userId+isDeleted+updatedAt]',
      users: '_id, userId, email, plan, riskScore, vKey, synced',
      telemetry: '++id, type, synced, timestamp',
      audits: '++id, type, level, timestamp, sessionId, userId',
      auditLogs: '++localId, cid, userId, timestamp',
      snapshots: '++localId, cid, userId, timestamp',
      mediaStore: '++localId, &cid, parentType, parentId, localStatus, userId, createdAt, uploadedAt',
      syncPoints: '++id, userId, type, lastSequence, timestamp',
      migrationCheckpoints: '++id, version, step, status, timestamp'
    }).upgrade(() => {
      console.log('💎 Vault Pro: Database Stabilized to V38 - All critical indices (Risk/Sync/Conflict) restored.');
    });
  }
}

if (typeof window !== 'undefined') {
  (window as any).db = new VaultProDB();
}

export const db = (typeof window !== 'undefined') ? (window as any).db : null as any;

export const clearVaultData = async () => {
  if (typeof window === "undefined" || !db) return;
  await Promise.all([
    db.books.clear(), db.entries.clear(), db.users.clear(), db.telemetry.clear(),
    db.audits.clear(), db.auditLogs.clear(), db.snapshots.clear(), db.mediaStore.clear(),
    db.syncPoints.clear(), db.migrationCheckpoints.clear()
  ]);
};