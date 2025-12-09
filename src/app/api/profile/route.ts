// src/app/api/profile/route.ts

import { type NextRequest, NextResponse } from 'next/server';
import { getUserProfile, updateUserProfile } from '@/lib/db'; // ✅ نام‌های جدید

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const address = searchParams.get('address');
    
    if (!address) {
        return NextResponse.json({ message: 'Address is required.' }, { status: 400 });
    }

    try {
        // ✅ استفاده از تابع جدید
        const userDoc = await getUserProfile(address);
        
        if (!userDoc) {
            // بازگرداندن ساختار خالی اگر کاربر نبود
            return NextResponse.json({ displayName: '', email: '' }, { status: 200 });
        }
        
        // بازگرداندن پروفایل (پروفایل داخل داکیومنت است)
        return NextResponse.json(userDoc.profile, { status: 200 });

    } catch (error) {
        console.error("Error in GET /api/profile:", error);
        return NextResponse.json({ message: 'Could not read user profile data.' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const { address, displayName, email } = await request.json();

        if (!address) {
            return NextResponse.json({ message: 'Address is required.' }, { status: 400 });
        }

        // ✅ استفاده از تابع جدید
        await updateUserProfile(address, { displayName, email });

        return NextResponse.json({ success: true, message: 'Profile updated successfully.' }, { status: 200 });

    } catch (error) {
        console.error("Error in POST /api/profile:", error);
        return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
    }
}