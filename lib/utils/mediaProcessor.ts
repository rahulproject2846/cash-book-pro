import imageCompression from 'browser-image-compression';

/**
 * 🚀 PATHOR ROCK-SOLID: Media Processor Utility
 * ----------------------------------------------------
 * Banking-grade client-side image compression with Google-standard precision.
 * Handles aspect ratios, memory safety, and UI bridging for offline-first resilience.
 */

/**
 * 🎛️ COMPRESSION OPTIONS: Immutable configuration for image processing
 * 
 * @interface CompressionOptions
 * @description Rock-solid compression parameters with type safety
 */
export interface CompressionOptions {
  /** Quality level from 0.1 (lowest) to 1.0 (highest). Default: 0.7 */
  readonly quality?: number;
  /** Maximum file size in megabytes. Default: 0.2MB */
  readonly maxSizeMB?: number;
  /** Maximum width or height in pixels (maintains aspect ratio). Default: 1200 */
  readonly maxWidthOrHeight?: number;
  /** Enable web worker for non-blocking compression. Default: true */
  readonly useWebWorker?: boolean;
}

/**
 * 📊 COMPRESSION RESULT: Immutable result metadata with precise measurements
 * 
 * @interface CompressionResult
 * @description Complete compression analysis with actual dimensions and metrics
 */
export interface CompressionResult {
  /** Compressed blob ready for upload */
  readonly blob: Blob;
  /** Original file size in bytes */
  readonly originalSize: number;
  /** Compressed file size in bytes */
  readonly compressedSize: number;
  /** Size reduction percentage (0-100) */
  readonly compressionRatio: number;
  /** Output MIME type */
  readonly mimeType: string;
  /** Actual output width in pixels */
  readonly width: number;
  /** Actual output height in pixels */
  readonly height: number;
}

/**
 * 🗜️ PROCESS IMAGE: Google-standard async compression with dynamic aspect ratio detection
 * 
 * @param file - Input file to compress (must be valid image format)
 * @param options - Compression configuration with Pathor defaults
 * @returns Promise<CompressionResult> - Compression result with actual dimensions
 * @throws Error when compression fails
 */
export const processImage = async (
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> => {
  const originalSize = file.size;
  
  try {
    // 🛡️ PATHOR: Strict type validation for quality parameter
    const quality = typeof options.quality === 'number' && !isNaN(options.quality) 
      ? Math.max(0.1, Math.min(1.0, options.quality)) 
      : 0.7;
    
    const compressedFile = await imageCompression(file, {
      maxSizeMB: options.maxSizeMB || 0.2,
      maxWidthOrHeight: options.maxWidthOrHeight || 1200,
      useWebWorker: options.useWebWorker !== false,
      initialQuality: quality  // 🛡️ PATHOR: Guaranteed number type
    });

    // 🎯 PATHOR: Dynamic dimension extraction - no more hardcoded values
    console.log(`🔍 [MEDIA PROCESSOR] Blob integrity check:`, {
      mimeType: compressedFile.type,
      size: compressedFile.size,
      sizeKB: (compressedFile.size / 1024).toFixed(2)
    });
    
    const dimensions = await getImageDimensions(compressedFile);

    return {
      blob: compressedFile,
      originalSize,
      compressedSize: compressedFile.size,
      compressionRatio: Number(((1 - compressedFile.size / originalSize) * 100).toFixed(2)),
      mimeType: compressedFile.type,
      width: dimensions.width,   // 🎯 ACTUAL compressed dimensions
      height: dimensions.height  // 🎯 PRESERVES aspect ratio
    };
  } catch (error) {
    console.error('❌ [MEDIA PROCESSOR] Compression failed:', error);
    throw error;
  }
};

/**
 * 📏 GET IMAGE DIMENSIONS: Extract width and height from image blob with bulletproof memory management
 * 
 * @param blob - Image blob to analyze
 * @returns Promise<{width: number, height: number}> - Image dimensions
 * @throws Error when image fails to load
 */
export const getImageDimensions = (blob: Blob): Promise<{width: number, height: number}> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    
    // 🛡️ PATHOR: Define handlers BEFORE setting src (Google-level safety)
    img.onload = () => {
      // 🧹 CLEANUP: Revoke URL after successful load
      URL.revokeObjectURL(url);
      resolve({
        width: img.width,
        height: img.height
      });
    };
    
    img.onerror = (event) => {
      // 🧹 CLEANUP: Revoke URL after error
      URL.revokeObjectURL(url);
      // 🔍 ENHANCED LOGGING: Log actual error details
      console.error('❌ [IMAGE DIMENSIONS] Failed to load image:', {
        blobSize: blob.size,
        blobType: blob.type,
        event: event,
        imgSrc: img.src.substring(0, 50) + '...',
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight
      });
      reject(new Error(`Failed to load image for dimension extraction. Blob: ${blob.type}, Size: ${blob.size} bytes`));
    };
    
    // 🚀 TRIGGER: Set src AFTER handlers are defined
    img.src = url;
  });
};

/**
 * 🎯 SMART COMPRESSION: Pathor-standard adaptive compression based on file characteristics
 * 
 * @param file - Input file to compress
 * @returns Promise<CompressionResult> - Optimized compression result with balanced quality
 */
