"use client";

import { getVaultStore } from '../store/storeHelper';

/**
 * Shared Sync Progress Tracker - State management integration
 * Used by both PushService and PullService for consistency
 */
export class SyncProgressTracker {
  private currentBatch = 0;
  private totalBatches = 0;
  private totalItems = 0;
  private processedItems = 0;
  private startTime = Date.now();
  private lastProgressUpdate = 0;
  private readonly PROGRESS_THROTTLE_MS = 1000; // Throttle updates to once per second
  private readonly BATCH_UPDATE_INTERVAL = 5; // Update after every 5 batches
  
  // 🎯 WEIGHTED MOVING AVERAGE FOR ETA CALCULATION
  private recentProcessingTimes: number[] = [];
  private readonly MAX_HISTORY_SIZE = 10; // Keep last 10 processing times

  start(totalItems: number): void {
    this.totalItems = totalItems;
    this.processedItems = 0;
    this.currentBatch = 0;
    this.startTime = Date.now();
    this.lastProgressUpdate = 0;
    this.recentProcessingTimes = []; // Reset history
    
    // 📊 UPDATE ZUSTAND STATE
    const store = getVaultStore();
    store.updateSyncStats({
      totalSynced: 0,
      totalFailed: 0,
      lastSyncDuration: null
    });
    store.setSyncStatus('syncing');
  }

  updateBatch(batchNumber: number, batchSize: number): void {
    this.currentBatch = batchNumber;
    this.processedItems += batchSize;
    
    // Throttle progress updates to prevent excessive state updates
    const now = Date.now();
    if (now - this.lastProgressUpdate < this.PROGRESS_THROTTLE_MS && batchNumber % this.BATCH_UPDATE_INTERVAL !== 0) {
      return; // Skip update if recently updated and not a batch interval
    }
    this.lastProgressUpdate = now;
    
    // 🎯 IMPROVED ETA CALCULATION USING WEIGHTED MOVING AVERAGE
    const batchProcessingTime = now - this.startTime;
    this.recentProcessingTimes.push(batchProcessingTime);
    
    // Keep only recent history
    if (this.recentProcessingTimes.length > this.MAX_HISTORY_SIZE) {
      this.recentProcessingTimes.shift();
    }
    
    let estimatedRemaining = 0;
    if (this.processedItems > 0 && this.recentProcessingTimes.length > 0) {
      // Calculate weighted average processing time
      const weights = this.recentProcessingTimes.map((_, index) => index + 1); // Linear weighting
      const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
      const weightedAverage = this.recentProcessingTimes.reduce((sum, time, index) => sum + time * weights[index], 0) / totalWeight;
      
      // Calculate remaining batches and time
      const remainingItems = this.totalItems - this.processedItems;
      const avgItemsPerBatch = this.processedItems / this.currentBatch;
      const remainingBatches = Math.ceil(remainingItems / avgItemsPerBatch);
      estimatedRemaining = weightedAverage * remainingBatches;
    }
    
    const progress = (this.processedItems / this.totalItems) * 100;
    const elapsed = Date.now() - this.startTime;
    
    const store = getVaultStore();
    store.updateSyncStats({
      totalSynced: this.processedItems,
      totalFailed: store.syncStats.totalFailed,
      lastSyncDuration: elapsed
    });
    store.setSyncProgress({
      total: this.totalItems,
      processed: this.processedItems,
      percentage: progress,
      eta: estimatedRemaining / 1000
    });
  }

  recordFailure(): void {
    const store = getVaultStore();
    store.updateSyncStats({
      totalSynced: this.processedItems,
      totalFailed: store.syncStats.totalFailed + 1,
      lastSyncDuration: store.syncStats.lastSyncDuration
    });
  }

  complete(): void {
    const totalTime = Date.now() - this.startTime;
    
    const store = getVaultStore();
    store.updateSyncStats({
      totalSynced: this.processedItems,
      totalFailed: store.syncStats.totalFailed,
      lastSyncDuration: totalTime
    });
    store.setSyncStatus('success');
    store.updateLastSyncedAt();
  }

  error(): void {
    const store = getVaultStore();
    store.setSyncStatus('error');
  }
}
