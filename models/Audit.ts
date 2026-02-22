import mongoose, { Schema, model, models, Document } from 'mongoose';

/**
 * AUDIT LOG SCHEMA PROTOCOL - V1.0 (System Integrity)
 * ----------------------------------------------------
 * Purpose: Store system audit logs for conflict resolution and debugging
 * Used by: Maintenance service for cleanup and analytics
 */

// ১. টাইপস্ক্রিপ্ট ইন্টারফেস
export interface IAudit extends Document {
  userId: string;        // User identification
  cid?: string;         // Conflict identifier (optional)
  action: string;       // Action performed (required)
  type?: string;        // Record type: 'book', 'entry', etc. (optional)
  decision?: string;    // Resolution decision: 'local_win', 'server_win' (optional)
  details?: any;        // Additional details as object (optional)
  timestamp: Date;      // When the audit log was created
}

const AuditSchema = new Schema<IAudit>({
  // User identification for data isolation
  userId: { 
    type: String, 
    required: [true, "User ID is mandatory for audit logs"],
    index: true 
  },
  
  // Conflict identifier (optional for general audit logs)
  cid: {
    type: String,
    index: true
  },
  
  // Action performed (required for all audit logs)
  action: { 
    type: String, 
    required: [true, "Action is required for audit logs"],
    index: true
  },
  
  // Record type for categorization
  type: {
    type: String,
    enum: ['book', 'entry', 'user', 'system'],
    index: true
  },
  
  // Resolution decision for conflict logs
  decision: {
    type: String,
    enum: ['local_win', 'server_win', 'manual_resolve', 'auto_resolve'],
    index: true
  },
  
  // Additional details stored as flexible object
  details: {
    type: Schema.Types.Mixed,
    default: {}
  },
  
  // Timestamp with automatic indexing
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, { 
  timestamps: true,
  versionKey: false 
});

// ২. ইনডেক্সিং: অপ্টিমাইজেশন জন্য
// Compound indexes for common queries
AuditSchema.index({ userId: 1, timestamp: -1 }); // User's audit history
AuditSchema.index({ userId: 1, action: 1, timestamp: -1 }); // User's specific actions
AuditSchema.index({ type: 1, timestamp: -1 }); // System-wide type filtering
AuditSchema.index({ cid: 1, timestamp: -1 }); // Conflict resolution tracking

// TTL index for automatic cleanup (optional - 90 days)
AuditSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export default models.Audit || model<IAudit>('Audit', AuditSchema);
