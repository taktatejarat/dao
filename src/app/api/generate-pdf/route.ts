// src/app/api/generate-pdf/route.ts - FIXED ORDER & RESOURCE MANAGEMENT

import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import { generateHTML } from '@/lib/pdf-generator/html-template';
import path from 'path';
import fs from 'fs';

// Import Dictionaries
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

const resolvePath = (object: any, path: string, defaultValue: any = null) => {
    if (!path || typeof path !== 'string') return defaultValue || "";
    try {
        return path.split('.').reduce((o, p) => (o ? o[p] : defaultValue), object);
    } catch (e) {
        return defaultValue;
    }
};

export async function POST(req: NextRequest) {
  console.log("--- [PDF GENERATION] Start ---");
  
  let browser = null;

  try {
    const body = await req.json();
    const { report, proposal, proposalId, locale = 'en' } = body; 

    // --- Translation Logic ---
    const targetDict = DICTIONARIES[locale] || en;
    const fallbackDict = en;

    const t = (key: string, params?: any): string => {
        if (!key) return "";
        let value = resolvePath(targetDict, key);
        if (!value || typeof value !== 'string') value = resolvePath(fallbackDict, key);
        if (!value || typeof value !== 'string') {
            const parts = key.split('.');
            return parts.length > 1 ? parts[parts.length - 1].replace(/_/g, ' ') : key;
        }
        let translatedText = value;
        if (params && typeof params === 'object') {
            Object.keys(params).forEach(paramKey => {
                const val = params[paramKey];
                if (val !== undefined && val !== null) {
                    translatedText = translatedText.split(`{${paramKey}}`).join(String(val));
                }
            });
        }
        return translatedText;
    };

    // --- Font Check ---
    const fontDir = path.join(process.cwd(), 'public', 'fonts');
    const requiredFont = ['fa', 'ar'].includes(locale) ? 'Vazirmatn-Regular.ttf' : 'Roboto-Regular.ttf';
    if (!fs.existsSync(path.join(fontDir, requiredFont))) {
        throw new Error(`Required font (${requiredFont}) not found.`);
    }

    // --- Date Format ---
    const dateLocale = LOCALE_MAP[locale] || 'en-US';
    const formattedDate = new Date().toLocaleDateString(dateLocale, {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    // --- HTML Generation ---
    const htmlContent = generateHTML({
      report, proposal, proposalId, generatedDate: formattedDate, locale, t
    });

    // --- Puppeteer Execution ---
    console.log("Launching Puppeteer...");
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage', // Vital for Docker
        '--disable-gpu',
        '--font-render-hinting=none'
      ],
    });
    
    const page = await browser.newPage();
    
    await page.setContent(htmlContent, { 
        waitUntil: 'load', 
        timeout: 30000 
    });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', bottom: '0', left: '0', right: '0' }
    });

    console.log("PDF Buffer Created.");

    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="RayanChain-${locale.toUpperCase()}-${proposalId}.pdf"`,
      },
    });

  } catch (error: any) {
    console.error("--- [PDF GENERATION] ERROR ---", error);
    return NextResponse.json({ 
        message: 'Failed to generate PDF', 
        error: error.message || String(error)
    }, { status: 500 });
    
  } finally {
    if (browser) {
        await browser.close();
        console.log("Browser Closed.");
    }
  }
}