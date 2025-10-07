// src/app/api/trigger-ai-update/route.ts - Triggers AI Oracle after successful Proposal Tx

import { NextRequest, NextResponse } from 'next/server';

const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://localhost:8000';
// We assume AI_ENGINE_URL is set in .env as http://localhost:8000

export async function POST(req: NextRequest) {
    const { txHash } = await req.json();

    // ⚠️ NOTE: In a real system, a dedicated listener would track the transaction
    // receipt, extract the ProposalID, and THEN call the AI Oracle.
    // Since we don't have a listener, we will mock the ProposalID = 1 for now.
    const MOCK_PROPOSAL_ID = 1; // This must be fixed when the listener is implemented.
    
    try {
        // Call the internal AI Oracle action route (FastAPI)
        const response = await fetch(`${AI_ENGINE_URL}/action/update-risk/${MOCK_PROPOSAL_ID}`, {
            method: 'POST',
            // Body is often empty for simple triggers
        });

        if (response.ok) {
            return NextResponse.json({ 
                success: true, 
                message: `AI Risk update triggered for Proposal ${MOCK_PROPOSAL_ID}.` 
            }, { status: 200 });
        } else {
            const errorText = await response.text();
            throw new Error(`AI Oracle API failed: ${errorText}`);
        }
    } catch (error) {
        console.error("Failed to trigger AI Oracle:", error);
        return NextResponse.json(
            { success: false, message: 'Failed to trigger AI Oracle after Tx confirmation.' }, 
            { status: 500 }
        );
    }
}