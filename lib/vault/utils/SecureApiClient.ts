"use client";

/**
 * 🔐 SECURE API CLIENT - Centralized Cryptographic Handshake
 * 
 * Eliminates security logic duplication across 3+ services
 * Provides single-line secure API calls with HMAC-SHA256 signing
 */

import { generateVaultSignature, prepareSignedHeaders, preparePayload } from './security';

/**
 * 🛡️ SECURE API CLIENT
 * 
 * Static class providing centralized cryptographic security for all vault services
 * Eliminates code duplication and ensures consistent security implementation
 */
export class SecureApiClient {
  
  /**
   * 🔐 SECURE SIGNED FETCH
   * 
   * Centralized method for making cryptographically signed API calls
   * Used by PushService, PullService, BulkSlice, and other vault services
   * 
   * @param url - The API endpoint URL
   * @param options - Request options (method, headers, body, etc.)
   * @param serviceName - Name of the calling service for error logging
   * @returns Promise<Response> - The fetch response
   */
  static async signedFetch(
    url: string, 
    options: RequestInit, 
    serviceName: string
  ): Promise<Response> {
    try {
      // 🔐 STEP 1: Generate timestamp for replay protection
      const timestamp = Date.now().toString();
      
      // 🔐 STEP 2: Prepare payload for signing
      const payload = preparePayload(options);
      
      // 🔐 STEP 3: Generate HMAC-SHA256 signature
      const signature = await generateVaultSignature(payload, timestamp);
      
      // 🔐 STEP 4: Prepare signed headers
      const signedHeaders = prepareSignedHeaders(options, signature, timestamp);
      
      // 🔐 STEP 5: Make secure fetch call
      return fetch(url, {
        ...options,
        headers: signedHeaders,
        body: payload || undefined
      });
      
    } catch (error) {
      // 🚨 SECURITY FALLBACK: Log error and fallback to standard fetch
      console.error(`❌ [${serviceName}] Signature generation failed:`, error);
      console.warn(`🔒 [${serviceName}] Falling back to standard fetch - SECURITY COMPROMISED`);
      
      return fetch(url, options);
    }
  }
  
  /**
   * 🚀 QUICK SECURE FETCH
   * 
   * Convenience method for simple GET requests with automatic headers
   * 
   * @param url - The API endpoint URL
   * @param serviceName - Name of the calling service for error logging
   * @returns Promise<Response> - The fetch response
   */
  static async secureGet(url: string, serviceName: string): Promise<Response> {
    return this.signedFetch(url, {
      method: 'GET',
      headers: {}
    }, serviceName);
  }
  
  /**
   * 🚀 QUICK SECURE POST
   * 
   * Convenience method for POST requests with automatic headers
   * 
   * @param url - The API endpoint URL
   * @param data - The request body data
   * @param serviceName - Name of the calling service for error logging
   * @returns Promise<Response> - The fetch response
   */
  static async securePost(url: string, data: any, serviceName: string): Promise<Response> {
    return this.signedFetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    }, serviceName);
  }
  
  /**
   * 🚀 QUICK SECURE PUT
   * 
   * Convenience method for PUT requests with automatic headers
   * 
   * @param url - The API endpoint URL
   * @param data - The request body data
   * @param serviceName - Name of the calling service for error logging
   * @returns Promise<Response> - The fetch response
   */
  static async securePut(url: string, data: any, serviceName: string): Promise<Response> {
    return this.signedFetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    }, serviceName);
  }
  
  /**
   * 🚀 QUICK SECURE DELETE
   * 
   * Convenience method for DELETE requests with automatic headers
   * 
   * @param url - The API endpoint URL
   * @param serviceName - Name of the calling service for error logging
   * @returns Promise<Response> - The fetch response
   */
  static async secureDelete(url: string, serviceName: string): Promise<Response> {
    return this.signedFetch(url, {
      method: 'DELETE',
      headers: {}
    }, serviceName);
  }
}
