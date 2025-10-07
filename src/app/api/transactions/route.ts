// src/app/api/transactions/route.ts

import { type NextRequest, NextResponse } from 'next/server';

const API_KEY = process.env.POLYGONSCAN_API_KEY;
// ✅✅✅ ۱. استفاده از آدرس پایه صحیح Etherscan V2 ✅✅✅
const BASE_URL = 'https://api.etherscan.io/v2/api'; 

// ✅✅✅ ۲. تابع کمکی برای تبدیل نام شبکه به Chain ID صحیح ✅✅✅
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
            throw new Error('Unsupported network for Etherscan V2 API: ${networkName}');
    }
};


export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const contractAddress = searchParams.get('address');
    const network = process.env.NEXT_PUBLIC_NETWORK || 'amoy';

    if (!API_KEY) {
        return NextResponse.json({ message: 'API key is not configured.' }, { status: 500 });
    }
    if (!contractAddress) {
        return NextResponse.json({ message: 'Contract address is required.' }, { status: 400 });
    }
    
    try {
        const chainId = getChainId(network);
        const apiUrl = `${BASE_URL}?chainid=${chainId}&module=account&action=txlist&address=${contractAddress}&startblock=0&endblock=99999999&sort=desc&apikey=${API_KEY}`;
        
        // ✅✅✅ لاگ ۱: آیا URL صحیح است؟ ✅✅✅
        console.log("--- [API Route] Fetching URL ---", apiUrl);

        const response = await fetch(apiUrl);
        const data = await response.json();

        // ✅✅✅ لاگ ۲: Etherscan دقیقاً چه چیزی برمی‌گرداند؟ ✅✅✅
        console.log("--- [API Route] Raw Response from Etherscan ---", JSON.stringify(data, null, 2));

        if (data.status === '1' || (data.status === '0' && data.message === 'No transactions found')) {
            return NextResponse.json(data);
        } else {
            throw new Error(data.result || data.message);
        }

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return NextResponse.json({ message: 'Could not fetch transactions: ${errorMessage}' }, { status: 500 });
    }
}