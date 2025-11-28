// src/app/api/setup/status/route.ts
import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const envPath = path.resolve(process.cwd(), '.env');
        
        if (!fs.existsSync(envPath)) {
            return NextResponse.json({ isConfigured: false });
        }

        const fileContent = fs.readFileSync(envPath, 'utf8');
        const envConfig = dotenv.parse(fileContent);

        // بررسی اینکه آیا آدرس‌های کلیدی وجود دارند؟
        const hasRegistry = !!envConfig.NEXT_PUBLIC_REGISTRY_ADDRESS;
        const hasDao = !!envConfig.NEXT_PUBLIC_DAO_ADDRESS;

        return NextResponse.json({ 
            isConfigured: hasRegistry && hasDao,
            registry: envConfig.NEXT_PUBLIC_REGISTRY_ADDRESS 
        });

    } catch (error) {
        return NextResponse.json({ isConfigured: false, error: String(error) });
    }
}