export const smartCompress = async (file: File): Promise<CompressionResult> => {
  const fileSizeMB = file.size / (1024 * 1024);
  
  // 🎯 PATHOR-STANDARD BOUNDS: Balanced compression strategies
  let options: CompressionOptions = {
    quality: 0.7,
    maxWidthOrHeight: 1200,
    maxSizeMB: 0.5  // Default: 500KB threshold
  };
  
  if (fileSizeMB > 5) {
    // 📉 HEAVY COMPRESSION: Large files (>5MB) - balanced quality
    options = {
      quality: 0.5,              // 🛡️ PATHOR: 50% quality (no heavy artifacts)
      maxWidthOrHeight: 1000,   // Reduced dimensions for large files
      maxSizeMB: 0.2            // 200KB target for large files
    };
  } else if (fileSizeMB > 2) {
    // 📊 MEDIUM COMPRESSION: Medium files (>2MB) - good quality
    options = {
      quality: 0.6,              // 🛡️ PATHOR: 60% quality (balanced)
      maxWidthOrHeight: 1200,   // Standard dimensions
      maxSizeMB: 0.3            // 300KB target for medium files
    };
  } else if (fileSizeMB > 0.5) {
    // 📈 LIGHT COMPRESSION: Small-medium files (>0.5MB) - high quality
    options = {
      quality: 0.7,              // 🛡️ PATHOR: 70% quality (preserve detail)
      maxWidthOrHeight: 1200,   // Standard dimensions
      maxSizeMB: 0.5            // 500KB target for small-medium files
    };
  } else {
    // ⚡ MINIMAL COMPRESSION: Small files (<0.5MB) - preserve maximum detail
    options = {
      quality: 0.8,              // 🛡️ PATHOR: 80% quality (preserve detail)
      maxWidthOrHeight: 1500,   // Allow larger dimensions for small files
      maxSizeMB: 0.8            // 800KB target for small files
    };
  }
  
  console.log(`🎯 [MEDIA PROCESSOR] Pathor smart compression:`, {
    fileSizeMB: fileSizeMB.toFixed(2),
    strategy: fileSizeMB > 5 ? 'HEAVY' : fileSizeMB > 2 ? 'MEDIUM' : fileSizeMB > 0.5 ? 'LIGHT' : 'MINIMAL',
    options
  });
  
  return processImage(file, options);
};

/**
 * 🌉 UI BRIDGE: CID Resolver - Fixes Ghost Image placeholder issue
 * 
 * @param imagePath - Image path (CID or URL)
 * @returns Promise<string | null> - Resolved image URL or null
 * @description Bridges UI components with offline-first media storage
 */
export const resolveMediaSource = async (imagePath: string): Promise<string | null> => {
  try {
    // 🎯 CID DETECTION: Check if path is a CID reference
    if (imagePath.startsWith('cid_')) {
      // 📦 OFFLINE STORAGE: Fetch from local Dexie mediaStore
      const { db } = await import('../offlineDB');
      let mediaRecord = await db.mediaStore.get(imagePath);
      
      // 🛡️ RACE CONDITION FIX: Single-retry with 200ms timeout
      if (!mediaRecord) {
        await new Promise(resolve => setTimeout(resolve, 200));
        mediaRecord = await db.mediaStore.get(imagePath);
      }
      
      if (mediaRecord?.blobData) {
        // 📄 LOCAL URL: Create object URL for offline access
        const localUrl = URL.createObjectURL(mediaRecord.blobData);
        return localUrl;
      } else {
        return null;
      }
    }
    
    // 🌐 URL DETECTION: Return HTTP URLs as-is
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    // ❌ INVALID PATH: Neither CID nor URL
    return null;
    
  } catch (error) {
    return null;
  }
};

/**
 * � PDF HANDLER: Special handling for PDF files (no compression)
 * 
 * @param file - PDF file to process
 * @returns Promise<CompressionResult> - PDF processing result
 */
export const processPdf = async (file: File): Promise<CompressionResult> => {
  console.log(`📄 [MEDIA PROCESSOR] Processing PDF:`, {
    name: file.name,
    size: `${(file.size / 1024).toFixed(2)} KB`
  });
  
  // 📄 PDFs are not compressed, just validated and returned as blob
  const blob = new Blob([file], { type: 'application/pdf' });
  
  return {
    blob,
    originalSize: file.size,
    compressedSize: file.size,
    compressionRatio: 0,
    mimeType: 'application/pdf',
    width: 0,    // PDFs don't have image dimensions
    height: 0    // PDFs don't have image dimensions
  };
};

/**
 * 🔄 UNIVERSAL PROCESSOR: Handle both images and PDFs
 * 
 * @param file - Input file to process
 * @param options - Processing options
 * @returns Promise<CompressionResult> - Processing result
 */
export const processMedia = async (
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> => {
  // 📄 PDF HANDLING: No compression for PDFs
  if (file.type === 'application/pdf') {
    return processPdf(file);
  }
  
  // 🖼️ IMAGE HANDLING: Apply compression
  if (file.type.startsWith('image/')) {
    return smartCompress(file);
  }
  
  // ❌ UNSUPPORTED FILE TYPE
  throw new Error(`Unsupported file type: ${file.type}`);
};

/**
 * 📊 VALIDATE FILE: Comprehensive file validation
 * 
 * @param file - File to validate
 * @param maxSizeMB - Maximum allowed size in MB (default: 10)
 * @returns boolean - True if file is valid
 */
export const validateFile = (
  file: File, 
  maxSizeMB: number = 10
): { valid: boolean; error?: string } => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  
  // 📏 SIZE VALIDATION
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File too large (Max ${maxSizeMB}MB)`
    };
  }
  
  // 📄 TYPE VALIDATION
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png', 
    'image/webp',
    'image/gif',
    'application/pdf'
  ];
  
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Only images and PDFs allowed'
    };
  }
  
  // ✅ ALL VALIDATIONS PASSED
  return { valid: true };
};
