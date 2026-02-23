import connectDB from "@/lib/db";
import Audit from "@/models/Audit";
import { NextResponse } from "next/server";

/**
 * TELEMETRY API ROUTE (V2.0 - BULLETPROOF)
 * -----------------------------------------------
 * Purpose: Receive and store system telemetry data with comprehensive validation
 * Supports: POST (store telemetry logs and errors)
 */

export async function POST(req: Request) {
  try {
    // Safe JSON parsing with validation
    let payload;
    try {
      payload = await req.json();
    } catch (parseError) {
      return NextResponse.json({ 
        success: false, 
        message: "Invalid JSON payload" 
      }, { status: 400 });
    }
    
    // Comprehensive field validation
    const { userId, events, sessionId } = payload;
    
    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ 
        success: false, 
        message: "Valid userId required (string)" 
      }, { status: 400 });
    }
    
    if (!Array.isArray(events)) {
      return NextResponse.json({ 
        success: false, 
        message: "Events must be an array" 
      }, { status: 400 });
    }
    
    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json({ 
        success: false, 
        message: "Valid sessionId required (string)" 
      }, { status: 400 });
    }

    await connectDB();
    
    // Safe database operation with error handling
    try {
      // Store telemetry data in Audit collection with defaults
      await Audit.create({
        userId,
        action: 'TELEMETRY_SYNC',
        type: 'system',
        details: { 
          events: events || [], 
          sessionId: sessionId || 'unknown-session' 
        },
        timestamp: Date.now()
      });

      return NextResponse.json({
        success: true,
        message: "Telemetry received successfully"
      }, { status: 200 });
      
    } catch (dbError: unknown) {
      console.error("TELEMETRY_DB_ERROR:", String(dbError));
      return NextResponse.json({ 
        success: false, 
        message: `Database operation failed: ${String(dbError)}` 
      }, { status: 500 });
    }
    
  } catch (error: any) {
    console.error("TELEMETRY FINAL ERROR:", error);
    return NextResponse.json({ 
      success: false, 
      message: `Telemetry processing failed: ${error.message}` 
    }, { status: 500 });
  }
}
