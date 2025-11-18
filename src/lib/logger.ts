// src/lib/logger.ts - نسخه نهایی و تکمیل شده
import { getDb } from './mongodb';

// FIX: افزودن دسته‌بندی‌های جدید برای پوشش تمام سناریوها
export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
export type LogCategory = 
  // دسته‌بندی‌های اصلی
  | 'DEPLOYMENT'    // رویدادهای مربوط به استقرار قراردادها
  | 'TRANSACTION'   // تراکنش‌های آن‌چین
  | 'AI_ORACLE'     // فعالیت‌های مربوط به اوراکل هوش مصنوعی
  | 'USER_ACTION'   // اقدامات کلی کاربر در UI
  | 'SECURITY'      // هشدارهای امنیتی
  | 'AI_REPORT_FETCH'
  | 'AI_ENGINE_ERROR'  
  | 'AI_REPORT_SUCCESS'     
  
  // دسته‌بندی‌های جدید برای API ها
  | 'API_REQUEST'   // درخواست‌های ورودی به API
  | 'API_VALIDATION'// خطاهای اعتبارسنجی در API
  | 'API_ERROR'     // خطاهای عمومی در API
  | 'API_FETCH'     // درخواست‌های خروجی از API
  
  // دسته‌بندی‌های جدید برای فرآیندهای خاص
  | 'PROPOSAL_SUBMIT' // فرآیند ثبت پروپوزال
  | 'FILE_UPLOAD'     // فرآیند آپلود فایل
  | 'DB_CONNECTION' // رویدادهای مربوط به اتصال به پایگاه داده
  ;

interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  category: LogCategory;
  message: string;
  payload?: any;
}

/**
 * یک رویداد را در کالکشن system_logs در MongoDB ثبت می‌کند.
 * @param level سطح اهمیت لاگ (INFO, WARN, ERROR)
 * @param category دسته‌بندی عملکردی لاگ
 * @param message پیام اصلی لاگ
 * @param payload داده‌های اضافی برای دیباگ (اختیاری)
 */
export async function logEvent(level: LogLevel, category: LogCategory, message: string, payload?: any) {
  try {
    const db = await getDb();
    const collection = db.collection<LogEntry>('system_logs');
    
    // اطمینان از اینکه payload قابل serialize شدن در BSON (فرمت MongoDB) است
    const sanitizedPayload = payload ? JSON.parse(JSON.stringify(payload, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
    )) : undefined;

    await collection.insertOne({
      timestamp: new Date(),
      level,
      category,
      message,
      payload: sanitizedPayload,
    });
  } catch (error) {
    // اگر لاگ کردن در دیتابیس با شکست مواجه شد، حداقل در کنسول سرور لاگ کن
    console.error("!!! CRITICAL: FAILED TO WRITE TO LOG DATABASE !!!", {
      logDetails: { level, category, message },
      dbError: (error as Error).message,
    });
  }
}