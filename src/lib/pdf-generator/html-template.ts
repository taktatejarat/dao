// src/lib/pdf-generator/html-template.ts

import fs from 'fs';
import path from 'path';

interface HtmlTemplateProps {
  report: any;
  proposal: any;
  proposalId: string;
  generatedDate: string;
  locale: string;
  labels: {
    // لیست کامل لیبل‌ها برای ترجمه
    rayan_chain_vc: string;
    date: string;
    id: string;
    industry: string;
    model: string;
    website: string;
    teamExp: string;
    details: string;
    full_description: string;
    problem: string;
    solution: string;
    data_analysis: string;
    market: string;
    competitors: string;
    financials: string;
    burn_rate: string;
    revenue: string;
    break_even: string;
    milestones: string;
    milestone_name: string;
    duration: string;
    amount: string;
    ai_audit_report: string;
    ai_recommendation: string;
    investability_score: string;
    overall_risk_level: string;
    key_metrics: string;
    success_probability: string;
    financial_risk_score: string;
    team_competency: string;
    market_sentiment: string;
    strengths: string;
    weaknesses: string;
    generated_footer: string;
    no_data: string;
  };
}

const loadFontAsBase64 = (fileName: string) => {
  try {
    const filePath = path.join(process.cwd(), 'public', 'fonts', fileName);
    return fs.readFileSync(filePath).toString('base64');
  } catch (error) { return ''; }
};

