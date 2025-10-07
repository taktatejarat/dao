// src/lib/db.ts

import clientPromise from './mongodb';
import { type Db, type Collection, type Document } from 'mongodb';

// ۱. تعریف نوع داده‌های اصلی پروفایل (بدون فیلد _id)
export interface ProfileData {
    displayName: string;
    email: string;
}

// ۲. تعریف نوع داکیومنتی که در MongoDB ذخیره می‌شود
// اینترفیس ProfileData را به ارث می‌برد و نوع _id را به صراحت string تعریف می‌کند
interface ProfileDocument extends ProfileData, Document {
    _id: string;
}

// Helper function to connect to the DB and get the correctly typed collection
async function getProfilesCollection(): Promise<Collection<ProfileDocument>> {
    const client = await clientPromise;
    const db: Db = client.db("dao-vc"); // نام دیتابیس شما
    return db.collection<ProfileDocument>("profiles");
}

/**
 * Fetches a user profile from the database.
 * @param address The user's wallet address.
 * @returns The profile data (without _id) or null if not found.
 */
export async function getProfile(address: string): Promise<ProfileData | null> {
    if (!address) return null;

    try {
        const collection = await getProfilesCollection();
        
        // حالا این کوئری از نظر تایپ صحیح است چون collection می‌داند _id از نوع string است
        const profileDocument = await collection.findOne({ _id: address.toLowerCase() });

        if (!profileDocument) {
            return null;
        }

        // ما _id را از نتیجه حذف می‌کنیم و فقط داده‌های پروفایل را برمی‌گردانیم
        const { _id, ...profileData } = profileDocument;
        return profileData;

    } catch (error) {
        console.error("Error fetching profile from MongoDB:", error);
        throw new Error("Failed to retrieve profile data.");
    }
}

/**
 * Creates or updates a user profile in the database.
 * @param address The user's wallet address.
 * @param profileData The profile data to save (displayName, email).
 */
export async function saveProfile(address: string, profileData: ProfileData): Promise<void> {
    if (!address || !profileData) return;

    try {
        const collection = await getProfilesCollection();
        
        // این کوئری نیز اکنون از نظر تایپ صحیح است
        await collection.updateOne(
            { _id: address.toLowerCase() }, // The filter to find the document
            { $set: profileData },         // The data to update or insert
            { upsert: true }               // Option to create the document if it doesn't exist
        );

    } catch (error) {
        console.error("Error saving profile to MongoDB:", error);
        throw new Error("Failed to save profile data.");
    }
}