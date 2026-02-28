import mongoose, { Schema, model, models, Document } from 'mongoose';

/**
 * MEDIA STORAGE SCHEMA PROTOCOL - V1.0 (Cloudinary Integration)
 * ------------------------------------------------------------
 * Purpose: Store media metadata and Cloudinary URL references
 * Used by: Maintenance service for cleanup and media management
 */

// ১. টাইপস্ক্রিপ্ট ইন্টারফেস
export interface IMedia extends Document {
  userId: string;              // Owner identification
  cid: string;                 // Media identifier (unique)
  parentType: 'book' | 'entry' | 'user';  // Parent record type
  parentId: string;            // Parent record ID
  cloudinaryUrl: string;       // Cloudinary URL (required)
  localStatus: string;         // Upload status
  mimeType?: string;           // File type (optional)
  originalSize?: number;       // File size in bytes (optional)
  compressedSize?: number;     // Compressed size (optional)
  createdAt: Date;             // When media was created
}

const MediaSchema = new Schema<IMedia>({
  // User identification for security and data isolation
  userId: { 
    type: String, 
    required: [true, "User ID is mandatory for media records"]
  },
  
  // Media identifier (globally unique)
  cid: { 
    type: String, 
    required: [true, "Media CID is required"],
    unique: true,
    index: true 
  },
  
  // Parent record type for relationship tracking
  parentType: {
    type: String,
    required: [true, "Parent type is required"],
    enum: ['book', 'entry', 'user'],
    index: true
  },
  
  // Parent record ID for relationship tracking
  parentId: {
    type: String,
    required: [true, "Parent ID is required"],
    index: true
  },
  
  // Cloudinary URL (required for media storage)
  cloudinaryUrl: {
    type: String,
    required: [true, "Cloudinary URL is required"],
    index: true
  },
  
  // Upload status tracking
  localStatus: {
    type: String,
    required: true,
    enum: ['pending_upload', 'uploaded', 'failed', 'deleted'],
    default: 'uploaded',
    index: true
  },
  
  // File metadata (optional but useful for analytics)
  mimeType: {
    type: String,
    match: [/^[a-zA-Z0-9\/\-+.]+$/, "Invalid MIME type format"],
    index: true
  },
  
  // File size tracking
  originalSize: {
    type: Number,
    min: 0,
    index: true
  },
  
  // Compressed size tracking
  compressedSize: {
    type: Number,
    min: 0
  },
  
  // Creation timestamp with indexing
  createdAt: {
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
MediaSchema.index({ userId: 1, createdAt: -1 }); // User's media history
MediaSchema.index({ userId: 1, localStatus: 1, createdAt: -1 }); // User's media by status
MediaSchema.index({ parentType: 1, parentId: 1, createdAt: -1 }); // Parent relationship queries
MediaSchema.index({ cid: 1, userId: 1 }); // CID verification with user context

// TTL index for automatic cleanup of failed uploads (30 days)
MediaSchema.index({ 
  createdAt: 1, 
  localStatus: 1 
}, { 
  expireAfterSeconds: 30 * 24 * 60 * 60,
  partialFilterExpression: { localStatus: 'failed' }
});

export default models.Media || model<IMedia>('Media', MediaSchema);
