"use client";

/**
 * 🏛️ SOVEREIGN USER DOMAIN - UserManager (Skeleton)
 * -------------------------------------------------
 * Unified User Management System - Single Source of Truth
 * 
 * Merges: IdentityManager + SessionManager + IdentitySlice
 * 
 * Properties Consolidated:
 * - IdentityManager: userId, isReady, subscribers, readyCallbacks
 * - SessionManager: sessionCache, deviceFingerprint
 * - IdentitySlice: server_profile_missing (hydration state)
 */

export class UserManager {
  // 🆕 SINGLETON INSTANCE
  private static instance: UserManager | null = null;

  // 📋 IDENTITY PROPERTIES (from IdentityManager)
  private userId: string | null = null; // ✅ KEPT: null for type safety
  private currentUser: any = null; // ✅ ADDED: Memory cache for full user object
  private isReady: boolean = false;
  private identityEventDispatched: boolean = false; // 🛡️ PREVENT MULTIPLE DISPATCHES
  private subscribers: Set<(userId: string | null) => void> = new Set();
  private readyCallbacks: Set<() => void> = new Set();

  // 📋 SESSION PROPERTIES (from SessionManager)
  private sessionCache: Map<string, any> = new Map();
  private deviceFingerprint: string = '';

  // 📋 HYDRATION PROPERTIES (from IdentitySlice)
  private server_profile_missing: boolean = false;

  /**
   * 🏛️ SINGLETON PATTERN - Get Instance
   * Ensures single source of truth across the application
   */
  public static getInstance(): UserManager {
    if (!UserManager.instance) {
      UserManager.instance = new UserManager();
    }
    return UserManager.instance;
  }

  /**
   * 🏛️ PRIVATE CONSTRUCTOR - Singleton Enforcement
   * Prevents direct instantiation
   */
  private constructor() {
    // Initialization logic will be added later
  }

  // ======== GETTER METHODS (Skeleton) ========

  /**
   * ✅ IS READY
   * Returns true if user identity is fully established
   */
  public isUserReady(): boolean {
    return this.isReady;
  }

  /**
   *  HAS VALID SESSION
   * Returns true if a valid session exists
   */
  public hasValidSession(): boolean {
    return this.sessionCache.size > 0;
  }

  /**
   * ⚠️ SERVER PROFILE MISSING
   * Returns true if server profile hydration failed
   */
  public isServerProfileMissing(): boolean {
    return this.server_profile_missing;
  }

  /**
   * 🧑 HYDRATE USER PROFILE
   * Fetches user profile from server and returns processed user object
   * Copied and adapted from IdentitySlice.ts:28
   */
  public async hydrateUserProfile(): Promise<{ success: boolean; user?: any; error?: string; server_profile_missing?: boolean }> {
    try {
      console.log('🧑 [USER MANAGER] Fetching user profile from server...');
      
      if (!this.userId) {
        throw new Error('Cannot hydrate user profile: userId is null');
      }
      
      const { PushService } = await import('../../services/PushService');
      const pushService = PushService.getInstance();
      const profileResult = await pushService.getUserProfile(this.userId);
      
      if (!profileResult.success) {
        // 🛡️ ABSOLUTE IDENTITY LAW: No skeleton users - fail hard if profile missing
        console.error(`🚨 [USER MANAGER] Profile fetch failed: ${profileResult.error}`);
        this.server_profile_missing = true;
        
        return { 
          success: false, 
          error: profileResult.error || 'Profile fetch failed',
          server_profile_missing: true
        };
      }
      
      const responseData = profileResult.data;
      const serverUser = responseData?.user || responseData;
      
      // Map server fields to LocalUser interface
      const localUser = {
        _id: serverUser?._id || serverUser?.id || this.userId,
        // 🛡️ CRITICAL: If server has no username, hydration must fail
        username: serverUser?.username || serverUser?.displayName,
        email: serverUser?.email || '',
        image: serverUser?.image || undefined,
        preferences: serverUser?.preferences || {
          language: 'en',
          compactMode: false,
          currency: 'USD',
          turboMode: false
        },
        updatedAt: serverUser?.updatedAt || Date.now(),
        
        // 🔐 LICENSE & SECURITY FIELDS
        plan: serverUser?.plan || 'free',
        offlineExpiry: serverUser?.offlineExpiry || 0,
        riskScore: serverUser?.riskScore || 0,
        receiptId: serverUser?.receiptId || null
      };
      
      // 🛡️ NO DEFAULT NAMES: If username is missing, hydration must fail
      if (!localUser.username) {
        throw new Error('HYDRATION_FAILURE: Server response missing username - Pathor Standard requires valid username');
      }
      
      // Normalize user data
      const { normalizeUser } = await import('../../core/VaultUtils');
      const normalizedUser = normalizeUser(localUser, this.userId);
      if (!normalizedUser) {
        throw new Error('User profile normalization failed');
      }
      
      console.log('✅ [USER MANAGER] User profile processed successfully');
      
      // 🛡️ PERSIST TO DEXIE: Ensure the profile is available offline
      const { db } = await import('@/lib/offlineDB');
      await db.users.put(normalizedUser);
      console.log('✅ [USER MANAGER] Profile persisted to Dexie for offline access');
      
      return { 
        success: true, 
        user: normalizedUser,
        server_profile_missing: this.server_profile_missing, // ✅ INCLUDE FLAG
        error: undefined 
      };
      
    } catch (error) {
      console.error('🚨 [USER MANAGER] User profile hydration failed:', error);
      return { 
        success: false, 
        error: String(error),
        server_profile_missing: this.server_profile_missing
      };
    }
  }

