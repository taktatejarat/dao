// src/app/api/profile/upgrade/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { addRoleToUser } from '@/lib/db';

export async function POST(req: NextRequest) {
    try {
        const { address, role } = await req.json();

        if (!address || !role) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        // نقش‌های مجاز برای ارتقاء (جلوگیری از اینکه کسی خودش را ادمین کند)
        const ALLOWED_UPGRADES = ['startup']; 

        if (!ALLOWED_UPGRADES.includes(role)) {
            return NextResponse.json({ error: 'Role upgrade not allowed via API' }, { status: 403 });
        }

        const success = await addRoleToUser(address, role);

        if (success) {
            return NextResponse.json({ success: true, message: `Upgraded to ${role}` });
        } else {
            return NextResponse.json({ success: false, message: 'User not found or role already exists' });
        }

    } catch (error) {
        console.error('Upgrade API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}