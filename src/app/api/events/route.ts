// src/app/api/events/route.ts

import { NextRequest, NextResponse } from 'next/server';

// ✅✅✅ ۱. استفاده از نام متغیر صحیح و آدرس پایه صحیح Etherscan V2
const API_KEY = process.env.POLYGONSCAN_API_KEY; // نام متغیر در .env شما
const BASE_URL = 'https://api.etherscan.io/v2/api';

// ✅✅✅ ۲. یک تابع کمکی برای تبدیل نام شبکه به Chain ID
const getChainId = (networkName: string): string => {
    switch (networkName.toLowerCase()) {
        case 'amoy':
            return '80002';
        case 'mainnet': // Polygon Mainnet
            return '137';
        case 'sepolia':
            return '11155111';
        case 'ethereum': // Ethereum Mainnet
            return '1';
        default:
            throw new Error(`Unsupported network: ${networkName}`);
    }
};

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get('address');
    const fromBlock = searchParams.get('fromBlock') || '0';
    
    const network = process.env.NEXT_PUBLIC_NETWORK || 'amoy';
    
    if (!API_KEY) {
        return NextResponse.json({ success: false, message: 'POLYGONSCAN_API_KEY is not configured on the server.' }, { status: 500 });
    }
    if (!address) {
        return NextResponse.json({ success: false, message: 'Contract address is required.' }, { status: 400 });
    }

    try {
        const chainId = getChainId(network);

        // ✅✅✅ ۳. ساخت URL با فرمت صحیح Etherscan V2
        const apiUrl = `${BASE_URL}?chainid=${chainId}&module=logs&action=getLogs&address=${address}&fromblock=0&toblock=latest&apikey=${API_KEY}`;
        console.log("Fetching Event Logs from Etherscan V2:", apiUrl);

        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`Etherscan V2 API responded with status: ${response.status}`);
        }
        const data = await response.json();

        if (data.status === '1') {
            return NextResponse.json({ success: true, result: data.result });
        } else if (data.message === 'No records found' || (data.result && data.result.length === 0)) {
            return NextResponse.json({ success: true, result: [] });
        } else {
            console.error("Etherscan V2 API Error (getLogs):", data);
            throw new Error(data.message || data.result);
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return NextResponse.json({ success: false, message: `Could not fetch event logs: ${errorMessage}` }, { status: 500 });
    }
}