  // ======== SETTER METHODS (Skeleton) ========

  /**
   * 🔄 UPDATE IDENTITY: Bridge login-memory gap for instant UI updates
   * Updates memory cache and hydrates store immediately without async operations
   * This is called immediately after successful login to prevent UI flicker
   */
  public updateIdentity(user: any): void {
    if (!user || !user._id) {
      console.error('🚨 [USER MANAGER] updateIdentity: Invalid user object');
      return;
    }

    try {
      console.log('🔄 [USER MANAGER] Updating identity for instant UI:', user._id);
      
      // 1. Update memory cache immediately (synchronous)
      this.userId = user._id;
      this.currentUser = user;
      
      // 2. Broadcast identity change to entire system
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('identity-established', { 
          detail: { user, timestamp: Date.now() }
        }));
        console.log('📡 [USER MANAGER] Identity update event broadcasted');
      }
      
      // 3. Notify subscribers
      this.notifySubscribers();
      
      console.log('✅ [USER MANAGER] Identity updated instantly - No UI flicker');
    } catch (error) {
      console.error('🚨 [USER MANAGER] Failed to update identity:', error);
    }
  }

  /**
   * 💧 HYDRATE STORE: Immediate store hydration without async operations
   * Updates Zustand store state synchronously to prevent UI flicker
   */
  private hydrateStore(user: any): void {
    try {
      // Import and update store immediately
      const { useVaultStore } = require('@/lib/vault/store/index');
      useVaultStore.setState({
        userId: user._id,
        currentUser: user
      });
      console.log('✅ [USER MANAGER] Store hydrated immediately');
    } catch (error) {
      console.warn('🚨 [USER MANAGER] Store hydration failed:', error);
    }
  }

  /**
   * 🔄 SET IDENTITY: Single entry point for Login/Register success
   * This is the ONLY method that should be called after successful authentication
   */
  public async setIdentity(user: any): Promise<void> {
    if (!user || !user._id) {
      console.error('🚨 [USER MANAGER] setIdentity: Invalid user object');
      return;
    }

    try {
      console.log('🔄 [USER MANAGER] Setting identity for user:', user._id);
      
      // 1. Update memory cache (both userId and currentUser)
      this.userId = user._id;
      this.currentUser = user;
      
      // 2. Store session
      this.storeSession(user);
      
      // 3. Write user to Dexie
      const { db } = await import('@/lib/offlineDB');
      await db.users.put(user);
      console.log('✅ [USER MANAGER] User persisted to Dexie');
      
      // 4. Broadcast identity change to entire system
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('identity-established', { 
          detail: { user, timestamp: Date.now() }
        }));
        console.log('📡 [USER MANAGER] Identity established event broadcasted');
      }
      
      // 5. Mark as ready
      this.isReady = true;
      
      // 6. Notify subscribers
      this.notifySubscribers();
      
      console.log('✅ [USER MANAGER] Identity set successfully - User is ready');
    } catch (error) {
      console.error('🚨 [USER MANAGER] Failed to set identity:', error);
      this.userId = null;
      this.isReady = false;
    }
  }

  /**
   * ✅ SET READY STATE
   * Sets the identity ready state
   */
  public setReadyState(ready: boolean): void {
    this.isReady = ready;
  }

  /**
   * 📱 SET DEVICE FINGERPRINT
   * Sets the device fingerprint
   */
  public setDeviceFingerprint(fingerprint: string): void {
    this.deviceFingerprint = fingerprint;
  }

  /**
   * ⚠️ SET SERVER PROFILE MISSING
   * Sets the server profile missing flag
   */
  public setServerProfileMissing(missing: boolean): void {
    this.server_profile_missing = missing;
  }

  // ======== SUBSCRIPTION METHODS (Skeleton) ========

  /**
   * 📡 SUBSCRIBE TO USER CHANGES
   * Subscribe to user ID changes (from IdentityManager)
   */
  public subscribe(callback: (userId: string | null) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * 🔍 VERIFY SESSION: Validate current session
   * Copied and adapted from SessionManager
   */
  public async verifySession(): Promise<boolean> {
    const session = this.getStoredSession();
    if (!session) return false;

    const isExpired = Date.now() > session.expiresAt;
    if (isExpired) {
      this.clearAll();
      return false;
    }

    const currentUserId = this.getUserId();
    if (currentUserId && currentUserId === session.userId) return true;
    if (!currentUserId && !isExpired) return true;
    if (currentUserId && currentUserId !== session.userId) return true;

    return true;
  }

  /**
   * 🚀 ON READY
   * Execute callback when user identity is ready (from IdentityManager)
   */
  public onReady(callback: () => void): void {
    if (this.isReady) {
      callback();
    } else {
      this.readyCallbacks.add(callback);
    }
  }

  // ======== SESSION METHODS (Skeleton) ========

  /**
   * �️ GET STORED SESSION: Retrieve from localStorage
   * Copied and adapted from SessionManager.ts:165
   */
  public getStoredSession(): any {
    if (typeof window === 'undefined') return null;
    
    try {
      const stored = localStorage.getItem('cashbookSession');
      if (!stored) return null;
      
      const session = JSON.parse(stored);
      return {
        ...session,
        isValid: true // Default to true, will be verified
      };
    } catch (error) {
      console.warn('🚨 [USER MANAGER] Failed to parse stored session:', error);
      return null;
    }
  }

  /**
   * 💾 STORE SESSION: Save to localStorage
   * Copied and adapted from SessionManager.ts:184
   */
  public storeSession(user: any): void {
    if (typeof window === 'undefined') return;
    
    try {
      // 1. Store full user profile for fast reload recovery
      const userProfile = {
        _id: user._id,
        username: user.username,
        email: user.email,
        image: user.image || "",
        authProvider: user.authProvider,
        categories: user.categories || [],
        currency: user.currency || "USD",
        isVerified: user.isVerified || false,
        createdAt: user.createdAt,
        plan: user.plan || 'free', // ✅ FIXED: Use 'plan' instead of 'proStatus'
        preferences: user.preferences || {}
      };
      
      localStorage.setItem('vault_user_profile', JSON.stringify(userProfile));
      console.log('💾 [USER MANAGER] Full user profile stored to localStorage');
      
      // 2. Store session metadata (existing logic preserved)
      const session = {
        userId: user._id,
        sessionToken: btoa(JSON.stringify({ userId: user._id, timestamp: Date.now() })), // Simple token
        expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
        deviceFingerprint: this.getDeviceFingerprint(),
        lastActivity: Date.now(),
        isValid: true
      };

      localStorage.setItem('cashbookSession', JSON.stringify(session));
      this.sessionCache.set(user._id, session);
      
      console.log('💾 [USER MANAGER] Session stored:', {
        userId: user._id,
        expiresAt: new Date(session.expiresAt).toISOString(),
        deviceFingerprint: session.deviceFingerprint
      });
    } catch (error) {
      console.error('🚨 [USER MANAGER] Failed to store session:', error);
    }
  }

  /**
   * � SYNCHRONOUS HINT (0ms): Check localStorage immediately
   * Copied and adapted from SessionManager.ts:56
   */
  public hasSessionHint(): boolean {
    if (typeof window === 'undefined') return false;
    
    try {
      const session = this.getStoredSession();
      if (!session) return false;
      
      // Quick validation without async calls
      const isExpired = Date.now() > session.expiresAt;
      const hasUserId = !!session.userId;
      
      console.log('🚀 [USER MANAGER] Synchronous hint check:', {
        hasSession: true,
        isExpired,
        hasUserId
      });
      
      return !isExpired && hasUserId;
    } catch (error) {
      console.warn('🚨 [USER MANAGER] Session hint check failed:', error);
      return false;
    }
  }

  /**
   * 🚀 PRIORITY CHECK: Should UserManager handle authentication?
   * Copied and adapted from SessionManager.ts:49
   */
  public shouldTakePriority(): boolean {
    return this.isReady && this.hasSessionHint();
  }

  /**
   * 📱 GET DEVICE FINGERPRINT
   * Copied and adapted from SessionManager.ts:141
   */
  public getDeviceFingerprint(): string {
    if (typeof window === 'undefined') return 'server';
    
    // 🚀 CHECK IF DEVICE ID EXISTS
    let deviceId = localStorage.getItem('cashbookDeviceId');
    if (!deviceId) {
      // Generate UUID v4 - stable across reloads
      const newDeviceId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c: string) => {
        const r = crypto.getRandomValues(new Uint8Array(16));
        r[6] = (parseInt(c, 16) & 15) | 64;
        r[8] = (parseInt(c, 16) & 63) | 128;
        return Array.from(r).map(b => b.toString(16)).join('');
      });
      deviceId = newDeviceId;
      localStorage.setItem('cashbookDeviceId', deviceId);
      console.log('📱 [USER MANAGER] Static device ID generated:', deviceId);
    }
    
    this.deviceFingerprint = deviceId || 'fallback-device-id';
    return this.deviceFingerprint;
  }

  // ======== IDENTITY METHODS (Ported from IdentityManager) ========

  /**
   * 🚀 BOOT: One-time startup method to populate memory cache
   * Reads from localStorage once and populates userId and currentUser in memory
   * This ensures getUserId() returns values in 0ms without any I/O operations
   */
  async boot(): Promise<void> {
    if (typeof window === 'undefined') return;
    
    // Only run once
    if (this.userId) {
      console.log('🚀 [USER MANAGER] Already booted - skipping');
      return;
    }
    
    try {
      // 🚀 SET BOOT STATUS: Mark booting process as started
      const { useVaultStore } = await import('@/lib/vault/store/index');
      useVaultStore.setState({ bootStatus: 'IDENTITY_WAIT' });
      console.log('🚀 [USER MANAGER] Boot status set to IDENTITY_WAIT');
      
      // 1. Read from localStorage once
      const savedProfile = localStorage.getItem('vault_user_profile');
      const savedSession = localStorage.getItem('cashbookSession');
      
      if (savedProfile) {
        // 2. Populate memory cache
        const userProfile = JSON.parse(savedProfile);
        this.userId = userProfile._id;
        this.currentUser = userProfile;
        this.isReady = true; // 🛡️ CRITICAL FIX: Set ready state immediately
        
        console.log('🚀 [USER MANAGER] Memory cache populated from localStorage:', {
          userId: this.userId,
          username: userProfile.username
        });
        
        // 🎯 PATHOR ANCHOR: Immediate identity event dispatch
        if (typeof window !== 'undefined' && !this.identityEventDispatched) {
          window.dispatchEvent(new CustomEvent('identity-established', { 
            detail: { user: userProfile, timestamp: Date.now() }
          }));
          this.identityEventDispatched = true;
          console.log('🎯 [USER MANAGER] Identity event dispatched from boot()');
        }
        
        // 3. Hydrate Zustand store immediately
        useVaultStore.setState({
          userId: userProfile._id,
          currentUser: userProfile
        });
        
        console.log('✅ [USER MANAGER] Zustand store hydrated immediately');
      }
      
      if (savedSession && !this.userId) {
        // Fallback to session if profile not found
        const session = JSON.parse(savedSession);
        if (session?.userId) {
          this.userId = session.userId;
          console.log('🚀 [USER MANAGER] Memory cache populated from session fallback:', this.userId);
        }
      }
      
      // 🚀 SET BOOT STATUS: Mark booting process as complete
      useVaultStore.setState({ bootStatus: 'READY' });
      console.log('✅ [USER MANAGER] Boot status set to READY');
      
    } catch (error) {
      console.warn('🚨 [USER MANAGER] Boot failed:', error);
      this.userId = null;
      this.currentUser = null;
      
      // 🚨 SET BOOT STATUS: Mark booting process as failed
      try {
        const { useVaultStore } = await import('@/lib/vault/store/index');
        useVaultStore.setState({ bootStatus: 'IDLE' });
      } catch (storeError) {
        console.error('🚨 [USER MANAGER] Failed to set boot status to IDLE:', storeError);
      }
    }
  }

  /**
   * 🚀 PUBLIC INIT: External initialization method
   * Copied and adapted from IdentityManager.ts:144
   */
  async init(): Promise<void> {
    // 🛡️ MERGE LOGIC: If userId exists, don't reset isReady
    if (this.userId && this.isReady) {
      console.log('🚀 [USER MANAGER] Already initialized - skipping');
      return;
    }
    
    // If userId exists but not ready, just set ready state
    if (this.userId && !this.isReady) {
      this.isReady = true; // 🛡️ SET READY WITHOUT RESET
      console.log('🚀 [USER MANAGER] Setting ready state for existing userId');
      return;
    }
    
    await this.initializeIdentity();
  }

  /**
   * 🎯 GET USER ID: True synchronous method - 0ms memory access only
   * Returns cached userId without any localStorage or JSON.parse operations
   */
  getUserId(): string | null {
    // ✅ SOVEREIGN TRUTH: Return memory-cached ID immediately - NO isReady check
    return this.userId;
  }

  /**
   * 👤 GET CURRENT USER: True synchronous method - 0ms memory access only
   * Returns cached full user object without any localStorage operations
   */
  getCurrentUser(): any {
    // ✅ TRUE SYNCHRONOUS: Return memory-cached user immediately - NO I/O operations
    return this.currentUser;
  }

  /**
   * ⏳ WAIT FOR IDENTITY: Promise-based identity readiness
   * Copied and adapted from IdentityManager.ts:493
   */
  async waitForIdentity(): Promise<string> {
    return new Promise((resolve, reject) => {
      // 🛡️ SOVEREIGN TRUTH: If userId exists, resolve immediately
      if (this.userId) {
        this.isReady = true; // 🛡️ SET READY STATE
        resolve(this.userId);
        return;
      }
      
      // 🛡️ 10-SECOND GATE: Absolute Identity Law requirement
      const timeout = 10000; // 10 seconds
      const startTime = Date.now();
      
      // Wait for ready state with timeout
      const checkReady = () => {
        if (this.isReady && this.userId) {
          resolve(this.userId);
          return;
        }
        
        // Check timeout
        if (Date.now() - startTime >= timeout) {
          console.error('🚨 [USER MANAGER] Identity gate timeout - no real user data found');
          reject(new Error('IDENTITY_GATE_TIMEOUT: No user data available after 10 seconds'));
          return;
        }
        
        setTimeout(checkReady, 100);
      };
      checkReady();
    });
  }

  /**
   * 🚀 INITIALIZE IDENTITY: Core async logic that reads from Dexie and localStorage
   * Copied and adapted from IdentityManager.ts:35 with SessionManager integration
   */
  private async initializeIdentity(): Promise<void> {
    if (typeof window === 'undefined') {
      this.userId = null;
      this.isReady = false;
      return;
    }

    // 🚀 SESSION PRIORITY CHECK: Should we prioritize session or Dexie?
    if (this.hasSessionHint()) {
      console.log('🚀 [USER MANAGER] Session hint detected, prioritizing session-based identity');
      await this.initializeFromSession();
      return;
    }

    // 🚀 MEMORY ANCHOR: Synchronous localStorage check BEFORE any async work
    try {
      const saved = localStorage.getItem('vault_user_profile'); // 🛡️ UNIFIED KEY
      if (saved) {
        const userData = JSON.parse(saved);
        const localStorageUserId = userData._id || null;
        
        if (localStorageUserId) {
          // �️ SOVEREIGN TRUTH: Don't reset if userId already exists
          if (!this.userId) {
            // �� IMMEDIATE SET: Set userId and update Zustand store BEFORE any await calls
            this.userId = localStorageUserId;
            this.isReady = true; // 🛡️ ABSOLUTE ANCHOR: userId is our absolute anchor
            console.log('🚀 [USER MANAGER] Memory anchor established IMMEDIATELY from localStorage:', this.userId);
          }
          
          // 🚀 ATOMIC STORE INJECTION: Immediate Zustand update to prevent race condition
          try {
            const { useVaultStore } = await import('@/lib/vault/store/index');
            useVaultStore.setState({ 
              userId: localStorageUserId,
              currentUser: JSON.parse(saved),
              isAuthenticated: true // ✅ IMMEDIATE AUTH STATE SET
            });
            console.log('🚀 [USER MANAGER] Atomic store injection completed - Race condition prevented');
          } catch (error) {
            console.warn('🚨 [USER MANAGER] Immediate store injection failed:', error);
          }
        }
      }
    } catch (error) {
      console.warn('🚨 [USER MANAGER] Failed to read localStorage for memory anchor:', error);
    }

    try {
      // 🎯 PRIMARY SOURCE: Read from Dexie users table FIRST
      const { db } = await import('@/lib/offlineDB');
      const users = await db.users.limit(1).toArray();
      
      if (users.length > 0 && users[0]._id) {
        // 🔐 AUTHORITY LOCK: Check if user has valid username
        if (users[0].username && users[0].username !== '') {
          // ✅ USER EXISTS WITH USERNAME: Set identity immediately from Dexie and STOP
          this.userId = users[0]._id;
          this.isReady = true;
          console.log('✅ [USER MANAGER] User with valid username loaded from Dexie:', { userId: this.userId, username: users[0].username });
          
          // 🎯 PATHOR ANCHOR: Notify store via event (decoupled)
          if (typeof window !== 'undefined' && !this.identityEventDispatched) {
            window.dispatchEvent(new CustomEvent('identity-established', { detail: { user: users[0] } }));
            this.identityEventDispatched = true; // 🛡️ SET FLAG TO PREVENT MULTIPLE DISPATCHES
            console.log('🎯 [USER MANAGER] Pathor Anchor deployed - Identity event dispatched');
          }
          
          // Update localStorage for persistence
          this.persistToStorage(this.userId);
          this.notifyReadyCallbacks();
          this.notifySubscribers();
          return; // 🛑 STOP - No further API calls needed
          
        } else {
          // ⚠️ USER EXISTS BUT NO USERNAME: Keep gate open, trigger background sync
          console.warn('⚠️ [USER MANAGER] User found in Dexie but missing username - will trigger background sync');
          this.userId = users[0]._id; // Set ID but keep isReady = true
          this.isReady = true; // 🛡️ KEEP GATE OPEN: userId is enough
          this.server_profile_missing = true; // Mark for background sync
        }
      }
      
      // 🚨 FALLBACK: Check localStorage as backup
      const saved = localStorage.getItem('vault_user_profile'); // 🛡️ UNIFIED KEY
      let localStorageUserId = null;
      
      if (saved) {
        const userData = JSON.parse(saved);
        localStorageUserId = userData._id || null;
        console.log(`🔐 [USER MANAGER] Loaded from storage:`, {
          userId: localStorageUserId,
          source: 'localStorage'
        });
      }
      
      // 🚨 IMMEDIATE SET: Set userId the moment it's found from localStorage
      if (localStorageUserId) {
        // 🚨 CRITICAL FIX: SET ID AND READY STATE IMMEDIATELY
        this.userId = localStorageUserId;
        this.isReady = true; // 🛡️ ABSOLUTE ANCHOR: userId is enough for readiness
        console.log('🔐 [USER MANAGER] Memory anchor established IMMEDIATELY from localStorage:', this.userId);
        
        // 🚨 DEXIE VERIFICATION: Background check (non-blocking)
        const dexieUser = await db.users.get(localStorageUserId);
        
        // 🛡️ [PATHOR LOGIC] Check for existing user
        let userToAnchor = dexieUser;
        
        if (!dexieUser) {
            // 🛡️ BACKGROUND SYNC: Trigger background sync instead of failure
            console.warn('⚠️ [USER MANAGER] User not found in Dexie - triggering background sync');
            // Keep isReady = true, trigger background hydration
            this.server_profile_missing = true;
            // Notify store that we need profile hydration
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('identity-needs-hydration', { 
                detail: { userId: localStorageUserId }
              }));
            }
            return;
        }
        
        if (userToAnchor && userToAnchor.username) {
            // ✅ USER WITH USERNAME: Update currentUser
            this.currentUser = userToAnchor;
            console.log('✅ [USER MANAGER] Full profile loaded from Dexie:', userToAnchor.username);
            
            // 🎯 PATHOR ANCHOR: Notify store via event (decoupled)
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('identity-established', { detail: { user: userToAnchor } }));
            }
            
            this.notifyReadyCallbacks();
            this.notifySubscribers();
        } else {
            // ⚠️ INCOMPLETE USER: Keep gate open, trigger background sync
            this.server_profile_missing = true;
            console.warn('⚠️ [USER MANAGER] Incomplete user profile - will hydrate from server');
            // Keep isReady = true, userId is enough for operations
          }
      } else {
        // 🚨 NO USER FOUND: Clear identity
        this.userId = null;
        this.isReady = false;
        console.log('🚨 [USER MANAGER] No user found in any storage');
      }
    } catch (error) {
      console.error('🚨 [USER MANAGER] Failed to initialize identity:', error);
      this.userId = null;
      this.isReady = false;
    }
  }

  /**
   * 🚀 INITIALIZE FROM SESSION: Session-based identity initialization
   * New method for SessionManager integration
   */
  private async initializeFromSession(): Promise<void> {
    try {
      const session = this.getStoredSession();
      if (session && session.userId) {
        this.userId = session.userId;
        console.log('🚀 [USER MANAGER] Identity initialized from session:', this.userId);
        
        // Verify user exists in Dexie
        const { db } = await import('@/lib/offlineDB');
        const user = await db.users.get(session.userId);
        
        if (user && user.username) {
          this.isReady = true;
          console.log('✅ [USER MANAGER] Session user verified in Dexie - READY');
          
          // Notify store via event (decoupled)
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('identity-established', { detail: { user } }));
          }
          
          this.notifyReadyCallbacks();
          this.notifySubscribers();
        } else {
          console.warn('⚠️ [USER MANAGER] Session user not found in Dexie - will hydrate');
          this.isReady = false;
        }
      }
    } catch (error) {
      console.error('🚨 [USER MANAGER] Failed to initialize from session:', error);
      this.userId = null;
      this.isReady = false;
    }
  }

  // ======== UTILITY METHODS (Skeleton) ========

  /**
   * 🧹 CLEAR ALL
   * Clear all user data (logout) - Hard logout logic
   * Copied and adapted from SessionManager.ts:212
   */
  public clearAll(): void {
    if (typeof window === 'undefined') return;
    
    try {
      // Clear localStorage
      localStorage.removeItem('cashbookSession');
      localStorage.removeItem('vault_user_profile'); // 🛡️ UNIFIED KEY
      
      // Clear session cache
      this.sessionCache.clear();
      
      // Clear identity state
      this.userId = null;
      this.currentUser = null;
      this.isReady = false;
      this.server_profile_missing = false;
      this.identityEventDispatched = false; // Reset event flag
      
      // Broadcast identity cleared to entire system
      window.dispatchEvent(new CustomEvent('identity-cleared', { 
        detail: { timestamp: Date.now() }
      }));
      console.log('📡 [USER MANAGER] Identity cleared event broadcasted');
      
      // Notify subscribers of logout
      this.notifySubscribers();
      
      console.log('🗑️ [USER MANAGER] All user data cleared - Hard logout complete');
    } catch (error) {
      console.error('🚨 [USER MANAGER] Failed to clear user data:', error);
    }
  }

  /**
   * 💾 PERSIST TO STORAGE: Save user data to localStorage
   * Helper method for identity persistence
   */
  private persistToStorage(userId: string | null): void {
    try {
      if (typeof window === 'undefined') return;
      
      if (userId) {
        // Get existing user data to preserve other fields
        const existingData = localStorage.getItem('vault_user_profile'); // 🛡️ UNIFIED KEY
        const userData = existingData ? JSON.parse(existingData) : {};
        
        // Update only the _id field
        userData._id = userId;
        localStorage.setItem('vault_user_profile', JSON.stringify(userData)); // 🛡️ UNIFIED KEY
      } else {
        // Remove user data
        localStorage.removeItem('vault_user_profile'); // 🛡️ UNIFIED KEY
      }
    } catch (error) {
      console.error('🚨 [USER MANAGER] Failed to persist to storage:', error);
    }
  }

  /**
   * 💾 PERSIST TO DEXIE: Save user data to database
   * Helper method for database persistence
   */
  private async persistToDexie(userId: string, user?: any): Promise<void> {
    try {
      const { db } = await import('@/lib/offlineDB');
      
      if (user) {
        // Full user object provided - persist it
        await db.users.put(user);
        console.log('✅ [USER MANAGER] User persisted to Dexie:', userId);
      } else {
        // Only userId provided - check if user exists
        const existingUser = await db.users.get(userId);
        if (!existingUser) {
          // 🛡️ NO SKELETONS: Do NOT create empty user records
          // Let SyncOrchestrator handle server fetch instead
          console.warn('⚠️ [USER MANAGER] User not found in Dexie, will hydrate from server');
          return;
        }
        console.log('✅ [USER MANAGER] User already exists in Dexie:', userId);
      }
    } catch (error) {
      console.error('🚨 [USER MANAGER] Failed to persist to Dexie:', error);
    }
  }

  /**
   * 📢 NOTIFY READY CALLBACKS: Execute all ready callbacks
   * Helper method for ready state notifications
   */
  private notifyReadyCallbacks(): void {
    this.readyCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('🚨 [USER MANAGER] Ready callback error:', error);
      }
    });
    this.readyCallbacks.clear();
  }

  /**
   * 📢 NOTIFY SUBSCRIBERS: Notify all subscribers of user changes
   * Helper method for subscription notifications
   */
  private notifySubscribers(): void {
    this.subscribers.forEach(callback => {
      try {
        callback(this.userId);
      } catch (error) {
        console.error('🚨 [USER MANAGER] Subscriber callback error:', error);
      }
    });
  }

  /**
   * 📊 GET STATUS
   * Get current user status for debugging
   */
  public getStatus(): {
    userId: string | null;
    isReady: boolean;
    hasSession: boolean;
    deviceFingerprint: string;
    serverProfileMissing: boolean;
    subscriberCount: number;
    readyCallbackCount: number;
  } {
    return {
      userId: this.userId,
      isReady: this.isReady,
      hasSession: this.hasValidSession(),
      deviceFingerprint: this.deviceFingerprint,
      serverProfileMissing: this.server_profile_missing,
      subscriberCount: this.subscribers.size,
      readyCallbackCount: this.readyCallbacks.size
    };
  }
}

// 📋 EXPORT TYPE FOR TYPESCRIPT CONSUMERS
export type UserSubscriber = (userId: string | null) => void;
export type ReadyCallback = () => void;

// 🛡️ ABSOLUTE IDENTITY SOVEREIGNTY: Global window reference
if (typeof window !== 'undefined') { 
  (window as any).__SOVEREIGN_ID__ = UserManager.getInstance(); 
}
