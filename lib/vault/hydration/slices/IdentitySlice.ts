"use client";

import { db } from '@/lib/offlineDB';
import { normalizeUser, normalizeRecord } from '../../core/VaultUtils';
import type { HydrationResult } from '../engine/types';
import { getVaultStore } from '../../store/storeHelper';

/**
 * IDENTITY SLICE - User Profile Hydration
 * 
 * Handles user profile fetching and processing
 * Returns processed user object to Controller instead of direct DB writes
 */
export class IdentitySlice {
  private userId: string = '';
  private server_profile_missing: boolean = false;

  constructor(userId: string) {
    this.userId = userId;
  }

  /**
   * 🧑 HYDRATE USER PROFILE
   * Fetches user profile from server and returns processed user object
   */
  async hydrateUser(): Promise<{ success: boolean; user?: any; error?: string; server_profile_missing?: boolean }> {
    try {
      console.log('🧑 [IDENTITY SLICE] Fetching user profile from server...');
      
      const response = await fetch(`/api/user/profile?userId=${encodeURIComponent(this.userId)}`);
      if (!response.ok) {
        // 🛡️ Handle 404/401 gracefully - create default profile
        if (response.status === 404 || response.status === 401) {
          console.warn(`⚠️ [IDENTITY SLICE] Profile not found (${response.status}), creating Local Default Profile.`);
          this.server_profile_missing = true; // ✅ SET FLAG
          
          // 🛡️ SELF-HEALING: Create default profile locally
          const defaultUser = {
            _id: this.userId,
            username: 'User',
            email: 'user@example.com',
            image: undefined,
            preferences: {
              language: 'en',
              compactMode: false,
              currency: 'USD',
              turboMode: false
            },
            updatedAt: Date.now(),
            
            // 🔐 LICENSE & SECURITY FIELDS (V6.2 Default Values)
            plan: 'free',
            offlineExpiry: 0,
            riskScore: 0,
            receiptId: null,
            licenseSignature: null,
            isMigrated: true // ✅ MIGRATION FLAG
          };
          
          // Normalize user data
          const normalizedDefaultUser = normalizeUser(defaultUser, this.userId);
          if (!normalizedDefaultUser) {
            throw new Error('Default profile normalization failed');
          }
          
          console.log('✅ [IDENTITY SLICE] Default profile created successfully');
          
          // 🛡️ REGISTER USER ON SERVER: Stop 404 loop
          try {
            const pushResponse = await fetch('/api/user/profile', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: this.userId,
                profile: normalizedDefaultUser,
                action: 'register_default'
              })
            });
            if (pushResponse.ok) {
              console.log('✅ [IDENTITY] Default profile registered on server successfully');
            }
          } catch (e) {
            console.error('⚠️ [IDENTITY] Failed to register profile on server, will retry next boot');
          }
          
          return { 
            success: true, 
            user: normalizedDefaultUser,
            error: undefined 
          };
        }
        throw new Error(`Failed to fetch user profile: ${response.statusText}`);
      }
      
      const serverUser = await response.json();
      
      // Map server fields to LocalUser interface
      const localUser = {
        _id: serverUser._id || this.userId,
        username: serverUser.username || '',
        email: serverUser.email || '',
        image: serverUser.image || undefined,
        preferences: serverUser.preferences || {
          language: 'en',
          compactMode: false,
          currency: 'USD',
          turboMode: false
        },
        updatedAt: serverUser.updatedAt || Date.now(),
        
        // 🔐 LICENSE & SECURITY FIELDS
        plan: serverUser.plan || 'free',
        offlineExpiry: serverUser.offlineExpiry || 0,
        riskScore: serverUser.riskScore || 0,
        receiptId: serverUser.receiptId || null
      };
      
      // Normalize user data
      const normalizedUser = normalizeUser(localUser, this.userId);
      if (!normalizedUser) {
        throw new Error('User profile normalization failed');
      }
      
      console.log('✅ [IDENTITY SLICE] User profile processed successfully');
      return { 
        success: true, 
        user: normalizedUser,
        server_profile_missing: this.server_profile_missing, // ✅ INCLUDE FLAG
        error: undefined 
      };
      
    } catch (error) {
      console.error('❌ [IDENTITY SLICE] Failed to hydrate user profile:', error);
      return { 
        success: false, 
        error: String(error)
      };
    }
  }
}
