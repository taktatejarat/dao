import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import { generateHTML } from '@/lib/pdf-generator/html-template';
import path from 'path';
import fs from 'fs';

export async function POST(req: NextRequest) {
  console.log("--- [PDF DEBUG] Start Request ---");
  
  try {
    const body = await req.json();
    const { report, proposal, proposalId, locale, labels } = body;
    console.log("1. Data received for ID:", proposalId);

    // بررسی مسیر فونت‌ها (یکی از دلایل رایج کرش کردن)
    const fontDir = path.join(process.cwd(), 'public', 'fonts');
    console.log("2. Checking fonts in:", fontDir);
    
    if (!fs.existsSync(path.join(fontDir, 'Vazirmatn-Regular.ttf'))) {
        throw new Error(`Font file missing: ${path.join(fontDir, 'Vazirmatn-Regular.ttf')}`);
    }
    console.log("   - Fonts found.");

    // تولید HTML
    console.log("3. Generating HTML...");
    const htmlContent = generateHTML({
      report, 
      proposal, 
      proposalId, 
      generatedDate: new Date().toLocaleDateString(locale === 'fa' ? 'fa-IR' : 'en-US'),
      locale,
      labels
    });
    console.log("   - HTML Generated (Length: " + htmlContent.length + ")");

    // اجرای Puppeteer
    console.log("4. Launching Puppeteer...");
    const browser = await puppeteer.launch({
      headless: true,
      // این آرگومان‌ها برای جلوگیری از کرش در لینوکس/داکر حیاتی هستند
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage', // حل مشکل حافظه در کانتینرها
        '--disable-gpu'
      ],
    });
    console.log("   - Browser Launched.");
    
    const page = await browser.newPage();
    console.log("5. New Page Created.");

    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    console.log("6. Content Set.");
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '10mm', bottom: '10mm' }
    });
    console.log("7. PDF Buffer Created (Size: " + pdfBuffer.length + ")");

    await browser.close();
    console.log("8. Browser Closed.");

    const buffer = Buffer.from(pdfBuffer);

    console.log("--- [PDF DEBUG] Success ---");
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="RayanChain-Report-${proposalId}.pdf"`,
      },
    });

  } catch (error: any) {
    console.error("--- [PDF DEBUG] CRITICAL ERROR ---");
    console.error(error); // چاپ کل آبجکت خطا
    
    // اگر خطا مربوط به کتابخانه لینوکس باشد، متن آن را برمی‌گرداند
    const errorMessage = error.message || String(error);
    
    return NextResponse.json({ 
        message: 'Failed to generate PDF', 
        error: errorMessage,
        stack: error.stack 
    }, { status: 500 });
  }
}