// src/app/api/setup/reset/route.ts

import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

// لیست کلیدهایی که باید ریست شوند
const DEPLOYMENT_ENV_KEYS = [
    'NEXT_PUBLIC_REGISTRY_ADDRESS',
    'NEXT_PUBLIC_DAO_ADDRESS',
    'NEXT_PUBLIC_TOKEN_ADDRESS',
    'NEXT_PUBLIC_STAKING_ADDRESS',
    'NEXT_PUBLIC_FINANCE_ADDRESS',
    'NEXT_PUBLIC_USER_PROFILE_ADDRESS', // این هم باید باشد
    'NEXT_PUBLIC_ACC_CONTROL_ADDRESS',  // این هم باید باشد
    'NEXT_PUBLIC_ADMIN_ADDRESS',        // این هم باید باشد
    'TIMELOCK_ADDRESS',
    'RAYAN_CHAIN_DAO_ABI',
    'AI_ORACLE_PRIVATE_KEY',            // کلید خصوصی اوراکل هم باید ریست شود
];

export async function POST() {
  try {
    const envPath = path.resolve(process.cwd(), '.env');

    if (!fs.existsSync(envPath)) {
        return NextResponse.json({ success: true, message: '.env file not found.' });
    }

    let envContent = fs.readFileSync(envPath, 'utf8');
    let lines = envContent.split('\n');

    const filteredLines = lines.filter(line => {
        const trimmedLine = line.trim();
        if (!trimmedLine || trimmedLine.startsWith('#')) return true; // حفظ کامنت و خط خالی
        
        const key = line.split('=')[0].trim();
        // اگر کلید در لیست سیاه است، حذف شود
        return !DEPLOYMENT_ENV_KEYS.includes(key);
    });

    const newEnvContent = filteredLines.join('\n');
    fs.writeFileSync(envPath, newEnvContent, 'utf8');

    console.log("✅ Deployment keys reset successfully.");
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Reset error:', error);
    return NextResponse.json({ success: false, message: String(error) }, { status: 500 });
  }
}