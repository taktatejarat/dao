// src/app/api/setup/save-config/route.ts

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Helper function to update the .env.local file
function updateEnvFile(envData: Record<string, string>) {
  const envPath = path.resolve(process.cwd(), '.env');
  let envContent = "";
  try {
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf-8');
    }
  } catch (e) {
    console.warn("Could not read existing .env file, a new one will be created.", e);
  }

  for (const key in envData) {
    const value = envData[key];
    if (envContent.includes(key)) {
      envContent = envContent.replace(new RegExp(`^${key}=.*`, "m"), `${key}=${value}`);
    } else {
      envContent += (envContent ? "\n" : "") + `${key}=${value}`;
    }
  }
  
  fs.writeFileSync(envPath, envContent);
}

export async function POST(req: NextRequest) {
  try {
    const { rpcUrl, privateKey, adminAddress } = await req.json();

    if (!rpcUrl || !privateKey || !adminAddress) {
      return NextResponse.json({ success: false, message: 'Missing required fields.' }, { status: 400 });
    }

    updateEnvFile({
      'HARDHAT_NETWORK_RPC_URL': rpcUrl,
      'HARDHAT_NETWORK_PRIVATE_KEY': privateKey,
      'NEXT_PUBLIC_ADMIN_ADDRESS': adminAddress,
    });

    return NextResponse.json({ success: true, message: 'Configuration saved successfully.' });
  } catch (error) {
    console.error('Error saving configuration:', error);
    return NextResponse.json({ success: false, message: 'Failed to save configuration.' }, { status: 500 });
  }
}