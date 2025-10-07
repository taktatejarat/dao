// src/app/api/profile/route.ts

import { type NextRequest, NextResponse } from 'next/server';
import { getProfile, saveProfile } from '@/lib/db'; // Import our new DB functions

/**
 * Handles GET requests to fetch a user profile.
 * e.g., /api/profile?address=0x123...
 */
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const address = searchParams.get('address');
    
    if (!address) {
        return NextResponse.json({ message: 'Address is required.' }, { status: 400 });
    }

    try {
        const userProfile = await getProfile(address);
        
        // If profile is not found, return a default structure as the frontend expects it.
        if (!userProfile) {
            return NextResponse.json({ displayName: '', email: '' }, { status: 200 });
        }
        
        return NextResponse.json(userProfile, { status: 200 });

    } catch (error) {
        console.error("Error in GET /api/profile:", error);
        return NextResponse.json({ message: 'Could not read user profile data.' }, { status: 500 });
    }
}

/**
 * Handles POST requests to create or update a user profile.
 */
export async function POST(request: NextRequest) {
    try {
        const { address, displayName, email } = await request.json();

        if (!address) {
            return NextResponse.json({ message: 'Address is required.' }, { status: 400 });
        }

        // We can add more validation here if needed (e.g., for email format)

        await saveProfile(address, { displayName, email });

        return NextResponse.json({ success: true, message: 'Profile updated successfully.' }, { status: 200 });

    } catch (error) {
        console.error("Error in POST /api/profile:", error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
    }
}