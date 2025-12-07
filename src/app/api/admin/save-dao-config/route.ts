// src/app/api/admin/save-dao-config/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { verifyMessage } from 'viem';
import * as fs from 'fs';
import * as path from 'path';

// آدرس ادمین اصلی را اینجا یا در env چک می‌کنیم
const ADMIN_ADDRESS = process.env.NEXT_PUBLIC_ADMIN_ADDRESS?.toLowerCase();

export async function POST(req: NextRequest) {
    try {
        const { address, signature, message, config } = await req.json();

        if (!address || !signature || !message || !config) {
            return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
        }

        // 1. بررسی اینکه آیا درخواست کننده ادمین است؟
        if (address.toLowerCase() !== ADMIN_ADDRESS) {
            return NextResponse.json({ success: false, message: 'Unauthorized wallet' }, { status: 403 });
        }

        // 2. اعتبارسنجی امضای دیجیتال
        const isValid = await verifyMessage({
            address,
            message,
            signature,
        });

        if (!isValid) {
            return NextResponse.json({ success: false, message: 'Invalid signature' }, { status: 401 });
        }

        // 3. ذخیره فایل کانفیگ در مسیر امن
        // این فایل منبع حقیقت برای اسکریپت ارتقاء خواهد بود
        const configPath = path.resolve(process.cwd(), 'dao-config.json');
        
        // اضافه کردن متادیتای امنیتی به فایل
        const fileContent = {
            _meta: {
                updatedBy: address,
                updatedAt: new Date().toISOString(),
                signature: signature
            },
            ...config
        };

        fs.writeFileSync(configPath, JSON.stringify(fileContent, null, 2), 'utf8');

        console.log(`✅ DAO Config updated by ${address}`);

        return NextResponse.json({ success: true, message: 'Configuration securely saved. Ready for upgrade script.' });

    } catch (error) {
        console.error('Config Save Error:', error);
        return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
    }
}