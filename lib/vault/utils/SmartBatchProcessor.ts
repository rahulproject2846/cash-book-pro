/**
 * Smart Batch Processor - Intelligent batching with network awareness
 * Shared utility for both PushService and PullService
 */
import { getVaultStore } from '../store/storeHelper';

export class SmartBatchProcessor<T> {
  private readonly DEFAULT_BATCH_SIZE = 10;
  private readonly LARGE_PAYLOAD_THRESHOLD = 10240; // 10KB in bytes
  private retryCount = 0;
  private readonly MAX_RETRIES = 3;

  /**
   * Create intelligent batches based on JSON payload size and network conditions
   */
  createSmartBatches(items: T[]): T[][] {
    const store = getVaultStore();
    const networkMode = store.networkMode;
    
    // 🚀 NETWORK-AWARE BATCH SIZE ADJUSTMENT
    let batchSize = this.DEFAULT_BATCH_SIZE;
    if (networkMode === 'DEGRADED') {
      batchSize = Math.floor(this.DEFAULT_BATCH_SIZE * 0.5); // Reduce by 50%
    }
    
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const jsonSize = JSON.stringify(item).length;
      if (jsonSize > this.LARGE_PAYLOAD_THRESHOLD) {
        batches.push([item]);
      } else {
        let currentBatch = batches[batches.length - 1];
        if (!currentBatch || currentBatch.length >= batchSize) {
          currentBatch = [];
          batches.push(currentBatch);
        }
        currentBatch.push(item);
      }
    }
    return batches;
  }

  /**
   * Calculate optimal delay based on server response time and network conditions
   */
  calculateOptimalDelay(previousResponseTime: number, previousFailed: boolean): number {
    const store = getVaultStore();
    const networkMode = store.networkMode;
    
    // 🚀 NETWORK-AWARE BASE DELAY
    let baseDelay = 2000; // 2 seconds
    if (networkMode === 'DEGRADED') {
      baseDelay *= 2; // Double delay for degraded networks
    }
    
    const SLOW_RESPONSE_THRESHOLD = 3000; // 3 seconds
    const SLOW_RESPONSE_DELAY = 5000; // 5 seconds
    
    // 🔄 EXPONENTIAL BACKOFF FOR FAILURES
    if (previousFailed) {
      this.retryCount++;
      const backoffDelay = baseDelay * Math.pow(2, Math.min(this.retryCount, this.MAX_RETRIES));
      return Math.min(backoffDelay, 30000); // Cap at 30 seconds
    }
    
    // 🔄 RESET RETRY COUNT ON SUCCESS
    this.retryCount = 0;
    
    if (previousResponseTime > SLOW_RESPONSE_THRESHOLD) {
      return SLOW_RESPONSE_DELAY;
    }
    
    return baseDelay;
  }

  /**
   * Reset retry count (call on successful batch completion)
   */
  resetRetryCount(): void {
    this.retryCount = 0;
  }
}
