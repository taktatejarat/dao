// src/lib/logger.ts - اصلاح شده برای استفاده از getDb

import { getDb } from './mongodb'; // ✅ CHANGE: استفاده از تابع کمکی جدید

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
export type LogCategory = 'DEPLOYMENT' | 'TRANSACTION' | 'AI_ORACLE' | 'USER_ACTION' | 'SECURITY';

interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  category: LogCategory;
  message: string;
  payload?: any;
}

export async function logEvent(level: LogLevel, category: LogCategory, message: string, payload?: any) {
  try {
    const db = await getDb(); // ✅ CHANGE: دریافت آبجکت db
    const collection = db.collection<LogEntry>('system_logs');
    await collection.insertOne({
      timestamp: new Date(),
      level,
      category,
      message,
      payload,
    });
  } catch (error) {
    console.error("!!! FAILED TO WRITE TO LOG DATABASE !!!", { level, category, message, error });
  }
}