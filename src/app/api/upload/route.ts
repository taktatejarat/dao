// src/app/api/upload/route.ts

import { NextRequest, NextResponse } from 'next/server';
import PinataSDK from "@pinata/sdk";
import { Readable } from "stream";

// مقداردهی اولیه Pinata SDK با کلید JWT شما
const pinata = new PinataSDK({ pinataJWTKey: process.env.PINATA_JWT });

export async function POST(req: NextRequest) {
    try {
        // ۱. دریافت داده‌های فرم که شامل فایل است
        const data = await req.formData();
        const file: File | null = data.get('file') as unknown as File;

        // ۲. اعتبارسنجی: بررسی اینکه آیا فایلی ارسال شده است یا خیر
        if (!file) {
            return NextResponse.json({ success: false, message: 'No file found.' }, { status: 400 });
        }

        console.log("Uploading file to Pinata:", file.name);

        // ۳. تبدیل فایل به یک Readable Stream برای SDK
        const stream = Readable.from(Buffer.from(await file.arrayBuffer()));
        
        const options = {
            pinataMetadata: {
                name: file.name, // ذخیره نام اصلی فایل در Pinata
            },
        };

        // ۴. آپلود فایل در IPFS از طریق Pinata
        const result = await pinata.pinFileToIPFS(stream, options);

        // ۵. ارسال هش IPFS (CID) به فرانت‌اند
        console.log("File uploaded successfully. IPFS Hash:", result.IpfsHash);
        return NextResponse.json({ success: true, ipfsHash: result.IpfsHash }, { status: 200 });

    } catch (error) {
        console.error("Error uploading to Pinata:", error);
        return NextResponse.json({ success: false, message: 'Error uploading file.' }, { status: 500 });
    }
}