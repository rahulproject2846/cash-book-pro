// src/hooks/sync/Telemetry.ts
/**
 * Next-Gen Diagnostic Telemetry Engine
 * 
 * Professional-grade logging system with intelligent insights
 * based on our architectural journey and case studies.
 */

export enum LogCategory {
  SYNC = 'SYNC',
  REALTIME = 'REALTIME', 
  SECURITY = 'SECURITY',
  DATABASE = 'DATABASE',
  UI = 'UI',
  PERFORMANCE = 'PERFORMANCE'
}

export enum LogLevel {
  CRITICAL = 'CRITICAL',
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG'
}

export interface DiagnosticInsight {
  reason: string;
  insight: string;
  solution?: string;
}

export interface LogEntry {
  category: LogCategory;
  message: string;
  data?: any;
  level: LogLevel;
  timestamp: number;
  insight?: DiagnosticInsight;
}

/**
 * Diagnostic Helper - Maps common errors to human-readable insights
 */
const DiagnosticHelper: Record<string, DiagnosticInsight> = {
  // Sync Conflict Cases
  '409': {
    reason: "Data already exists on server.",
    insight: "Conflict Resolver active: Adopting server ID."
  },
  'Duplicate prevented': {
    reason: "Server detected duplicate entry.",
    insight: "Conflict Resolver active: Adopting server ID."
  },
  
  // Database Constraint Cases
  'ConstraintError': {
    reason: "Dexie Unique Index Violation.",
    insight: "Lookup-First Guard prevented a duplicate entry."
  },
  'KeyPath type not indexed': {
    reason: "Dexie query on unindexed field.",
    insight: "Query optimization: Using toArray() + JavaScript filter."
  },
  
  // SSR/Browser Compatibility Cases
  'IndexedDB missing': {
    reason: "Next.js SSR attempting to access Dexie.",
    insight: "Safe SSR bypass: Sync will resume on browser hydration."
  },
  'window is not defined': {
    reason: "Server-side execution accessing browser APIs.",
    insight: "SSR Guard: Browser-only code protected."
  },
  
  // API Validation Cases
  'Creation failed': {
    reason: "Mongoose Schema Validation.",
    insight: "Required fields missing in payload. Check triggerSync logic."
  },
  'cid missing': {
    reason: "Mongoose Schema Validation.",
    insight: "Required 'cid' field missing from entry payload."
  },
  'Fields missing': {
    reason: "API endpoint validation failure.",
    insight: "Required fields not provided in request payload."
  },
  'Solidarity fields missing': {
    reason: "Entry API checksum validation failure.",
    insight: "Missing checksum, title, or other required fields."
  },
  
  // Data Type Mismatch Cases
  '0 books / 169 entries': {
    reason: "Type Mismatch (ObjectId vs String).",
    insight: "Independent Hydration active: Rescuing orphaned records."
  },
  'Invalid user ID format': {
    reason: "MongoDB ObjectId validation failed.",
    insight: "User ID format mismatch: Using string fallback query."
  },
  
  // Network/Realtime Cases
  'Pusher connection failed': {
    reason: "Realtime service connection issue.",
    insight: "Realtime fallback: Manual sync will continue."
  },
  'Network error': {
    reason: "API request failed to reach server.",
    insight: "Offline mode: Local changes queued for retry."
  },
  
  // Performance Cases
  'Sync timeout': {
    reason: "Sync operation exceeded time limit.",
    insight: "Performance optimization: Chunked sync processing."
  },
  'Large dataset detected': {
    reason: "Memory usage threshold exceeded.",
    insight: "Pagination active: Processing in batches."
  }
};

/**
 * Telemetry Engine - Centralized diagnostic logging system
 */
class TelemetryEngine {
  private static instance: TelemetryEngine;
  private logs: LogEntry[] = [];
  private readonly IS_VERBOSE = true; // Set to false for production
  
  private constructor() {}
  
  static getInstance(): TelemetryEngine {
    if (!TelemetryEngine.instance) {
      TelemetryEngine.instance = new TelemetryEngine();
    }
    return TelemetryEngine.instance;
  }
  
  /**
   * Get diagnostic insight for an error
   */
  static getDiagnostic(error: any): DiagnosticInsight | undefined {
    const errorMessage = error?.message || error || '';
    
    // Try exact match first
    if (DiagnosticHelper[errorMessage]) {
      return DiagnosticHelper[errorMessage];
    }
    
    // Try partial matches
    for (const [key, insight] of Object.entries(DiagnosticHelper)) {
      if (errorMessage.includes(key)) {
        return insight;
      }
    }
    
    // Try status code
    if (error?.status) {
      return DiagnosticHelper[error.status.toString()];
    }
    
    return undefined;
  }
  
