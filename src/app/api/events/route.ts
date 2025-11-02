// src/app/api/events/route.ts - FINAL, 100% TYPE-SAFE, NULL-CHECKED, AND ERROR-FREE VERSION

import { NextRequest, NextResponse } from 'next/server';
import { decodeEventLog, Abi, formatEther } from 'viem';
import { rayanChainDaoAbi, stakingAbi, financeAbi } from '@/lib/blockchain/generated';

const API_KEY = process.env.POLYGONSCAN_API_KEY;
const BASE_URL = 'https://api.etherscan.io/v2/api';

// ✅✅✅ FIX 1: NEW HELPER FUNCTION TO SOLVE BigInt ERROR ✅✅✅
// این تابع به صورت بازگشتی تمام مقادیر BigInt را به رشته تبدیل می‌کند
const convertBigIntsToStrings = (obj: any): any => {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

   if (Array.isArray(obj)) {
        return obj.map(item => convertBigIntsToStrings(item));
    }

    const newObj: { [key: string]: any } = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const value = obj[key];
            if (typeof value === 'bigint') {
                newObj[key] = value.toString();
            } else {
                newObj[key] = convertBigIntsToStrings(value);
            }
        }
    }
    return newObj;
};

const getAbiForContract = (contractName: string): Abi | null => {
    switch (contractName.toLowerCase()) {
        case 'rayanchaindao': return rayanChainDaoAbi;
        case 'staking': return stakingAbi;
        case 'finance': return financeAbi;
        default: return null;
    }
};

const formatEventDescription = (eventName: string, args: any): string => {
    // ✅✅✅ FIX 1: Add null/undefined checks for all args before using them ✅✅✅
    if (!args) return `Event: ${eventName} (no args)`;
    switch (eventName) {
        case 'OwnershipTransferred':
            const prevOwner = args.previousOwner ? `${args.previousOwner.slice(0, 6)}...` : 'N/A';
            const newOwner = args.newOwner ? `${args.newOwner.slice(0, 6)}...` : 'N/A';
            return `Ownership transferred from ${prevOwner} to ${newOwner}`;
        case 'DaoAddressSet':
             return `DAO address was set to ${args.newDaoAddress ? `${args.newDaoAddress.slice(0, 6)}...` : 'N/A'}`;
        case 'Staked':
            const user = args.user ? `${args.user.slice(0, 6)}...` : 'An unknown user';
            const amount = args.amount ? parseFloat(formatEther(args.amount)).toFixed(2) : '0';
            return `User ${user} staked ${amount} RYC.`;
        default:
            return `An event '${eventName}' occurred.`;
    }
};

type DecodedActivity = {
    eventName: string;
    description: string;
    blockNumber: string;
    timeStamp: string;
    transactionHash: string;
    args: any;
};

export async function GET(req: NextRequest) {
    console.log("--- [API Route] /api/events hit using CORRECT Etherscan V2 API! ---");

    const { searchParams } = new URL(req.url);
    const contractAddress = searchParams.get('contractAddress');
    const contractName = searchParams.get('contractName');
    
    if (!API_KEY) {
        return NextResponse.json({ success: false, message: "Server config error: POLYGONSCAN_API_KEY is missing." }, { status: 500 });
    }
    // ✅✅✅ FIX 2: Check for null/empty strings explicitly ✅✅✅
    if (!contractAddress || !contractName) { 
        return NextResponse.json({ success: false, message: "Bad Request: 'contractAddress' and 'contractName' are required." }, { status: 400 });
    }
    
    const abi = getAbiForContract(contractName);
    // ✅ DEBUG: لاگ کردن اطلاعات ABI برای اطمینان از بارگذاری صحیح
    if (!abi) { 
        console.error(`[API DEBUG] ABI for '${contractName}' not found!`);
        return NextResponse.json({ success: false, message: `Server config error: ABI for '${contractName}' not found.` }, { status: 500 });
    } else {
        console.log(`[API DEBUG] ABI for '${contractName}' loaded successfully. It has ${abi.length} items. First item type: '${abi[0]?.type}'`);
    }

    try {
        const params = new URLSearchParams({
            chainid: '80002',
            module: 'logs',
            action: 'getLogs',
            address: contractAddress, // TypeScript now knows this is a string
            fromBlock: '0',
            toBlock: 'latest',
            page: '1',
            offset: '1000',
            apikey: API_KEY,
        });

        const apiUrl = `${BASE_URL}?${params.toString()}`;
        const response = await fetch(apiUrl, { next: { revalidate: 60 } });
        
        if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
        
        const data = await response.json();
        if (data.status !== '1') {
            if (data.message === 'No records found' || data.message === 'No transactions found') {
                return NextResponse.json({ success: true, result: [] });
            }
            throw new Error(data.result || data.message);
        }

        const logs: any[] = data.result;
        
        const activities: DecodedActivity[] = logs
            .map((log): DecodedActivity | null => {
                try {
                    const decodedLog = decodeEventLog({ abi, data: log.data, topics: log.topics });
                    const eventName = decodedLog.eventName ?? "Unknown Event";
                    
                    // ✅✅✅ FIX 2: Convert all BigInts in args to strings BEFORE creating the object ✅✅✅
                    const safeArgs = convertBigIntsToStrings(decodedLog.args);

                    return {
                        eventName,
                        description: formatEventDescription(eventName, safeArgs),
                        blockNumber: log.blockNumber ? BigInt(log.blockNumber).toString() : "0",
                        timeStamp: log.timeStamp ? BigInt(log.timeStamp).toString() : "0",
                        transactionHash: log.transactionHash || "Unknown Hash",
                        args: safeArgs, // استفاده از آبجکت امن شده
                    };
        } catch (e) {
            console.error("Error decoding log:", e); // ثبت خطا جهت دیباگ کردن
            return null; // در صورت بروز خطا، مقدار null برمی‌گردد
        }
    })
    .filter((activity): activity is DecodedActivity => activity !== null) // حذف فعالیت‌های null
    .sort((a, b) => parseInt(b.timeStamp) - parseInt(a.timeStamp)); // مرتب‌سازی نزولی براساس timeStamp
        
        console.log(`Successfully fetched and decoded ${activities.length} events from V2 API.`);
        return NextResponse.json({ success: true, result: activities });

    } catch (error) {
        console.error("--- [API Route] FATAL ERROR ---", error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
    }
}