// src/app/api/logs/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

// یک تابع کمکی برای بررسی نقش ادمین
async function isAdminRequest(req: NextRequest): Promise<boolean> {
  // ⚠️ این بخش باید با سیستم احراز هویت شما تطبیق داده شود.
  // مثال: چک کردن یک کلید API امن در هدرها
  const apiKey = req.headers.get('x-admin-api-key');
  return apiKey === process.env.ADMIN_API_KEY;

  // مثال با NextAuth:
  // const session = await getSession({ req });
  // return session?.user?.role === 'admin';
}

export async function GET(req: NextRequest) {
  const isAdmin = await isAdminRequest(req);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    // ✅ FIX: getDb مستقیماً آبجکت db را برمی‌گرداند
    const db = await getDb();
    const collection = db.collection('system_logs');
    
    // دریافت ۱۰۰ لاگ آخر
    const logs = await collection.find().sort({ timestamp: -1 }).limit(100).toArray();

    return NextResponse.json(logs);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch logs', details: (error as Error).message }, { status: 500 });
  }
}