// src/app/api/events/route.ts - FINAL VERSION, COMPATIBLE WITH YOUR .env

import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, decodeEventLog, webSocket } from 'viem';
import { polygonAmoy } from 'viem/chains';
// ✅ Make sure this ABI import path is correct for your project structure
import { rayanChainDaoAbi } from '@/lib/blockchain/generated';

// ✅ Reads the correct environment variable names from your .env file
const DAO_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;
const RPC_URL = process.env.AMOY_RPC_URL;

// This function is for demonstration. In a real app, you would fetch this from a DB or off-chain source.
function getProposalTitleFromHash(hash: string): string {
    // In a real implementation, you would look up this hash in your MongoDB 'proposals' collection
    // to get the actual title or a snippet of the description.
    return `Proposal (hash: ${hash.substring(0, 10)}...)`;
}


export async function GET(req: NextRequest) {
    if (!DAO_ADDRESS || !RPC_URL) {
        return NextResponse.json({ 
            error: "Server configuration error: NEXT_PUBLIC_CONTRACT_ADDRESS or AMOY_RPC_URL is missing in .env" 
        }, { status: 500 });
    }

    try {
        const client = createPublicClient({
            chain: polygonAmoy,
            transport: http(RPC_URL),
        });

        console.log(`Fetching events for DAO contract: ${DAO_ADDRESS}`);

        // ✅✅✅ THE FIX IS HERE ✅✅✅
        // 1. دریافت شماره آخرین بلاک
        const latestBlock = await client.getBlockNumber();
        // 2. تعیین بازه جستجو (مثلاً ۵۰۰ هزار بلاک آخر)
        const fromBlock = latestBlock > 500000n ? latestBlock - 500000n : 0n;
        
        console.log(`Searching for logs from block ${fromBlock} to ${latestBlock}`);


        // 3. استفاده از fromBlock محاسبه شده در درخواست‌ها
        const [proposalLogs, voteLogs, stateChangeLogs] = await Promise.all([
            client.getLogs({
                address: DAO_ADDRESS,
                event: rayanChainDaoAbi.find((item) => item.type === 'event' && item.name === 'ProposalCreated')!,
                fromBlock: fromBlock, 
            }),
            client.getLogs({
                address: DAO_ADDRESS,
                event: rayanChainDaoAbi.find((item) => item.type === 'event' && item.name === 'Voted')!,
                fromBlock: fromBlock,
            }),
            client.getLogs({
                address: DAO_ADDRESS,
                event: rayanChainDaoAbi.find((item) => item.type === 'event' && item.name === 'ProposalStateChanged')!,
                fromBlock: fromBlock,
            })
        ]);

        const allLogs = [...proposalLogs, ...voteLogs, ...stateChangeLogs];

        const activities = allLogs.map(log => {
            const decodedLog = decodeEventLog({
                abi: rayanChainDaoAbi,
                data: log.data,
                topics: log.topics
            });

            // Process the log into a user-friendly format
            let description = '';
            const args = decodedLog.args as any; // Type assertion for easier access

            switch (decodedLog.eventName) {
                case 'ProposalCreated':
                    description = `New proposal created by ${args.proposer}.`;
                    break;
                case 'Voted':
                    const voteType = args.vote === 0 ? 'For' : 'Against'; // Assuming 0 = For, 1 = Against
                    description = `${args.voter} voted '${voteType}' on Proposal #${args.proposalId}`;
                    break;
                case 'ProposalStateChanged':
                    // In a real app, you would have an enum for states
                    description = `Proposal #${args.id} state changed to '${args.newState}'.`;
                    break;
                default:
                    description = `An unknown event occurred.`;
            }
            
            return {
                eventName: decodedLog.eventName,
                description: description,
                blockNumber: log.blockNumber.toString(),
                transactionHash: log.transactionHash,
                args: args
            };
        });

        // Sort activities by block number, newest first
        activities.sort((a, b) => parseInt(b.blockNumber) - parseInt(a.blockNumber));

        return NextResponse.json({ success: true, result: activities });

    } catch (error) {
        console.error("Error fetching event logs directly from RPC:", error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return NextResponse.json({ success: false, message: `Could not fetch event logs: ${errorMessage}` }, { status: 500 });
    }
}