  /**
   * Unified logging method with CSS styling and insights
   */
  logVault(
    category: LogCategory,
    message: string,
    data?: any,
    level: LogLevel = LogLevel.INFO,
    insight?: DiagnosticInsight
  ): void {
    // Skip non-critical logs in non-verbose mode
    if (!this.IS_VERBOSE && level !== LogLevel.CRITICAL && level !== LogLevel.ERROR) {
      return;
    }
    
    const timestamp = Date.now();
    const logEntry: LogEntry = {
      category,
      message,
      data,
      level,
      timestamp,
      insight
    };
    
    // Store log entry
    this.logs.push(logEntry);
    
    // Keep only last 1000 logs to prevent memory issues
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-1000);
    }
    
    // Console output with CSS styling
    this.outputToConsole(logEntry);
  }
  
  /**
   * Output styled log to console
   */
  private outputToConsole(logEntry: LogEntry): void {
    const { category, message, data, level, timestamp, insight } = logEntry;
    
    // CSS styles for different categories and levels
    const categoryStyles = {
      [LogCategory.SYNC]: 'color: #3B82F6; font-weight: bold; background: #EFF6FF; padding: 2px 6px; border-radius: 4px;',
      [LogCategory.REALTIME]: 'color: #10B981; font-weight: bold; background: #F0FDF4; padding: 2px 6px; border-radius: 4px;',
      [LogCategory.SECURITY]: 'color: #EF4444; font-weight: bold; background: #FEF2F2; padding: 2px 6px; border-radius: 4px;',
      [LogCategory.DATABASE]: 'color: #8B5CF6; font-weight: bold; background: #F5F3FF; padding: 2px 6px; border-radius: 4px;',
      [LogCategory.UI]: 'color: #F59E0B; font-weight: bold; background: #FFFBEB; padding: 2px 6px; border-radius: 4px;',
      [LogCategory.PERFORMANCE]: 'color: #06B6D4; font-weight: bold; background: #F0FDFA; padding: 2px 6px; border-radius: 4px;'
    };
    
    const levelStyles = {
      [LogLevel.CRITICAL]: 'color: #DC2626; font-weight: bold;',
      [LogLevel.ERROR]: 'color: #EF4444; font-weight: bold;',
      [LogLevel.WARN]: 'color: #F59E0B; font-weight: bold;',
      [LogLevel.INFO]: 'color: #6B7280;',
      [LogLevel.DEBUG]: 'color: #9CA3AF; font-style: italic;'
    };
    
    const style = categoryStyles[category] + ' ' + levelStyles[level];
    const time = new Date(timestamp).toLocaleTimeString();
    
    // Main log message
    console.log(
      `%c[${category}] ${time} - ${message}`,
      style,
      data || ''
    );
    
    // Insight if available
    if (insight) {
      console.log(
        `%c💡 INSIGHT: ${insight.reason}`,
        'color: #059669; font-weight: bold; background: #F0FDF4; padding: 4px 8px; border-radius: 4px; border-left: 4px solid #10B981;'
      );
      console.log(
        `%c🔍 DIAGNOSTIC: ${insight.insight}`,
        'color: #7C3AED; font-weight: bold; background: #F5F3FF; padding: 4px 8px; border-radius: 4px; border-left: 4px solid #8B5CF6;'
      );
      if (insight.solution) {
        console.log(
          `%c🛠️ SOLUTION: ${insight.solution}`,
          'color: #EA580C; font-weight: bold; background: #FFF7ED; padding: 4px 8px; border-radius: 4px; border-left: 4px solid #F97316;'
        );
      }
    }
    
    // Add spacing for readability
    if (insight || data) {
      console.log('');
    }
  }
  
  /**
   * Get recent logs for debugging
   */
  getRecentLogs(count: number = 50): LogEntry[] {
    return this.logs.slice(-count);
  }
  
  /**
   * Get logs by category
   */
  getLogsByCategory(category: LogCategory): LogEntry[] {
    return this.logs.filter(log => log.category === category);
  }
  
  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
  }
  
  /**
   * Export logs for analysis
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

// Export singleton instance
export const Telemetry = TelemetryEngine.getInstance();

// Export convenience methods
export const logSync = (message: string, data?: any, level: LogLevel = LogLevel.INFO, insight?: DiagnosticInsight) => {
  Telemetry.logVault(LogCategory.SYNC, message, data, level, insight);
};

export const logRealtime = (message: string, data?: any, level: LogLevel = LogLevel.INFO, insight?: DiagnosticInsight) => {
  Telemetry.logVault(LogCategory.REALTIME, message, data, level, insight);
};

export const logSecurity = (message: string, data?: any, level: LogLevel = LogLevel.INFO, insight?: DiagnosticInsight) => {
  Telemetry.logVault(LogCategory.SECURITY, message, data, level, insight);
};

export const logDatabase = (message: string, data?: any, level: LogLevel = LogLevel.INFO, insight?: DiagnosticInsight) => {
  Telemetry.logVault(LogCategory.DATABASE, message, data, level, insight);
};

export const logUI = (message: string, data?: any, level: LogLevel = LogLevel.INFO, insight?: DiagnosticInsight) => {
  Telemetry.logVault(LogCategory.UI, message, data, level, insight);
};

export const logPerformance = (message: string, data?: any, level: LogLevel = LogLevel.INFO, insight?: DiagnosticInsight) => {
  Telemetry.logVault(LogCategory.PERFORMANCE, message, data, level, insight);
};

// Export error handling helper
export const logError = (category: LogCategory, error: any, context?: string) => {
  const insight = TelemetryEngine.getDiagnostic(error);
  const message = context ? `${context}: ${error?.message || error}` : (error?.message || error);
  Telemetry.logVault(category, message, error, LogLevel.ERROR, insight);
};

export default Telemetry;
