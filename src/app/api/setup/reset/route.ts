// src/app/api/setup/reset/route.ts

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST() {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, 'utf-8');
      const key = "NEXT_PUBLIC_REGISTRY_ADDRESS";
      if (envContent.includes(key)) {
        // Remove the line containing NEXT_PUBLIC_REGISTRY_ADDRESS
        envContent = envContent.replace(new RegExp(`^${key}=.*$`, 'gm'), '');
        // Remove empty lines
        envContent = envContent.replace(/^\s*[\r\n]/gm, '');
        fs.writeFileSync(envPath, envContent);
      }
    }
    return NextResponse.json({ success: true, message: 'Setup has been reset.' });
  } catch (error) {
    console.error('Error resetting setup:', error);
    return NextResponse.json({ success: false, message: 'Failed to reset setup.' }, { status: 500 });
  }
}