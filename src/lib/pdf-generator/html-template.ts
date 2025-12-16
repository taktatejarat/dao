// src/lib/pdf-generator/html-template.ts - PROFESSIONAL VC REPORT TEMPLATE

import fs from 'fs';
import path from 'path';

interface HtmlTemplateProps {
  report: any;
  proposal: any;
  proposalId: string;
  generatedDate: string;
  locale: string;
  t: (key: string, values?: any) => string;
}

const loadFontAsBase64 = (fileName: string) => {
  try {
    const filePath = path.join(process.cwd(), 'public', 'fonts', fileName);
    return fs.readFileSync(filePath).toString('base64');
  } catch (error) { return ''; }
};

export const generateHTML = ({ report, proposal, proposalId, generatedDate, locale, t }: HtmlTemplateProps) => {
  const isRTL = ['fa', 'ar'].includes(locale);
  const dir = isRTL ? 'rtl' : 'ltr';
  const align = isRTL ? 'right' : 'left';
  const reverseAlign = isRTL ? 'left' : 'right';

  // --- Helpers ---
  const safe = (val: any) => (val && val !== 'undefined' ? val : "-");
  const currency = (val: any) => (val ? `$${Number(val).toLocaleString()}` : "-");
  const percent = (val: any) => (val ? `${val}%` : "-");
  
  // ترجمه مقادیر ثابت
  const trIndustry = (val: string) => t(`industries.${val}`) !== `industries.${val}` ? t(`industries.${val}`) : val;
  const trModel = (val: string) => t(`business_models.${val}`) !== `business_models.${val}` ? t(`business_models.${val}`) : val;
  const trStage = (val: string) => val === 'revenue' ? t('proposals.new.stage_revenue') : t('proposals.new.stage_idea');

  // رندر لیست XAI
  const renderXAIList = (items: any[]) => {
      if (!items || items.length === 0) return `<li class="empty">${t('pdf.no_data')}</li>`;
      return items.map(item => {
          let text = t(item.key, item.values);
          if (text === item.key) text = item.key.split('.').pop() || text; // Fallback
          // جایگزینی دستی متغیرها اگر سیستم ترجمه پشتیبانی نکند
          if(item.values?.val) text = text.replace('{val}', item.values.val);
          return `<li>${text}</li>`;
      }).join('');
  };

  // تنظیم رنگ و درصد ریسک
  const riskScore = report.risk_score || 50;
  let riskColor = "#eab308"; // Yellow
  if (riskScore <= 30) riskColor = "#16a34a"; // Green
  if (riskScore >= 70) riskColor = "#dc2626"; // Red

  // فونت‌ها
  const fontReg = isRTL ? loadFontAsBase64('Vazirmatn-Regular.ttf') : loadFontAsBase64('Roboto-Regular.ttf');
  const fontBold = isRTL ? loadFontAsBase64('Vazirmatn-Bold.ttf') : loadFontAsBase64('Roboto-Bold.ttf');
  const fontFamily = isRTL ? 'Vazirmatn' : 'Roboto';

  // --- CSS Styles ---
  const css = `
    @font-face { font-family: '${fontFamily}'; src: url(data:font/ttf;charset=utf-8;base64,${fontReg}) format('truetype'); font-weight: normal; }
    @font-face { font-family: '${fontFamily}'; src: url(data:font/ttf;charset=utf-8;base64,${fontBold}) format('truetype'); font-weight: bold; }
    
    :root { --primary: #0f172a; --accent: #2563eb; --gray: #64748b; --light: #f1f5f9; }
    
    body { font-family: '${fontFamily}', sans-serif; direction: ${dir}; text-align: ${align}; margin: 0; padding: 0; color: #334155; font-size: 11px; line-height: 1.5; }
    
    /* Layout */
    .page { padding: 40px 50px; position: relative; height: 100%; page-break-after: always; }
    .page:last-child { page-break-after: auto; }
    .container { width: 100%; }
    
    /* Headers */
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid var(--primary); padding-bottom: 10px; margin-bottom: 20px; }
    .brand { font-size: 18px; font-weight: bold; color: var(--primary); }
    .meta { font-size: 9px; color: var(--gray); text-align: ${reverseAlign}; }
    
    .section-title { 
        font-size: 14px; font-weight: bold; color: var(--accent); text-transform: uppercase; letter-spacing: 1px;
        border-bottom: 1px solid #cbd5e1; padding-bottom: 5px; margin: 25px 0 15px 0;
    }

    /* Cover Page */
    .cover-content { text-align: center; margin-top: 150px; }
    .cover-title { font-size: 36px; font-weight: bold; color: var(--primary); margin-bottom: 10px; }
    .cover-subtitle { font-size: 16px; color: var(--gray); margin-bottom: 50px; }
    .cover-meta { border: 1px solid #cbd5e1; display: inline-block; padding: 20px 40px; border-radius: 8px; background: var(--light); }
    .cover-badge { background: var(--primary); color: white; padding: 5px 10px; border-radius: 4px; font-size: 10px; text-transform: uppercase; margin-top: 20px; display: inline-block;}

    /* Grids & Cards */
    .grid { display: table; width: 100%; border-collapse: collapse; margin-bottom: 10px; }
    .row { display: table-row; }
    .col { display: table-cell; vertical-align: top; padding: 5px; }
    .col-2 { width: 50%; }
    .col-3 { width: 33.33%; }
    
    .card { background: #fff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; height: 100%; }
    .card-label { font-size: 9px; color: var(--gray); text-transform: uppercase; font-weight: bold; display: block; margin-bottom: 4px; }
    .card-value { font-size: 13px; font-weight: bold; color: var(--primary); }
    .ltr-val { direction: ltr; unicode-bidi: embed; text-align: ${align}; }

    /* Tables */
    table { width: 100%; border-collapse: collapse; font-size: 10px; margin-top: 5px; }
    th { background: var(--light); padding: 8px; text-align: ${align}; border-bottom: 2px solid #cbd5e1; font-weight: bold; color: var(--primary); }
    td { padding: 8px; border-bottom: 1px solid #e2e8f0; }
    tr:nth-child(even) { background-color: #f8fafc; }

    /* AI Section */
    .risk-header { background: var(--light); padding: 20px; border-radius: 8px; text-align: center; border: 1px solid #e2e8f0; }
    .risk-score { font-size: 48px; font-weight: bold; color: ${riskColor}; line-height: 1; }
    .risk-desc { margin-top: 10px; font-size: 12px; font-weight: bold; }
    
    .swot-container { margin-top: 20px; }
    .swot-box { margin-bottom: 10px; }
    .swot-title { font-weight: bold; font-size: 12px; margin-bottom: 5px; padding-bottom: 3px; border-bottom: 2px solid; display: inline-block; }
    .strength { color: #16a34a; border-color: #16a34a; }
    .weakness { color: #dc2626; border-color: #dc2626; }
    
    ul { margin: 0; padding-${align}: 20px; }
    li { margin-bottom: 4px; }
    li.empty { color: #94a3b8; font-style: italic; list-style: none; }

    /* Footer */
    .footer { position: fixed; bottom: 20px; left: 0; right: 0; text-align: center; font-size: 8px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; margin: 0 50px; }
  `;

  return `
    <!DOCTYPE html>
    <html lang="${locale}" dir="${dir}">
    <head><meta charset="UTF-8"><style>${css}</style></head>
    <body>

      <!-- PAGE 1: COVER -->
      <div class="page">
        <div class="header"><div class="brand">RayanChain Protocol</div><div class="meta">Confidential Investment Memo</div></div>
        
        <div class="cover-content">
           <div class="cover-title">${safe(proposal.projectName)}</div>
           <div class="cover-subtitle">${safe(proposal.tagline)}</div>
           
           <div class="cover-meta">
              <div class="grid">
                 <div class="row">
                    <div class="col"><span class="card-label">${t('proposals.new.stage_title')}</span><span class="card-value">${trStage(proposal.startupStage)}</span></div>
                    <div class="col"><span class="card-label">${t('proposals.new.lbl_industry')}</span><span class="card-value">${trIndustry(proposal.startupIndustry)}</span></div>
                 </div>
                 <div class="row" style="margin-top:15px">
                    <div class="col"><span class="card-label">${t('pdf.project_id')}</span><span class="card-value" style="font-family: monospace;">${proposalId.substring(0,8)}...</span></div>
                    <div class="col"><span class="card-label">${t('pdf.date')}</span><span class="card-value">${generatedDate}</span></div>
                 </div>
              </div>
           </div>
           <br>
           <div class="cover-badge">${t('proposal_detail.ai_report_title')}</div>
        </div>

        <div class="footer">${t('pdf.generated_footer')} | Page 1</div>
      </div>

      <!-- PAGE 2: EXECUTIVE SUMMARY & TEAM -->
      <div class="page">
        <div class="header"><div class="brand">${safe(proposal.projectName)}</div><div class="meta">Executive Summary</div></div>

        <div class="section-title">${t('pdf.project_info')}</div>
        <p style="text-align: justify; margin-bottom: 20px;">${safe(proposal.description)}</p>
        
        <div class="grid">
           <div class="row">
              <div class="col col-2">
                 <div class="card">
                    <span class="card-label">${t('proposals.new.lbl_problem_solution')} (Problem)</span>
                    <p style="margin: 5px 0 0 0; font-size: 10px;">${safe(proposal.problem)}</p>
                 </div>
              </div>
              <div class="col col-2">
                 <div class="card">
                    <span class="card-label">${t('proposals.new.lbl_problem_solution')} (Solution)</span>
                    <p style="margin: 5px 0 0 0; font-size: 10px;">${safe(proposal.solution)}</p>
                 </div>
              </div>
           </div>
        </div>

        <div class="section-title">${t('proposals.new.step2_title')} (Team & Structure)</div>
        <div class="grid">
           <div class="row">
              <div class="col"><div class="card"><span class="card-label">${t('proposals.new.lbl_team_size')}</span><span class="card-value">${safe(proposal.teamSize)}</span></div></div>
              <div class="col"><div class="card"><span class="card-label">${t('proposals.new.lbl_founded_date')}</span><span class="card-value">${safe(proposal.foundedDate)}</span></div></div>
              <div class="col"><div class="card"><span class="card-label">${t('proposals.new.lbl_company_reg_id')}</span><span class="card-value">${safe(proposal.companyRegId)}</span></div></div>
              <div class="col"><div class="card"><span class="card-label">${t('proposals.new.lbl_team_experience')}</span><span class="card-value">${safe(proposal.teamExperienceYears)} Yrs</span></div></div>
           </div>
        </div>
        <div class="grid" style="margin-top: 5px;">
           <div class="row">
              <div class="col"><div class="card"><span class="card-label">${t('proposals.new.lbl_demo_url')}</span><span class="card-value ltr-val" style="font-weight:normal; font-size:10px;">${safe(proposal.demoUrl)}</span></div></div>
              <div class="col"><div class="card"><span class="card-label">${t('proposals.new.lbl_linkedin')}</span><span class="card-value ltr-val" style="font-weight:normal; font-size:10px;">${safe(proposal.linkedinProfile)}</span></div></div>
           </div>
        </div>

        <div class="footer">${t('pdf.generated_footer')} | Page 2</div>
      </div>

      <!-- PAGE 3: MARKET & FINANCIALS -->
      <div class="page">
        <div class="header"><div class="brand">${safe(proposal.projectName)}</div><div class="meta">Financial Due Diligence</div></div>

        <div class="section-title">${t('proposals.new.step3_title')} (Market)</div>
        
        <!-- Market Cards -->
        <div class="grid">
           <div class="row">
              <div class="col col-3">
                 <div class="card" style="background: #eff6ff; border-color: #bfdbfe;">
                    <span class="card-label">TAM (Total Addressable)</span>
                    <span class="card-value ltr-val" style="font-size: 16px;">${currency(proposal.marketStats?.tam)}</span>
                 </div>
              </div>
              <div class="col col-3">
                 <div class="card" style="background: #f0fdf4; border-color: #bbf7d0;">
                    <span class="card-label">SAM (Serviceable)</span>
                    <span class="card-value ltr-val" style="font-size: 16px;">${currency(proposal.marketStats?.sam)}</span>
                 </div>
              </div>
              <div class="col col-3">
                 <div class="card" style="background: #fffbeb; border-color: #fde68a;">
                    <span class="card-label">SOM (Obtainable)</span>
                    <span class="card-value ltr-val" style="font-size: 16px;">${currency(proposal.marketStats?.som)}</span>
                 </div>
              </div>
           </div>
        </div>
        <p style="margin-top: 10px; font-size: 10px;"><strong>${t('proposals.new.lbl_competitors')}:</strong> ${safe(proposal.marketStats?.competitors)}</p>

        <div class="section-title">${t('proposals.new.step4_title')} (Financial Projections)</div>
        <table>
           <thead>
              <tr>
                 <th>Metric</th>
                 <th>Value</th>
                 <th>Description</th>
              </tr>
           </thead>
           <tbody>
              <tr>
                 <td>${t('proposals.new.lbl_burn_rate')}</td>
                 <td class="ltr-val">${currency(proposal.financialStats?.burnRate)} / mo</td>
                 <td>Monthly operational expenses</td>
              </tr>
              <tr>
                 <td>Runway</td>
                 <td class="ltr-val">${safe(proposal.financialStats?.runway)} mo</td>
                 <td>Estimated survival time</td>
              </tr>
              <tr>
                 <td>${t('proposals.new.lbl_revenue')}</td>
                 <td class="ltr-val">${currency(proposal.financialStats?.revenueProj)}</td>
                 <td>Projected Annual Revenue</td>
              </tr>
              <tr>
                 <td>Net Profit</td>
                 <td class="ltr-val">${currency(proposal.financialStats?.netProfit)}</td>
                 <td>Projected Net Income</td>
              </tr>
              <tr>
                 <td>Valuation</td>
                 <td class="ltr-val">${currency(proposal.financialStats?.valuation)}</td>
                 <td>Pre-Money Valuation</td>
              </tr>
           </tbody>
        </table>

        <div class="section-title">${t('proposals.new.milestones_title')}</div>
        <table>
           <thead>
              <tr>
                 <th style="width: 5%;">#</th>
                 <th>${t('proposals.new.lbl_milestone_name')}</th>
                 <th style="width: 15%;">${t('proposals.new.lbl_days')}</th>
                 <th style="width: 20%;">${t('proposals.new.lbl_amount')}</th>
              </tr>
           </thead>
           <tbody>
              ${proposal.milestones?.map((m: any, i: number) => `
                <tr>
                  <td style="text-align:center;">${i + 1}</td>
                  <td>${m.name}</td>
                  <td style="text-align:center;">${m.durationDays}</td>
                  <td class="ltr-val">${currency(m.amount)}</td>
                </tr>
              `).join('')}
              <tr style="background: #e2e8f0; font-weight: bold;">
                 <td colspan="3" style="text-align: ${isRTL ? 'left' : 'right'};">Total Requested:</td>
                 <td class="ltr-val">${currency(proposal.milestones?.reduce((a:any,b:any)=>a+Number(b.amount),0))}</td>
              </tr>
           </tbody>
        </table>

        <div class="footer">${t('pdf.generated_footer')} | Page 3</div>
      </div>

      <!-- PAGE 4: AI ANALYSIS -->
      <div class="page">
        <div class="header"><div class="brand">RayanChain Intelligence</div><div class="meta">AI Risk Assessment</div></div>

        <div class="risk-header">
           <div style="font-size: 10px; color: var(--gray); text-transform: uppercase;">${t('pdf.risk_score_label')}</div>
           <div class="risk-score">${riskScore} <span style="font-size: 20px; color: #94a3b8;">/ 100</span></div>
           <div class="risk-desc" style="color: ${riskColor};">${t(report.risk_level_key)}</div>
           
           <div style="margin-top: 15px; padding: 10px; background: white; border-radius: 6px; text-align: justify; font-size: 11px;">
              <strong>AI Recommendation:</strong> ${t(report.recommendation_text_key)}
           </div>
        </div>

        <div class="grid" style="margin-top: 20px;">
           <div class="row">
              <div class="col"><div class="card" style="text-align:center;"><span class="card-label">${t('proposal_detail.success_probability')}</span><span class="card-value">${safe(report.success_probability)}%</span></div></div>
              <div class="col"><div class="card" style="text-align:center;"><span class="card-label">${t('proposal_detail.team_competency')}</span><span class="card-value">${safe(report.team_competency_score)}/100</span></div></div>
              <div class="col"><div class="card" style="text-align:center;"><span class="card-label">${t('proposal_detail.market_sentiment')}</span><span class="card-value">${(report.market_sentiment_score * 100).toFixed(0)}%</span></div></div>
           </div>
        </div>

        <div class="section-title">${t('pdf.analysis_title')}</div>
        
        <div class="swot-container">
           <div class="swot-box">
              <div class="swot-title strength">${t('pdf.strengths')}</div>
              <ul>${renderXAIList(report.strengths)}</ul>
           </div>
           
           <div style="height: 10px;"></div>

           <div class="swot-box">
              <div class="swot-title weakness">${t('pdf.weaknesses')}</div>
              <ul>${renderXAIList(report.weaknesses)}</ul>
           </div>
        </div>

        <div class="footer">${t('pdf.generated_footer')} | Page 4</div>
      </div>

    </body>
    </html>
  `;
};