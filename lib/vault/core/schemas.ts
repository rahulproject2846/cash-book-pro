"use client";

import { z, ZodRecord } from 'zod';

/**
 * 🛡️ TOTAL SCHEMA GUARD - Zod Validation Schemas
 * 
 * Prevents legacy data corruption and malformed records from entering
 * database or being sent to the server.
 */

// Book Schema with strict validation
export const BookSchema = z.object({
  localId: z.number().optional(),
  _id: z.string().optional(),
  cid: z.string().min(1, "CID is required"),
  name: z.string().min(1, "Book name is required"),
  description: z.string().optional(),
  updatedAt: z.coerce.number(),
  synced: z.union([z.number(), z.boolean()]).transform(val => (val === true || val === 1) ? 1 : 0),
  isDeleted: z.union([z.number(), z.boolean()]).transform(val => (val === true || val === 1) ? 1 : 0),
  vKey: z.coerce.number(),
  syncAttempts: z.coerce.number().default(0),
  lastAttempt: z.coerce.number().optional(),
  isPinned: z.coerce.number().optional(),
  userId: z.string().min(1, "User ID is required"),
  conflicted: z.union([z.number(), z.boolean()]).transform(val => (val === true || val === 1) ? 1 : 0).optional(),
  conflictReason: z.string().optional(),
  serverData: z.any().optional(),
  image: z.string().optional(),
  mediaCid: z.string().optional(),
  lastSniperFetch: z.coerce.number().optional(),
});

// User Schema with strict validation
export const UserSchema = z.object({
  _id: z.string().optional(),
  username: z.string(),
  email: z.string().email(),
  image: z.string().optional(),
  plan: z.enum(['free', 'pro']).default('free'),
  offlineExpiry: z.number().default(0),
  riskScore: z.number().default(0),
  receiptId: z.string().nullable().optional(),
  preferences: z.record(z.string(), z.any()).optional(),
  updatedAt: z.number().optional()
});

// Entry Schema with strict validation
export const EntrySchema = z.object({
  localId: z.number().optional(),
  _id: z.string().optional(),
  cid: z.string().min(1, "CID is required"),
  bookId: z.string().min(1, "Book ID is required"),
  userId: z.string().min(1, "User ID is required"),
  title: z.string().min(1, "Entry title is required"),
  amount: z.coerce.number(),
  type: z.enum(['income', 'expense']),
  category: z.string().min(1, "Category is required"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  note: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  status: z.enum(['completed', 'pending']),
  synced: z.union([z.number(), z.boolean()]).transform(val => (val === true || val === 1) ? 1 : 0),
  isDeleted: z.union([z.number(), z.boolean()]).transform(val => (val === true || val === 1) ? 1 : 0),
  createdAt: z.coerce.number(),
  updatedAt: z.coerce.number(),
  vKey: z.coerce.number(),
  checksum: z.string().min(1, "Checksum is required"),
  syncAttempts: z.coerce.number().default(0),
  lastAttempt: z.coerce.number().optional(),
  _emergencyFlushed: z.boolean().optional(),
  _emergencyFlushAt: z.coerce.number().optional(),
  isPinned: z.coerce.number().optional(),
  conflicted: z.union([z.number(), z.boolean()]).transform(val => (val === true || val === 1) ? 1 : 0).optional(),
  conflictReason: z.string().optional(),
  serverData: z.any().optional(),
  mediaId: z.string().optional(),
});

/**
 * 🛡️ VALIDATE RECORD - Universal validation helper
 * 
 * Uses safeParse() to gracefully handle validation failures
 * @param schema Zod schema to validate against
 * @param data Data to validate
 * @param typeName Type name for error logging
 * @returns { success: boolean, data?: any, error?: string }
 */
export function validateRecord<T>(
  schema: z.Schema<T>, 
  data: any, 
  typeName: string
): { success: boolean; data?: T; error?: string } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    const missingFields = result.error.issues
      .map(issue => `${issue.path.join('.')} (${issue.message})`)
      .join(', ');
    
    const error = `🚨 [VALIDATOR] Data corruption blocked for ${typeName}. Missing: ${missingFields}`;
    console.error(error, { data, validationErrors: result.error.issues });
    
    return { success: false, error };
  }
}

/**
 * 🎯 VALIDATE BOOK - Specialized book validator
 */
export function validateBook(data: any): { success: boolean; data?: any; error?: string } {
  return validateRecord(BookSchema, data, `Book ID: ${data?.cid || 'unknown'}`);
}

/**
 * 🎯 VALIDATE ENTRY - Specialized entry validator
 */
export function validateEntry(data: any): { success: boolean; data?: any; error?: string } {
  return validateRecord(EntrySchema, data, `Entry ID: ${data?.cid || 'unknown'}`);
}

/**
 * 🎯 VALIDATE USER - Specialized user validator
 */
export function validateUser(data: any): { success: boolean; data?: any; error?: string } {
  return validateRecord(UserSchema, data, `User ID: ${data?._id || 'unknown'}`);
}
