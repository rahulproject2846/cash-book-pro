import Compressor from 'compressorjs';

/**
 * 🚀 BANKING-GRADE MEDIA ENGINE: Media Processor Utility
 * ----------------------------------------------------
 * Handles client-side image compression and optimization before upload
 * to reduce bandwidth usage and improve user experience.
 */

export interface CompressionOptions {
  quality?: number;          // 0.1 to 1.0 (default: 0.6)
  maxWidth?: number;         // Maximum width in pixels (default: 1200)
  maxHeight?: number;        // Maximum height in pixels (default: 1200)
  convertSize?: number;      // Convert blob larger than this (default: 500KB)
  mimeType?: string;         // Output format (default: auto)
}

export interface CompressionResult {
  blob: Blob;               // Compressed blob
  originalSize: number;      // Original file size in bytes
  compressedSize: number;    // Compressed file size in bytes
  compressionRatio: number;  // Percentage of size reduction
  mimeType: string;         // Output MIME type
  width?: number;           // Output width
  height?: number;          // Output height
}

/**
 * 🗜️ COMPRESS IMAGE: Smart image compression with fallback
 * 
 * @param file - Input file to compress
 * @param options - Compression configuration
 * @returns Promise<CompressionResult> - Compression result with metadata
 */
export const compressImage = async (
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> => {
  const {
    quality = 0.6,           // 60% quality - good balance
    maxWidth = 1200,         // Reasonable max width
    maxHeight = 1200,        // Reasonable max height  
    convertSize = 500 * 1024, // Convert files larger than 500KB
    mimeType = 'auto'        // Auto-detect output format
  } = options;

  const originalSize = file.size;
  
  console.log(`🗜️ [MEDIA PROCESSOR] Compressing image:`, {
    name: file.name,
    type: file.type,
    size: `${(originalSize / 1024).toFixed(2)} KB`,
    options: { quality, maxWidth, maxHeight, convertSize, mimeType }
  });

  return new Promise((resolve, reject) => {
    // 🚨 SKIP COMPRESSION: Small files don't need compression
    if (originalSize < convertSize) {
      console.log(`⚡ [MEDIA PROCESSOR] Skipping compression (file too small)`);
      
      resolve({
        blob: new Blob([file], { type: file.type }),
        originalSize,
        compressedSize: originalSize,
        compressionRatio: 0,
        mimeType: file.type
      });
      return;
    }

    // 🗜️ COMPRESS: Use Compressor.js for smart compression
    new Compressor(file, {
      quality,
      maxWidth,
      maxHeight,
      mimeType: mimeType === 'auto' ? undefined : mimeType,
      convertSize,
      
      // ✅ SUCCESS CALLBACK
      success: async (compressedFile: any) => {
        try {
          // Convert File to Blob for consistent API
          const blob = new Blob([compressedFile], { 
            type: compressedFile.type 
          });
          
          const compressedSize = blob.size;
          const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100;
          
          console.log(`✅ [MEDIA PROCESSOR] Compression successful:`, {
            original: `${(originalSize / 1024).toFixed(2)} KB`,
            compressed: `${(compressedSize / 1024).toFixed(2)} KB`,
            saved: `${compressionRatio.toFixed(1)}%`,
            outputType: compressedFile.type
          });

          // 📊 EXTRACT DIMENSIONS: Get image dimensions for metadata
          const dimensions = await getImageDimensions(blob);
          
          resolve({
            blob,
            originalSize,
            compressedSize,
            compressionRatio,
            mimeType: compressedFile.type,
            width: dimensions.width,
            height: dimensions.height
          });

        } catch (error) {
          console.error('❌ [MEDIA PROCESSOR] Failed to process compressed file:', error);
          reject(new Error('Failed to process compressed file'));
        }
      },
      
      // ❌ ERROR CALLBACK
      error: (error: any) => {
        console.error('❌ [MEDIA PROCESSOR] Compression failed:', error);
        
        // 🔄 FALLBACK: Return original file if compression fails
        console.warn(`⚠️ [MEDIA PROCESSOR] Using original file as fallback`);
        
        resolve({
          blob: new Blob([file], { type: file.type }),
          originalSize,
          compressedSize: originalSize,
          compressionRatio: 0,
          mimeType: file.type
        });
      }
    });
  });
};

/**
 * 📏 GET IMAGE DIMENSIONS: Extract width and height from image blob
 * 
 * @param blob - Image blob to analyze
 * @returns Promise<{width: number, height: number}> - Image dimensions
 */
export const getImageDimensions = (blob: Blob): Promise<{width: number, height: number}> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        width: img.width,
        height: img.height
      });
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for dimension extraction'));
    };
    
    img.src = url;
  });
};

/**
 * 🎯 SMART COMPRESSION: Adaptive compression based on file characteristics
 * 
 * @param file - Input file to compress
 * @returns Promise<CompressionResult> - Optimized compression result
 */
export const smartCompress = async (file: File): Promise<CompressionResult> => {
  const fileSizeMB = file.size / (1024 * 1024);
  
  // 🎯 ADAPTIVE SETTINGS: Adjust compression based on file size
  let options: CompressionOptions = {
    quality: 0.6,
    maxWidth: 1200,
    maxHeight: 1200
  };
  
  if (fileSizeMB > 5) {
    // 📉 HEAVY COMPRESSION: Large files
    options = {
      quality: 0.4,
      maxWidth: 800,
      maxHeight: 800,
      convertSize: 100 * 1024 // 100KB threshold
    };
  } else if (fileSizeMB > 2) {
    // 📊 MEDIUM COMPRESSION: Medium files  
    options = {
      quality: 0.5,
      maxWidth: 1000,
      maxHeight: 1000,
      convertSize: 300 * 1024 // 300KB threshold
    };
  } else if (fileSizeMB > 0.5) {
    // 📈 LIGHT COMPRESSION: Small-medium files
    options = {
      quality: 0.7,
      maxWidth: 1200,
      maxHeight: 1200,
      convertSize: 500 * 1024 // 500KB threshold
    };
  } else {
    // ⚡ MINIMAL COMPRESSION: Small files
    options = {
      quality: 0.8,
      maxWidth: 1500,
      maxHeight: 1500,
      convertSize: 800 * 1024 // 800KB threshold
    };
  }
  
  console.log(`🎯 [MEDIA PROCESSOR] Smart compression settings:`, {
    fileSizeMB: fileSizeMB.toFixed(2),
    strategy: fileSizeMB > 5 ? 'HEAVY' : fileSizeMB > 2 ? 'MEDIUM' : fileSizeMB > 0.5 ? 'LIGHT' : 'MINIMAL',
    options
  });
  
  return compressImage(file, options);
};

/**
 * 📄 PDF HANDLER: Special handling for PDF files (no compression)
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
    mimeType: 'application/pdf'
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
