"use client";

import { LocalUser } from '@/lib/offlineDB';

/**
 * 🔒 RISK MANAGER - Security & Tampering Detection
 * Implements time-based access control and risk scoring
 */
export class RiskManager {
  private static readonly STORAGE_KEY = 'vault_secure_timestamp';
  private static readonly MAX_RISK_THRESHOLD = 80; // 🎯 UNIFIED THRESHOLD
  
  /**
   * 🕒 CHECK TIME TAMPERING
   */
  static checkTimeTampering(): boolean {
    const lastKnownTime = localStorage.getItem(RiskManager.STORAGE_KEY);
    const currentTime = Date.now();
    
    if (!lastKnownTime) {
      // First time user accesses the system
      localStorage.setItem(RiskManager.STORAGE_KEY, currentTime.toString());
      return false;
    }
    
    const timeDiff = currentTime - parseInt(lastKnownTime);
    const tamperingThreshold = 300000; // 5 minutes
    
    if (timeDiff < -tamperingThreshold) {
      // User moved clock back (tampering detected)
      return true;
    }
    
    // Update current timestamp
    localStorage.setItem(RiskManager.STORAGE_KEY, currentTime.toString());
    return false;
  }
  
  /**
   * 📊 CALCULATE RISK SCORE
   */
  static calculateRiskScore(user: LocalUser): number {
    let score = 0;
    
    // Plan-based scoring
    if (user.plan === 'pro') {
      score += 50;
    }
    
    // Expiry-based scoring
    if (user.offlineExpiry && user.offlineExpiry > 0) {
      const expiryDate = new Date(user.offlineExpiry);
      const now = new Date();
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilExpiry <= 7) {
        score += 30; // Expires within 7 days
      } else if (daysUntilExpiry <= 30) {
        score += 15; // Expires within 30 days
      }
    }
    
    return Math.min(score, 100);
  }

  /**
   * 🚨 LOCKDOWN ENFORCEMENT
   * Determines if user should be locked down due to high risk
   */
  static isLockdown(user: LocalUser): boolean {
    const riskScore = RiskManager.calculateRiskScore(user);
    return riskScore > RiskManager.MAX_RISK_THRESHOLD;
  }

  /**
   * 🚀 ASYNC RISK EVALUATION (V6.3)
   * Fetches user and evaluates risk asynchronously
   */
  static async evaluateRiskAsync(userId: string): Promise<{ score: number; isLockdown: boolean }> {
    try {
      const { db } = await import('@/lib/offlineDB');
      const user = await db.users.get(userId);
      
      if (!user) {
        console.warn('📊 [RISK] User not found for async evaluation');
        return { score: 0, isLockdown: false };
      }

      // Use existing synchronous logic
      const score = RiskManager.calculateRiskScore(user);
      const isLockdown = score > RiskManager.MAX_RISK_THRESHOLD;
      
      return { score, isLockdown };
      
    } catch (error) {
      console.error('📊 [RISK] Async evaluation failed:', error);
      return { score: 0, isLockdown: false };
    }
  }

  /**
   * ⚡ GET HIGH RISK USER COUNT (V6.3)
   * Uses riskScore index for efficient counting
   */
  static async getHighRiskUserCount(): Promise<number> {
    try {
      const { db } = await import('@/lib/offlineDB');
      
      // 🎯 INDEXED QUERY: Uses riskScore index efficiently
      const highRiskCount = await db.users
        .where('riskScore')
        .above(RiskManager.MAX_RISK_THRESHOLD)
        .count();
        
      console.log(`⚡ [RISK] Found ${highRiskCount} high-risk users using indexed query`);
      return highRiskCount;
      
    } catch (error) {
      console.error('📊 [RISK] Failed to get high-risk user count:', error);
      return 0;
    }
  }

  /**
   * 📊 GET RISK DISTRIBUTION (V6.3)
   * Returns distribution of users across risk ranges using parallel indexed queries
   */
  static async getRiskDistribution(): Promise<{ low: number; medium: number; high: number; critical: number }> {
    try {
      const { db } = await import('@/lib/offlineDB');
      
      // 🎯 PARALLEL INDEXED QUERIES: Uses riskScore index efficiently
      const [low, medium, high, critical] = await Promise.all([
        db.users.where('riskScore').below(30).count(),
        db.users.where('riskScore').between(30, 60).count(),
        db.users.where('riskScore').between(61, 80).count(),
        db.users.where('riskScore').above(80).count()
      ]);
      
      const distribution = { low, medium, high, critical };
      console.log('📊 [RISK] Risk distribution calculated:', distribution);
      
      return distribution;
      
    } catch (error) {
      console.error('📊 [RISK] Failed to get risk distribution:', error);
      return { low: 0, medium: 0, high: 0, critical: 0 };
    }
  }
}
