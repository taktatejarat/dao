// src/app/api/contract-creation/route.ts - REVISED: Only stores data and returns Hash/ABI payload

import { NextRequest, NextResponse } from 'next/server';
import { saveOffChainProposal } from '@/lib/proposal-db';
import { Hex, keccak256, encodePacked, Address, parseEther } from 'viem';
// Note: All viem client imports (publicClient, walletClient, privateKeyToAccount) are now REMOVED
// as this API no longer signs transactions.

// Helper to compute hash using viem (mimicking CustomHash.sol)
function computeProposalHash(description: string): Hex {
    // ... (logic remains the same) ...
    const salt = keccak256(encodePacked(['string'], ['proposal']));
    const data = encodePacked(['string', 'bytes32'], [description, salt]);
    return keccak256(data);
}

// Handler for the proposal creation request
export async function POST(req: NextRequest) {
    try {
        const { 
            proposerAddress, 
            description, 
            recipientAddress, 
            milestoneAmounts,
            daoAddress, // We receive DAO address from frontend
            aiFeatures 
        } = await req.json();

        // 1. Validation and Hash Computation
        if (!description || !recipientAddress || milestoneAmounts.length === 0) {
            return NextResponse.json({ message: 'Missing required fields.' }, { status: 400 });
        }
        const descriptionHash = computeProposalHash(description);
        
        // 2. Save off-chain data (MUST happen first)
        const offChainData = {
            proposerAddress,
            description,
            recipientAddress,
            milestoneAmounts,
            descriptionHash,
            proposalId: 0, // Placeholder
            aiFeatures: aiFeatures || {},
        };
        await saveOffChainProposal(offChainData);
        
        // 3. Prepare On-Chain Payload for Frontend
        const parsedMilestoneAmounts = milestoneAmounts.map(
            (amount: string) => parseEther(amount)
        );

        // We return the payload needed for the user's wallet to sign the transaction.
        return NextResponse.json({ 
            success: true, 
            message: 'Off-chain data saved. Ready for on-chain submission.',
            descriptionHash,
            // ⚠️ NEW: Return the exact arguments needed by createFundingProposal
            txArgs: [
                descriptionHash, 
                recipientAddress as Address,
                parsedMilestoneAmounts,
            ],
            daoAddress, // Return DAO address for consistency
        }, { status: 200 });

    } catch (error) {
        console.error("Error creating proposal:", error);
        return NextResponse.json(
            { message: 'Failed to create proposal.', error: (error as Error).message },
            { status: 500 }
        );
    }
}