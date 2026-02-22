import connectDB from "@/lib/db";
import Audit from "@/models/Audit";
import { NextResponse } from "next/server";

/**
 * TELEMETRY API ROUTE (V1.0 - SYSTEM LOGGING)
 * -----------------------------------------------
 * Purpose: Receive and store system telemetry data
 * Supports: POST (store telemetry logs and errors)
 */

export async function POST(req: Request) {
  try {
    const { userId, events, sessionId } = await req.json();
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        message: "User ID required" 
      }, { status: 400 });
    }

    await connectDB();
    
    // Store telemetry data in Audit collection
    await Audit.create({
      userId,
      action: 'TELEMETRY_SYNC',
      type: 'SYSTEM',
      details: { events, sessionId },
      timestamp: Date.now()
    });

    return NextResponse.json({
      success: true,
      message: "Telemetry received successfully"
    }, { status: 200 });

  } catch (error: any) {
    console.error("TELEMETRY_ERROR:", error.message);
    return NextResponse.json({ 
      success: false, 
      message: `Telemetry processing failed: ${error.message}` 
    }, { status: 500 });
  }
}
