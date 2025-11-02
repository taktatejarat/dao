// src/app/api/events/route.ts - FINAL, TYPE-SAFE VERSION

import { NextRequest, NextResponse } from 'next/server';
import { decodeEventLog, Abi } from 'viem';
import { rayanChainDaoAbi, stakingAbi, financeAbi } from '@/lib/blockchain/generated';

const API_KEY = process.env.POLYGONSCAN_API_KEY;
const BASE_URL = 'https://api-amoy.polygonscan.com/api';

const getAbiForContract = (contractName: string): Abi | null => {
    switch (contractName.toLowerCase()) {
        case 'rayanchaindao':
            return rayanChainDaoAbi;
        case 'staking':
            return stakingAbi;
        case 'finance':
            return financeAbi;
        default:
            return null;
    }
};

type DecodedActivity = {
    eventName: string;
    description: string;
    blockNumber: string;
    transactionHash: string;
    args: any;
} | null;


export async function GET(req: NextRequest) {
    console.log("--- [API Route] /api/events hit using Etherscan API! ---");

    const { searchParams } = new URL(req.url);
    const contractAddress = searchParams.get('contractAddress');
    const contractName = searchParams.get('contractName');

    if (!API_KEY) {
        return NextResponse.json({ error: "Server config error: POLYGONSCAN_API_KEY is missing." }, { status: 500 });
    }
    if (!contractAddress || !contractName) {
        return NextResponse.json({ error: "Bad Request: 'contractAddress' and 'contractName' are required." }, { status: 400 });
    }

    const abi = getAbiForContract(contractName);
    if (!abi) {
        return NextResponse.json({ error: `Server config error: ABI for '${contractName}' not found.` }, { status: 500 });
    }

    try {
        const apiUrl = `${BASE_URL}?module=logs&action=getLogs&address=${contractAddress}&fromBlock=0&toBlock=latest&apikey=${API_KEY}`;
        console.log(`Fetching logs from PolygonScan for ${contractName}: ${apiUrl}`);

        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`PolygonScan API responded with status: ${response.status}`);
        }
        const data = await response.json();

        if (data.status !== '1') {
            if (data.message === 'No records found' || data.message === 'No transactions found') {
                return NextResponse.json({ success: true, result: [] });
            }
            throw new Error(data.message || data.result);
        }

        const logs = data.result;

        const activities: DecodedActivity[] = logs.map((log: any) => {
            try {
                const decodedLog = decodeEventLog({ abi, data: log.data, topics: log.topics });
                let description = `Event: ${decodedLog.eventName}`;
                // Future: expand description logic here based on eventName and args
                return {
                    eventName: decodedLog.eventName,
                    description: description,
                    blockNumber: BigInt(log.blockNumber).toString(),
                    transactionHash: log.transactionHash,
                    args: decodedLog.args,
                };
            } catch (e) {
                return null;
            }
        });

        const validActivities = activities.filter(Boolean);

        // ✅✅✅ THE FIX IS HERE ✅✅✅
        // Explicitly define types for sort parameters
        validActivities.sort((a: DecodedActivity, b: DecodedActivity) => 
            parseInt(b!.blockNumber) - parseInt(a!.blockNumber)
        );
        
        console.log(`Successfully fetched and decoded ${validActivities.length} events.`);
        return NextResponse.json({ success: true, result: validActivities });

    } catch (error) {
        console.error("--- [API Route] FATAL ERROR ---", error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
    }
}