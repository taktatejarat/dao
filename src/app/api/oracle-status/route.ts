// src/app/api/oracle-status/route.ts - Health Check Endpoint

import { NextRequest, NextResponse } from 'next/server';

const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://localhost:8000';

export async function GET(req: NextRequest) {
    try {
        // Attempt to hit a simple health check or root endpoint of the FastAPI service
        const response = await fetch(`${AI_ENGINE_URL}/`); // FastAPI root path returns basic status
        
        if (response.ok) {
            return NextResponse.json({ 
                status: 'online', 
                message: 'AI Oracle is running and reachable.',
                details: await response.json()
            }, { status: 200 });
        } else {
            // FastAPI is reachable but returned an error status (e.g., 500)
            return NextResponse.json({ 
                status: 'error', 
                message: 'AI Oracle is up but reported an internal error.',
                http_status: response.status
            }, { status: 503 });
        }
    } catch (error) {
        // Fetch failed (network error, service not running, connection refused)
        return NextResponse.json({ 
            status: 'offline', 
            message: `AI Oracle is not reachable at ${AI_ENGINE_URL}. Is the start_ai_oracle.sh script running?` 
        }, { status: 503 });
    }
}