// src/app/api/setup/reset/route.ts - FINAL, CORRECTED VERSION

import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

// ✅✅✅ FIX: لیستی از تمام کلیدهایی که باید در زمان ریست حذف شوند ✅✅✅
const DEPLOYMENT_ENV_KEYS = [
    'NEXT_PUBLIC_REGISTRY_ADDRESS',
    'NEXT_PUBLIC_DAO_ADDRESS',
    'NEXT_PUBLIC_TOKEN_ADDRESS',
    'NEXT_PUBLIC_STAKING_ADDRESS',
    'NEXT_PUBLIC_FINANCE_ADDRESS',
    'TIMELOCK_ADDRESS',
  ];

export async function POST() {
  try {
    const envPath = path.resolve(process.cwd(), '.env');

    if (!fs.existsSync(envPath)) {
        return NextResponse.json({ success: true, message: '.env file not found, considered reset.' });
    }

    let envContent = fs.readFileSync(envPath, 'utf8');
    let lines = envContent.split('\n');

    // ✅✅✅ FIX: منطق جدید برای فیلتر کردن تمام کلیدهای استقرار ✅✅✅
    // ما خطوطی را نگه می‌داریم که کلید آن‌ها در لیست حذف ما **نیست**.
    const filteredLines = lines.filter(line => {
        // اگر خط خالی است یا با # شروع می‌شود (کامنت)، آن را نگه دار
        if (!line.trim() || line.trim().startsWith('#')) {
            return true;
        }
        
        const key = line.split('=')[0].trim();
        // اگر کلید در لیست حذف ما نیست، آن را نگه دار
        return !DEPLOYMENT_ENV_KEYS.includes(key);
    });

    const newEnvContent = filteredLines.join('\n');
    fs.writeFileSync(envPath, newEnvContent, 'utf8');

    console.log("✅ Deployment environment variables have been reset from .env file.");
    return NextResponse.json({ success: true, message: 'Deployment configuration has been successfully reset.' });

  } catch (error) {
    console.error('Error resetting setup:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
  }
}