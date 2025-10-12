// src/app/api/contract-creation/route.ts - FINAL FIX: HASH ONLY (NO SYSTEM TX)

import { NextRequest, NextResponse } from 'next/server';
import { saveOffChainProposal } from '@/lib/proposal-db';
// ❌ REMOVED: All viem client imports (publicClient, walletClient, privateKeyToAccount, etc.)
import { Address, Hex, parseEther, keccak256, encodePacked } from 'viem';
import { rayanChainDaoAbi, daoRegistryAbi } from '@/lib/blockchain/generated'; // Kept for ABI reference only
import { REGISTRY_KEYS } from '@/lib/blockchain/registry-keys'; 

// Helper to compute hash using viem
function computeProposalHash(description: string): Hex {
    const salt = keccak256(encodePacked(['string'], ['proposal']));
    const data = encodePacked(['string', 'bytes32'], [description, salt]);
    return keccak256(data);
}

export async function POST(req: NextRequest) {
    try {
        const { 
            proposerAddress, 
            description, 
            recipientAddress, 
            milestoneAmounts,
            aiFeatures 
        } = await req.json();

        // 1. Validation and Hash Computation
        if (!description || !recipientAddress || milestoneAmounts.length === 0) {
            return NextResponse.json({ message: 'Missing required fields.' }, { status: 400 });
        }
        const descriptionHash = computeProposalHash(description);
        
        // 2. Prepare Data for DB and On-Chain Payload
        const parsedMilestoneAmounts = milestoneAmounts.map(
             (amount: string) => parseEther(amount)
        );
        
        // 3. Save off-chain data (MUST happen first)
        const offChainData = {
            proposerAddress,
            description,
            recipientAddress,
            milestoneAmounts: milestoneAmounts.map((a: string) => a.toString()),
            descriptionHash,
            proposalId: 0, 
            aiFeatures: aiFeatures || {},
        };
        await saveOffChainProposal(offChainData);
        
        // 4. Return the payload needed for the user's wallet to sign the transaction.
        return NextResponse.json({ 
            success: true, 
            message: 'Off-chain data saved. Ready for on-chain submission.',
            descriptionHash,
            txArgs: [
                descriptionHash, 
                recipientAddress as Address,
                // NOTE: We return the strings here and let useCreateProposal re-parse them
                milestoneAmounts.map((a: string) => parseEther(a)), // Return BigInt array for front-end Wagmi
            ],
        }, { status: 200 });

    } catch (error) {
        console.error("Error creating proposal:", error);
        return NextResponse.json(
            { message: (error as Error).message },
            { status: 500 }
        );
    }
}