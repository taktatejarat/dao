// src/lib/proposal-db.ts

import clientPromise from './mongodb';
import { type Document } from 'mongodb';

// ✅ CORRECTION: Manually define the enum structure as found in RayanChainDAO.sol
// ProposalType: 0 = Funding, 1 = TreasuryAction
export enum ProposalType { 
    Funding = 0, 
    TreasuryAction = 1 
}

// 1. Define the Proposal Data structure to be saved off-chain
export interface OffChainProposalData {
    proposalId?: number; // The on-chain ID (assigned after tx is confirmed)
    proposerAddress: string;
    description: string; // The full, long description (stored off-chain)
    recipientAddress: string;
    milestoneAmounts: string[];
    descriptionHash: string; // The hash generated before sending to contract
    // ✅ NEW: AI Features included
    aiFeatures: {
        startupIndustry: string;
        teamExperience: string;
        [key: string]: any; // Allow for other AI features
    };
    // If you need to store the type:
    // proposalType: ProposalType;
}

// 2. Define the MongoDB Document type
interface OffChainProposalDocument extends OffChainProposalData, Document {
    _id: string; // Using the hash as the unique ID for quick lookup and integrity check
}

/**
 * Saves the off-chain proposal data to MongoDB.
 * @param data The proposal data including the hash.
 */
export async function saveOffChainProposal(data: OffChainProposalData): Promise<void> {
    if (!data.descriptionHash) throw new Error("Description Hash is required for off-chain storage.");
    
    try {
        const client = await clientPromise;
        const db = client.db("dao-vc");
        const collection = db.collection<OffChainProposalDocument>("proposals"); 
        
        await collection.updateOne(
            { _id: data.descriptionHash }, 
            { $set: data as OffChainProposalDocument },
            { upsert: true }
        );
    } catch (error) {
        console.error("Error saving off-chain proposal to MongoDB:", error);
        throw new Error("Failed to save off-chain proposal data.");
    }
}

/**
 * Retrieves the full description using the hash stored on-chain.
 * @param hash The descriptionHash stored in the smart contract.
 */
export async function getOffChainProposal(hash: string): Promise<OffChainProposalData | null> {
    try {
        const client = await clientPromise;
        const db = client.db("dao-vc");
        const collection = db.collection<OffChainProposalDocument>("proposals");
        
        const document = await collection.findOne({ _id: hash });
        
        if (!document) {
            return null;
        }
        
        const { _id, ...data } = document;
        return data;
    } catch (error) {
        console.error("Error fetching off-chain proposal from MongoDB:", error);
        throw new Error("Failed to retrieve off-chain proposal data.");
    }
}