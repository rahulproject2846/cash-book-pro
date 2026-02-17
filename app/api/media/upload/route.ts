import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// 🚀 CLOUDINARY CONFIGURATION - SERVER SIDE ONLY
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

/**
 * 🚀 BANKING-GRADE MEDIA ENGINE: Secure Upload API Route
 * ----------------------------------------------------
 * Handles secure file uploads to Cloudinary with user isolation
 * and automatic optimization.
 */
export async function POST(request: NextRequest) {
  try {
    // 🛡️ SECURITY: Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;

    // 🔍 VALIDATION: Check required fields
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { error: 'Valid userId required' },
        { status: 400 }
      );
    }

    // 📏 FILE VALIDATION: Size and type checks
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large (Max 10MB)' },
        { status: 400 }
      );
    }

    // 🎯 ALLOWED MIME TYPES
    const ALLOWED_TYPES = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/webp',
      'image/gif',
      'application/pdf'
    ];

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images and PDFs allowed' },
        { status: 400 }
      );
    }

    // 🏦 BANKING-GRADE SECURITY: Generate unique public ID
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 9);
    const publicId = `${userId}/${timestamp}_${randomSuffix}`;

    // 🚀 CLOUDINARY UPLOAD OPTIONS (FIXED)
    const uploadOptions = {
      public_id: publicId,
      folder: 'cashbook-pro/media',
      resource_type: 'auto' as const, // Keep this to support PDF/Images
      // format: 'auto',             // ❌ REMOVED (Causes error)
      // fetch_format: 'auto',       // ❌ REMOVED (Causes error)
      // quality: 'auto:good',       // ❌ REMOVED (Apply this on frontend URL, not upload)
      use_filename: false,
      unique_filename: true,
      overwrite: false,
      type: 'upload' as const,
      context: {
        userId: userId,
        uploadTime: new Date().toISOString(),
        originalName: file.name,
        fileSize: file.size
      }
    };

    console.log(`🚀 [MEDIA UPLOAD] Processing file for user: ${userId}`);
    console.log(`📊 [MEDIA UPLOAD] File details:`, {
      name: file.name,
      type: file.type,
      size: file.size,
      publicId: publicId
    });

    // 🚀 UPLOAD TO CLOUDINARY
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            console.error('❌ [MEDIA UPLOAD] Cloudinary error:', error);
            reject(error);
          } else {
            console.log('✅ [MEDIA UPLOAD] Cloudinary success:', result?.public_id);
            resolve(result);
          }
        }
      );

      // Convert File to Buffer and stream to Cloudinary
      const buffer = file.arrayBuffer();
      buffer.then(arrayBuffer => {
        const bufferData = Buffer.from(arrayBuffer);
        uploadStream.end(bufferData);
      }).catch(reject);
    });

    // ✅ SUCCESS RESPONSE
    const uploadResult = result as any;
    
    return NextResponse.json({
      success: true,
      data: {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        format: uploadResult.format,
        size: uploadResult.bytes,
        width: uploadResult.width,
        height: uploadResult.height,
        resourceType: uploadResult.resource_type,
        createdAt: uploadResult.created_at
      }
    });

  } catch (error) {
    console.error('❌ [MEDIA UPLOAD] Upload failed:', error);
    
    // 🔒 SECURITY: Don't expose internal error details
    return NextResponse.json(
      { 
        success: false,
        error: 'Upload failed. Please try again.' 
      },
      { status: 500 }
    );
  }
}

/**
 * 📊 GET: Upload status and statistics (Optional)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter required' },
        { status: 400 }
      );
    }

    // 📊 Get user's media statistics from Cloudinary
    const resources = await cloudinary.search
      .expression(`folder:cashbook-pro/media/${userId}/*`)
      .sort_by('created_at', 'desc')
      .max_results(30)
      .execute();

    return NextResponse.json({
      success: true,
      data: {
        total: resources.total_count,
        resources: resources.resources.map((resource: any) => ({
          publicId: resource.public_id,
          url: resource.secure_url,
          format: resource.format,
          size: resource.bytes,
          createdAt: resource.created_at
        }))
      }
    });

  } catch (error) {
    console.error('❌ [MEDIA UPLOAD] Status check failed:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch upload status' 
      },
      { status: 500 }
    );
  }
}
