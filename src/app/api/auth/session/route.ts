// src/app/api/auth/session/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateUser } from '@/lib/db';

export async function POST(req: NextRequest) {
    try {
        const { address } = await req.json();

        // اعتبارسنجی اولیه
        if (!address || typeof address !== 'string' || !address.startsWith('0x')) {
            return NextResponse.json({ success: false, message: 'Invalid wallet address' }, { status: 400 });
        }

        // فراخوانی تابع دیتابیس
        const user = await getOrCreateUser(address);

        return NextResponse.json({ 
            success: true, 
            user: {
                walletAddress: user.walletAddress,
                roles: user.roles,
                kycStatus: user.kycStatus,
                profile: user.profile
            } 
        });

    } catch (error) {
        console.error('Auth API Error:', error);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}