export const generateHTML = ({ report, proposal, proposalId, generatedDate, locale, labels }: HtmlTemplateProps) => {
  const isRTL = ['fa', 'ar'].includes(locale);
  const dir = isRTL ? 'rtl' : 'ltr';
  const textAlign = isRTL ? 'right' : 'left';
  const reverseTextAlign = isRTL ? 'left' : 'right';
  
  // لود فونت‌ها
  const vazirReg = loadFontAsBase64('Vazirmatn-Regular.ttf');
  const vazirBold = loadFontAsBase64('Vazirmatn-Bold.ttf');
  const robotoReg = loadFontAsBase64('Roboto-Regular.ttf');
  const robotoBold = loadFontAsBase64('Roboto-Bold.ttf');

  const safe = (val: any) => (val ? val : "-");
  const money = (val: any) => (val ? `$${Number(val).toLocaleString()}` : "-");

  const css = `
    @font-face { font-family: 'Vazirmatn'; src: url(data:font/ttf;charset=utf-8;base64,${vazirReg}) format('truetype'); font-weight: normal; }
    @font-face { font-family: 'Vazirmatn'; src: url(data:font/ttf;charset=utf-8;base64,${vazirBold}) format('truetype'); font-weight: bold; }
    @font-face { font-family: 'Roboto'; src: url(data:font/ttf;charset=utf-8;base64,${robotoReg}) format('truetype'); font-weight: normal; }
    @font-face { font-family: 'Roboto'; src: url(data:font/ttf;charset=utf-8;base64,${robotoBold}) format('truetype'); font-weight: bold; }
    
    body {
      font-family: ${isRTL ? "'Vazirmatn', sans-serif" : "'Roboto', sans-serif"};
      margin: 0;
      padding: 0; /* پدینگ را به page منتقل کردیم */
      background: #fff;
      color: #333;
      direction: ${dir};
      text-align: ${textAlign};
      font-size: 14px; /* سایز پایه کمی بزرگتر */
    }
    
    /* تنظیمات صفحه برای جلوگیری از صفحات سفید اضافه */
    .page {
      page-break-after: always;
      position: relative;
      /* حذف min-height: 297mm که باعث ایجاد صفحه خالی می‌شد */
      padding: 40px; 
      box-sizing: border-box;
      width: 100%;
    }
    .page:last-child {
      page-break-after: auto;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 15px;
      margin-bottom: 25px;
      flex-direction: ${isRTL ? 'row' : 'row-reverse'};
    }
    .brand { font-size: 22px; font-weight: bold; color: #2563eb; }
    .meta { text-align: ${reverseTextAlign}; font-size: 11px; color: #666; direction: ltr; }
    
    h1 { font-size: 26px; text-align: center; margin-bottom: 5px; color: #111827; }
    h2 { 
      font-size: 16px; color: #2563eb; 
      border-bottom: 1px solid #eee; padding-bottom: 8px; margin-top: 25px; margin-bottom: 15px; 
    }
    
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
    .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
    .grid-4 { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 10px; }
    
    .card {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 12px;
      break-inside: avoid; /* جلوگیری از نصف شدن کارت بین صفحات */
    }
    
    .label { font-size: 10px; color: #6b7280; margin-bottom: 4px; }
    .value { font-size: 13px; font-weight: bold; color: #111827; }
    .ltr-val { direction: ltr; unicode-bidi: embed; }
    
    .ai-box {
      background: #f5f3ff;
      border: 1px solid #7c3aed;
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-direction: ${isRTL ? 'row' : 'row-reverse'};
    }
    
    .score-circle {
      width: 70px; height: 70px;
      border-radius: 50%;
      background: #2563eb;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      font-weight: bold;
    }
    
    .tag {
      display: inline-block; padding: 4px 10px; border-radius: 15px;
      font-size: 11px; font-weight: bold; margin-top: 8px;
    }
    .tag-low { background: #dcfce7; color: #166534; }
    .tag-medium { background: #fef9c3; color: #854d0e; }
    .tag-high { background: #fee2e2; color: #991b1b; }

    .strength-item { 
      background: #f0fdf4; color: #14532d; padding: 8px; margin-bottom: 5px; border-radius: 4px; font-size: 11px; 
      border-${isRTL ? 'right' : 'left'}: 3px solid #22c55e; 
    }
    .weakness-item { 
      background: #fef2f2; color: #7f1d1d; padding: 8px; margin-bottom: 5px; border-radius: 4px; font-size: 11px; 
      border-${isRTL ? 'right' : 'left'}: 3px solid #ef4444; 
    }

    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
    th { text-align: ${textAlign}; color: #666; padding: 8px; border-bottom: 1px solid #000; }
    td { padding: 8px; border-bottom: 1px solid #eee; text-align: ${textAlign}; }
    
    .footer {
      position: fixed; bottom: 0; left: 0; right: 0; 
      text-align: center; font-size: 9px; color: #9ca3af; padding: 15px;
      background: #fff; /* برای پوشاندن محتوا اگر اورلپ شد */
    }
    
    p { line-height: 1.6; text-align: justify; margin: 0 0 10px 0; }
  `;

  // محاسبه کلاس رنگی
  let riskClass = 'tag-medium';
  if (report.overall_risk_level_key.includes('low')) riskClass = 'tag-low';
  if (report.overall_risk_level_key.includes('high')) riskClass = 'tag-high';

  return `
    <!DOCTYPE html>
    <html lang="${locale}" dir="${dir}">
    <head>
      <meta charset="UTF-8">
      <style>${css}</style>
    </head>
    <body>
      
      <!-- PAGE 1: PROPOSAL INFO -->
      <div class="page">
        <div class="header">
          <div class="brand">${labels.rayan_chain_vc}</div>
          <div class="meta">
            ${labels.id}: ${proposalId}<br>
            ${labels.date}: ${generatedDate}
          </div>
        </div>

        <h1>${safe(proposal.projectName)}</h1>
        <p style="text-align: center; color: #666; font-style: italic;">${safe(proposal.tagline)}</p>

        <div class="grid-2" style="margin-top: 30px;">
          <div class="card"><div class="label">${labels.industry}</div><div class="value">${safe(proposal.startupIndustry)}</div></div>
          <div class="card"><div class="label">${labels.model}</div><div class="value">${safe(proposal.businessModel)}</div></div>
        </div>

        <div class="grid-2" style="margin-top: 10px;">
          <div class="card"><div class="label">${labels.website}</div><div class="value ltr-val" style="text-align: ${textAlign};">${safe(proposal.website)}</div></div>
          <div class="card"><div class="label">${labels.teamExp}</div><div class="value">${safe(proposal.teamExperienceYears)}</div></div>
        </div>

        <h2>${labels.details}</h2>
        <div class="label">${labels.full_description}</div>
        <p>${safe(proposal.description)}</p>
        
        <div class="label">${labels.problem}</div>
        <p>${safe(proposal.problem)}</p>
        
        <div class="label">${labels.solution}</div>
        <p>${safe(proposal.solution)}</p>
        
        <div class="footer">${labels.generated_footer} | Page 1/3</div>
      </div>

      <!-- PAGE 2: DATA ANALYSIS -->
      <div class="page">
        <div class="header"><div class="brand">${labels.data_analysis}</div></div>

        <h2>${labels.market}</h2>
        <div class="grid-3">
          <div class="card"><div class="label">TAM</div><div class="value ltr-val">${money(proposal.marketStats?.tam)}</div></div>
          <div class="card"><div class="label">SAM</div><div class="value ltr-val">${money(proposal.marketStats?.sam)}</div></div>
          <div class="card"><div class="label">SOM</div><div class="value ltr-val">${money(proposal.marketStats?.som)}</div></div>
        </div>
        <div style="margin-top: 15px;">
           <div class="label">${labels.competitors}</div>
           <p>${safe(proposal.marketStats?.competitors)}</p>
        </div>

        <h2>${labels.financials}</h2>
        <div class="grid-3">
          <div class="card"><div class="label">${labels.burn_rate}</div><div class="value ltr-val">${money(proposal.financialStats?.burnRate)}/mo</div></div>
          <div class="card"><div class="label">${labels.revenue}</div><div class="value ltr-val">${money(proposal.financialStats?.revenueProj)}</div></div>
          <div class="card"><div class="label">${labels.break_even}</div><div class="value">${safe(proposal.financialStats?.breakEven)}</div></div>
        </div>

        <h2>${labels.milestones}</h2>
        <table>
          <thead><tr><th>${labels.milestone_name}</th><th>${labels.duration}</th><th>${labels.amount}</th></tr></thead>
          <tbody>
            ${proposal.milestones?.map((m: any) => `
              <tr>
                <td>${m.name}</td>
                <td>${m.durationDays}</td>
                <td class="ltr-val" style="font-weight: bold;">${Number(m.amount).toLocaleString()} RYC</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="footer">${labels.generated_footer} | Page 2/3</div>
      </div>

      <!-- PAGE 3: AI REPORT -->
      <div class="page">
        <div class="header"><div class="brand">${labels.ai_audit_report}</div></div>

        <div class="ai-box">
          <div style="flex: 1; padding: 0 15px;">
            <div style="font-size: 11px; color: #5b21b6; margin-bottom: 5px;">${labels.ai_recommendation}</div>
            <div style="font-size: 13px; line-height: 1.6; font-weight: bold; color: #4c1d95;">
              ${report.recommendation_text}
            </div>
          </div>
          <div style="text-align: center;">
            <div class="score-circle">${report.investability_score}</div>
            <div class="tag ${riskClass}" style="margin-top: 10px;">${report.overall_risk_level_label}</div>
          </div>
        </div>

        <h2>${labels.key_metrics}</h2>
        <div class="grid-4">
          <div class="card" style="text-align: center;">
            <div class="label">${labels.success_probability}</div>
            <div class="value ltr-val" style="color: #2563eb; font-size: 18px;">${safe(report.success_probability)}%</div>
          </div>
          <div class="card" style="text-align: center;">
            <div class="label">${labels.financial_risk_score}</div>
            <div class="value ltr-val" style="color: #dc2626; font-size: 18px;">${safe(report.risk_score)}</div>
          </div>
          <div class="card" style="text-align: center;">
            <div class="label">${labels.team_competency}</div>
            <div class="value ltr-val" style="color: #16a34a; font-size: 18px;">${safe(report.team_competency_score)}</div>
          </div>
          <div class="card" style="text-align: center;">
            <div class="label">${labels.market_sentiment}</div>
            <div class="value ltr-val" style="color: #2563eb; font-size: 18px;">
                ${report.market_sentiment_score ? (report.market_sentiment_score * 100).toFixed(0) : "0"}%
            </div>
          </div>
        </div>

        <div class="grid-2" style="margin-top: 30px;">
          <div>
            <h3 style="color: #16a34a;">${labels.strengths}</h3>
            ${report.xai_report.strengths.length > 0 ? report.xai_report.strengths.map((s: any) => `
              <div class="strength-item">${s.display_text}</div>
            `).join('') : `<p style="font-size: 12px; color: #999;">${labels.no_data}</p>`}
          </div>
          <div>
            <h3 style="color: #dc2626;">${labels.weaknesses}</h3>
            ${report.xai_report.weaknesses.length > 0 ? report.xai_report.weaknesses.map((w: any) => `
              <div class="weakness-item">${w.display_text}</div>
            `).join('') : `<p style="font-size: 12px; color: #999;">${labels.no_data}</p>`}
          </div>
        </div>

        <div class="footer">${labels.generated_footer} | Page 3/3</div>
      </div>

    </body>
    </html>
  `;
};