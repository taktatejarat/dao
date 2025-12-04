// src/app/api/legal/accept-terms/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { verifyMessage } from 'viem';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { address, signature, message, timestamp } = body;

        if (!address || !signature || !message) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. اعتبارسنجی امضا در سمت سرور (Security Verification)
        const isValid = await verifyMessage({
            address,
            message,
            signature,
        });

        if (!isValid) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        // 2. اتصال به دیتابیس
        const db = await getDb();
        const collection = db.collection('legal_consents');

        // 3. ذخیره رکورد (Upsert: اگر قبلاً امضا کرده، آپدیت کن، اگر نه بساز)
        await collection.updateOne(
            { walletAddress: address }, // شرط جستجو
            {
                $set: {
                    walletAddress: address,
                    signature: signature,
                    messageHash: message, // متن اصلی پیام
                    signedAt: new Date(timestamp),
                    lastIp: req.headers.get('x-forwarded-for') || 'unknown',
                    userAgent: req.headers.get('user-agent') || 'unknown',
                    termsVersion: 'v1.0' // ورژن قوانین (برای آپدیت‌های آینده مفید است)
                }
            },
            { upsert: true }
        );

        return NextResponse.json({ success: true, message: 'Consent recorded successfully' });

    } catch (error) {
        console.error('Legal API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}