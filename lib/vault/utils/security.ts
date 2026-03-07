"use client";

/**
 * 🔐 VAULT SECURITY UTILITIES - Phase 20 Implementation
 * 
 * Centralized cryptographic operations for vault services
 * Prevents code duplication and ensures consistent security implementation
 */

// 🚨 WARNING FLAG: Only show security warning once per session
let hasWarned = false;

/**
 * Generate HMAC-SHA256 signature for vault requests
 * 
 * @param payload - The request payload to sign
 * @param timestamp - The request timestamp for replay protection
 * @returns Promise<string> - Hex-encoded HMAC-SHA256 signature
 */
export async function generateVaultSignature(payload: string, timestamp: string): Promise<string> {
  try {
    // 🔐 SECURITY: Validate required environment variable with fallback
    let secretKey = process.env.VAULT_CLIENT_SECRET || process.env.NEXT_PUBLIC_VAULT_CLIENT_SECRET;
    
    if (!secretKey) {
      // 🚨 PRODUCTION SECURITY: Throw hard error if secret missing in production
      if (process.env.NODE_ENV === 'production') {
        throw new Error("FATAL: VAULT_CLIENT_SECRET is missing in Production!");
      }
      
      // 🚨 CRITICAL WARNING: Missing security key, using fallback for local development
      if (!hasWarned) {
        console.warn('⚠️ [SECURITY] VAULT_CLIENT_SECRET or NEXT_PUBLIC_VAULT_CLIENT_SECRET environment variable is not set. Using fallback for local development.');
        hasWarned = true;
      }
      secretKey = 'development-fallback-key-do-not-use-in-production';
    }
    
    // Prepare data for signing: timestamp:payload
    const encoder = new TextEncoder();
    const data = encoder.encode(`${timestamp}:${payload}`);
    
    // Import the secret key for HMAC signing
    const keyBuffer = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secretKey),
      { 
        name: 'HMAC',
        hash: 'SHA-256'
      },
      false,
      ['sign']
    );
    
    // Generate HMAC-SHA256 signature
    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      keyBuffer,
      data
    );
    
    // Convert to hex string
    const signature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    return signature;
    
  } catch (error) {
    // 🔒 SECURITY: No fallback for cryptographic failures
    throw new Error(`CRITICAL_CRYPTOGRAPHIC_ERROR: Vault signature generation failed: ${error}`);
  }
}

/**
 * Prepare signed headers for vault requests
 * 
 * @param options - Original request options
 * @param signature - HMAC-SHA256 signature
 * @param timestamp - Request timestamp
 * @returns Record<string, string> - Signed headers object
 */
export function prepareSignedHeaders(
  options: RequestInit,
  signature: string,
  timestamp: string
): Record<string, string> {
  return {
    ...(options.headers as Record<string, string>),
    'X-Vault-Signature': signature,
    'X-Vault-Timestamp': timestamp,
    'Content-Type': 'application/json'
  };
}

/**
 * Prepare payload for signing
 * 
 * @param options - Original request options
 * @returns string - Normalized payload string
 */
export function preparePayload(options: RequestInit): string {
  if (!options.body) {
    return '';
  }
  
  return typeof options.body === 'string' 
    ? options.body 
    : JSON.stringify(options.body);
}
