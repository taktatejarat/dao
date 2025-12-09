// src/lib/db.ts

import clientPromise from './mongodb';
import { type Collection, ObjectId } from 'mongodb';

// --- 1. تعریف دقیق مدل داده کاربر ---
export interface UserProfile {
    displayName?: string;
    email?: string;
    companyName?: string; // مخصوص استارتاپ‌ها
    bio?: string;
    avatarUrl?: string;
    website?: string;
}

export interface UserDocument {
    _id?: ObjectId;
    walletAddress: string; // کلید یکتا (همیشه حروف کوچک)
    roles: string[];       // مثال: ['user', 'startup', 'admin']
    kycStatus: 'none' | 'pending' | 'verified' | 'rejected';
    profile: UserProfile;
    createdAt: Date;
    lastLogin: Date;
    // فیلدهای سیستمی
    nonce?: string;        // برای امضای دیجیتال (اختیاری)
}

const DB_NAME = process.env.MONGODB_DB || "dao-vc";
const COLLECTION_NAME = "users";

// --- 2. تابع کمکی اتصال به دیتابیس ---
async function getUsersCollection(): Promise<Collection<UserDocument>> {
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    return db.collection<UserDocument>(COLLECTION_NAME);
}

/**
 * دریافت کاربر یا ایجاد آن در اولین ورود (Login Logic)
 * اگر کاربر وجود نداشته باشد، با نقش پیش‌فرض 'user' ساخته می‌شود.
 */
export async function getOrCreateUser(address: string): Promise<UserDocument> {
    if (!address) throw new Error("Wallet address is required");
    
    const collection = await getUsersCollection();
    const normalizedAddr = address.toLowerCase();

    try {
        // ۱. تلاش برای یافتن کاربر
        let user = await collection.findOne({ walletAddress: normalizedAddr });

        if (!user) {
            // ۲. اگر نبود، ایجاد کاربر جدید
            const newUser: UserDocument = {
                walletAddress: normalizedAddr,
                roles: ['user'], // نقش پیش‌فرض: سرمایه‌گذار/کاربر عادی
                kycStatus: 'none',
                profile: {
                    displayName: `User ${normalizedAddr.slice(0, 6)}`,
                },
                createdAt: new Date(),
                lastLogin: new Date()
            };
            
            const result = await collection.insertOne(newUser);
            user = { ...newUser, _id: result.insertedId };
            console.log(`✨ New user created: ${normalizedAddr}`);
        } else {
            // ۳. اگر بود، آپدیت زمان آخرین ورود
            await collection.updateOne(
                { walletAddress: normalizedAddr },
                { $set: { lastLogin: new Date() } }
            );
        }

        return user;
    } catch (error) {
        console.error("DB Error in getOrCreateUser:", error);
        throw new Error("Database operation failed");
    }
}

/**
 * دریافت پروفایل کاربر (بدون ایجاد)
 */
export async function getUserProfile(address: string): Promise<UserDocument | null> {
    if (!address) return null;
    const collection = await getUsersCollection();
    return collection.findOne({ walletAddress: address.toLowerCase() });
}

/**
 * ارتقاء نقش کاربر (مثلاً اضافه کردن نقش 'startup')
 * از $addToSet استفاده می‌کند تا نقش تکراری اضافه نشود.
 */
export async function addRoleToUser(address: string, role: string): Promise<boolean> {
    if (!address || !role) return false;
    
    const collection = await getUsersCollection();
    const normalizedAddr = address.toLowerCase();
    
    const result = await collection.updateOne(
        { walletAddress: normalizedAddr },
        { 
            $addToSet: { roles: role },
            $set: { lastUpdated: new Date() } // اختیاری: ثبت زمان تغییر
        } as any
    );
    
    return result.modifiedCount > 0;
}

/**
 * بروزرسانی اطلاعات پروفایل (نام، ایمیل، بیو و...)
 * از Dot Notation استفاده می‌کند تا کل آبجکت profile پاک نشود.
 */
export async function updateUserProfile(address: string, data: Partial<UserProfile>): Promise<boolean> {
    if (!address) return false;

    const collection = await getUsersCollection();
    const normalizedAddr = address.toLowerCase();

    // ساخت آبجکت آپدیت به صورت تودرتو (مثلاً "profile.email")
    const updateFields: any = {};
    for (const [key, value] of Object.entries(data)) {
        if (value !== undefined) {
            updateFields[`profile.${key}`] = value;
        }
    }

    if (Object.keys(updateFields).length === 0) return false;

    const result = await collection.updateOne(
        { walletAddress: normalizedAddr },
        { $set: updateFields }
    );

    return result.modifiedCount > 0;
}