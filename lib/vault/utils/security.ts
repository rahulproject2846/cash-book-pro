"use client";

/**
 * 🔐 VAULT SECURITY UTILITIES - Phase 20 Implementation
 * 
 * Centralized cryptographic operations for vault services
 * Prevents code duplication and ensures consistent security implementation
 */

/**
 * Generate HMAC-SHA256 signature for vault requests
 * 
 * @param payload - The request payload to sign
 * @param timestamp - The request timestamp for replay protection
 * @returns Promise<string> - Hex-encoded HMAC-SHA256 signature
 */
export async function generateVaultSignature(payload: string, timestamp: string): Promise<string> {
  try {
    const secretKey = process.env.NEXT_PUBLIC_VAULT_SECRET || 'robot_vault_2026';
    
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
    
    console.log('🔐 [SECURITY] Vault signature generated successfully');
    return signature;
    
  } catch (error) {
    console.error('❌ [SECURITY] Failed to generate vault signature:', error);
    throw new Error(`Vault signature generation failed: ${error}`);
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
