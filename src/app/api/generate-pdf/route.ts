// src/app/api/generate-pdf/route.ts - WITH KEY-LEVEL FALLBACK TO ENGLISH

import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import { generateHTML } from '@/lib/pdf-generator/html-template';
import path from 'path';
import fs from 'fs';

// ایمپورت تمام دیکشنری‌های زبان
import { fa } from '@/lib/i18n/fa';
import { en } from '@/lib/i18n/en';
import { ar } from '@/lib/i18n/ar';
import { de } from '@/lib/i18n/de';
import { ru } from '@/lib/i18n/ru';
import { tr } from '@/lib/i18n/tr';

const DICTIONARIES: Record<string, any> = { fa, en, ar, de, ru, tr };

const LOCALE_MAP: Record<string, string> = {
    fa: 'fa-IR', en: 'en-US', ar: 'ar-SA', 
    de: 'de-DE', ru: 'ru-RU', tr: 'tr-TR'
};

// تابع کمکی برای پیمایش در آبجکت دیکشنری
const resolvePath = (object: any, path: string, defaultValue: any = null) => {
    return path.split('.').reduce((o, p) => (o ? o[p] : defaultValue), object);
};

export async function POST(req: NextRequest) {
  console.log("--- [PDF GENERATION] Start ---");
  
  try {
    const body = await req.json();
    const { report, proposal, proposalId, locale = 'en' } = body; 

    // 1. تعیین دیکشنری هدف و دیکشنری فال‌بک (انگلیسی)
    const targetDict = DICTIONARIES[locale] || en;
    const fallbackDict = en;

    // 2. ساخت تابع ترجمه هوشمند با قابلیت Fallback
    const t = (key: string, params?: any): string => {
        // الف: تلاش برای یافتن در زبان انتخاب شده
        let value = resolvePath(targetDict, key);

        // ب: اگر پیدا نشد یا رشته نبود، تلاش در زبان انگلیسی (Fallback)
        if (!value || typeof value !== 'string') {
            value = resolvePath(fallbackDict, key);
        }

        // ج: اگر در انگلیسی هم نبود، خود کلید را برگردان
        if (!value || typeof value !== 'string') {
            return key;
        }

        // د: جایگزینی پارامترها
        let translatedText = value;
        if (params) {
            Object.keys(params).forEach(paramKey => {
                // جایگزینی تمام تکرارها
                translatedText = translatedText.split(`{${paramKey}}`).join(params[paramKey]);
            });
        }

        return translatedText;
    };

    // 3. بررسی فونت
    const fontDir = path.join(process.cwd(), 'public', 'fonts');
    // برای فارسی و عربی وزیر، برای بقیه روبوتو
    const requiredFont = ['fa', 'ar'].includes(locale) ? 'Vazirmatn-Regular.ttf' : 'Roboto-Regular.ttf';
    
    if (!fs.existsSync(path.join(fontDir, requiredFont))) {
        throw new Error(`Required font (${requiredFont}) not found.`);
    }

    // 4. فرمت تاریخ
    const dateLocale = LOCALE_MAP[locale] || 'en-US';
    const formattedDate = new Date().toLocaleDateString(dateLocale, {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    // 5. تولید HTML
    const htmlContent = generateHTML({
      report, 
      proposal, 
      proposalId, 
      generatedDate: formattedDate,
      locale,
      t // تابع ترجمه هوشمند
    });

    // 6. اجرای Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--font-render-hinting=none'],
    });
    
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', bottom: '0', left: '0', right: '0' }
    });

    await browser.close();

    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="RayanChain-${locale.toUpperCase()}-${proposalId}.pdf"`,
      },
    });

  } catch (error: any) {
    console.error("PDF Error:", error);
    return NextResponse.json({ message: 'Failed to generate PDF', error: error.message }, { status: 500 });
  }
}