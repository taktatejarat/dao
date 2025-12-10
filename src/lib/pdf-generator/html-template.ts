// src/lib/pdf-generator/html-template.ts

import fs from 'fs';
import path from 'path';

interface HtmlTemplateProps {
  report: any;
  proposal: any; // شامل startupStage و knowledgeBasedType
  proposalId: string;
  generatedDate: string;
  locale: string;
  labels: {
    rayan_chain_vc: string;
    date: string;
    id: string;
    generated_footer: string;
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
    noData: string;
    // ✅ کلیدهای جدید برای PDF
    stage_title?: string;
    kb_title?: string;
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

  const vazirReg = loadFontAsBase64('Vazirmatn-Regular.ttf');
  const vazirBold = loadFontAsBase64('Vazirmatn-Bold.ttf');
  const robotoReg = loadFontAsBase64('Roboto-Regular.ttf');
  const robotoBold = loadFontAsBase64('Roboto-Bold.ttf');

  const safe = (val: any) => (val ? val : "-");
  const money = (val: any) => (val !== undefined && val !== null && val !== '' && !isNaN(Number(val)) ? `$${Number(val).toLocaleString()}` : "-");
  const num = (val: any) => (val !== undefined && val !== null && val !== '' && !isNaN(Number(val)) ? Number(val) : null);

  const riskPercent = report.risk_score || 50;
  let riskColor = "#eab308";
  if(riskPercent < 30) riskColor = "#22c55e";
  if(riskPercent > 70) riskColor = "#ef4444";

  // ✅ تبدیل مقادیر خام به متن خوانا
  const stageMap: any = { 'idea': 'Idea / Pre-Revenue', 'revenue': 'Growth / Post-Revenue' };
  const kbMap: any = { 'none': 'None', 'type1': 'Type 1 (Tech)', 'type2': 'Type 2 (Production)', 'creative': 'Creative' };
  
  const displayStage = stageMap[proposal.startupStage] || safe(proposal.startupStage);
  const displayKB = kbMap[proposal.knowledgeBasedType] || safe(proposal.knowledgeBasedType);

  const css = `
    @font-face { font-family: 'BodyFont'; src: url(data:font/ttf;charset=utf-8;base64,${isRTL ? vazirReg : robotoReg}) format('truetype'); font-weight: normal; }
    @font-face { font-family: 'BodyFont'; src: url(data:font/ttf;charset=utf-8;base64,${isRTL ? vazirBold : robotoBold}) format('truetype'); font-weight: bold; }
 
    :root { --primary: #0f172a; --accent: #2563eb; --bg-gray: #f8fafc; --border: #e2e8f0; }
    body { font-family: 'BodyFont', sans-serif; margin: 0; padding: 0; direction: ${dir}; text-align: ${textAlign}; font-size: 12px; }
    .page { padding: 40px 50px; page-break-after: always; }
    .page:last-child { page-break-after: auto; }
    .header-bar { border-bottom: 2px solid var(--primary); padding-bottom: 15px; margin-bottom: 30px; display: flex; justify-content: space-between; flex-direction: ${isRTL ? 'row' : 'row-reverse'}; }
    .logo-text { font-size: 24px; font-weight: bold; }
    .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
    .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 15px; }
    .info-box { background: var(--bg-gray); border: 1px solid var(--border); padding: 12px; border-radius: 6px; }
    .info-label { font-size: 9px; text-transform: uppercase; color: #64748b; font-weight: bold; }
    .info-value { font-size: 13px; font-weight: bold; color: var(--primary); margin-top: 4px; }
    h1 { font-size: 28px; color: var(--primary); margin: 0; text-align: center; }
    h2 { font-size: 16px; color: var(--accent); border-bottom: 1px solid var(--border); padding-bottom: 8px; margin: 25px 0 15px 0; }
    .ltr-val { direction: ltr; unicode-bidi: embed; text-align: ${isRTL ? 'left' : 'right'}; }

    /* Risk Meter Visualization */
    .risk-container {
      margin: 20px 0; padding: 20px; background: #fff; border: 1px solid var(--border); border-radius: 8px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .risk-bar-bg {
      height: 12px; width: 100%; background: #e2e8f0; border-radius: 6px; position: relative; overflow: hidden;
      background: linear-gradient(to right, #22c55e 0%, #eab308 50%, #ef4444 100%);
    }
    .risk-marker {
      position: absolute; top: -4px; width: 4px; height: 20px; background: #000;
      transform: translateX(-50%); border: 1px solid #fff;
    }
    .risk-labels { display: flex; justify-content: space-between; font-size: 9px; color: #64748b; margin-top: 5px; }

    /* Score Circle */
    .score-badge {
      width: 80px; height: 80px; border-radius: 50%;
      background: var(--primary); color: #fff;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      box-shadow: 0 4px 10px rgba(0,0,0,0.2);
    }
    .score-val { font-size: 28px; font-weight: bold; line-height: 1; }
    .score-lbl { font-size: 8px; opacity: 0.8; text-transform: uppercase; margin-top: 2px; }

    /* Analysis Lists */
    .analysis-list { list-style: none; padding: 0; margin: 0; }
    .analysis-item { 
      padding: 8px 12px; margin-bottom: 6px; border-radius: 4px; font-size: 11px;
      border-${isRTL ? 'right' : 'left'}: 4px solid;
    }
    .good { background: #f0fdf4; border-color: #22c55e; color: #14532d; }
    .bad { background: #fef2f2; border-color: #ef4444; color: #7f1d1d; }

    /* Table */
    table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 10px; }
    th { text-align: ${textAlign}; background: #f1f5f9; color: #475569; padding: 10px; font-weight: bold; }
    td { padding: 10px; border-bottom: 1px solid var(--border); }
    tr:last-child td { border-bottom: none; }

    /* Footer */
    .footer {
      position: fixed; bottom: 0; left: 0; right: 0;
      padding: 20px 50px; text-align: center;
      border-top: 1px solid var(--border);
      font-size: 8px; color: #94a3b8;
    }
  `;

  return `
    <!DOCTYPE html>
    <html lang="${locale}" dir="${dir}">
    <head><meta charset="UTF-8"><style>${css}</style></head>
    <body>
      
      <!-- PAGE 1 -->
      <div class="page">
        <div class="header-bar">
          <div class="logo-text">${labels.rayan_chain_vc}</div>
          <div style="font-size: 10px; color: #666;">
             ID: ${proposalId}<br>Date: ${generatedDate}
          </div>
        </div>

        <div style="text-align: center; margin-bottom: 30px;">
          <h1>${safe(proposal.projectName)}</h1>
          <div style="font-style: italic; color: #666;">${safe(proposal.tagline)}</div>
        </div>

        <!-- ✅ بخش جدید: اطلاعات تکمیلی -->
        <div class="grid-2">
            <div class="info-box">
                <div class="info-label">${labels.stage_title || 'Project Stage'}</div>
                <div class="info-value">${displayStage}</div>
            </div>
            <div class="info-box">
                <div class="info-label">${labels.kb_title || 'Knowledge Based'}</div>
                <div class="info-value">${displayKB}</div>
            </div>
        </div>

        <div class="grid-4" style="margin-top: 10px;">
            <div class="info-box"><div class="info-label">${labels.industry}</div><div class="info-value">${safe(proposal.startupIndustry)}</div></div>
            <div class="info-box"><div class="info-label">${labels.model}</div><div class="info-value">${safe(proposal.businessModel)}</div></div>
            <div class="info-box"><div class="info-label">${labels.teamExp}</div><div class="info-value">${safe(proposal.teamExperienceYears)} Yrs</div></div>
            <div class="info-box"><div class="info-label">${labels.amount}</div><div class="info-value">${money(proposal.milestones?.reduce((a:any,b:any)=>a+Number(b.amount),0))}</div></div>
        </div>
        <div class="grid-4" style="margin-top: 10px;">
            <div class="info-box"><div class="info-label">Team Size</div><div class="info-value">${safe(proposal.teamSize)}</div></div>
            <div class="info-box"><div class="info-label">Founded</div><div class="info-value">${safe(proposal.foundedDate)}</div></div>
            <div class="info-box"><div class="info-label">Reg. ID</div><div class="info-value">${safe(proposal.companyRegId)}</div></div>
            <div class="info-box"><div class="info-label">${labels.website}</div><div class="info-value ltr-val">${safe(proposal.demoUrl || proposal.website)}</div></div>
        </div>

        <h2>${labels.details}</h2>
        <p>${safe(proposal.description)}</p>
        
        <div class="grid-2">
             <div><strong>${labels.problem}:</strong><br>${safe(proposal.problem)}</div>
             <div><strong>${labels.solution}:</strong><br>${safe(proposal.solution)}</div>
        </div>

        <div class="footer">${labels.generated_footer} | Page 1</div>
      </div>

      <!-- PAGE 2: FINANCIALS & MARKET -->
      <div class="page">
        <div class="header-bar"><div class="logo-text">Financial Due Diligence</div></div>

        <h2>${labels.market}</h2>
        <div class="grid-4">
          <div class="info-box"><div class="info-label">TAM (Total Addressable)</div><div class="info-value ltr-val">${money(proposal.marketStats?.tam)}</div></div>
          <div class="info-box"><div class="info-label">SAM (Serviceable)</div><div class="info-value ltr-val">${money(proposal.marketStats?.sam)}</div></div>
          <div class="info-box"><div class="info-label">SOM (Obtainable)</div><div class="info-value ltr-val">${money(proposal.marketStats?.som)}</div></div>
          <div class="info-box"><div class="info-label">Market Share Goal</div><div class="info-value ltr-val">${
            (() => {
              const som = num(proposal.marketStats?.som);
              const sam = num(proposal.marketStats?.sam);
              if (som !== null && sam && sam > 0) return `~${((som / sam) * 100).toFixed(1)}%`;
              return "-";
            })()
          }</div></div>
        </div>
        <p style="font-size: 11px; color: #666; margin-top: 10px;">
          <strong>${labels.competitors}:</strong> ${safe(proposal.marketStats?.competitors)}
        </p>

        <h2>${labels.financials}</h2>
        <table style="margin-bottom: 30px;">
          <thead><tr><th>Metric</th><th>Value</th><th>Notes</th></tr></thead>
          <tbody>
            <tr><td>${labels.burn_rate}</td><td class="ltr-val">${money(proposal.financialStats?.burnRate)} / mo</td><td>Monthly operational cost</td></tr>
            <tr><td>Runway</td><td class="ltr-val">${safe(proposal.financialStats?.runway)} months</td><td>Cash runway</td></tr>
            <tr><td>${labels.revenue}</td><td class="ltr-val">${money(proposal.financialStats?.revenueProj)}</td><td>Projected Annual</td></tr>
            <tr><td>Net Profit</td><td class="ltr-val">${money(proposal.financialStats?.netProfit)}</td><td>Projected</td></tr>
            <tr><td>EBITDA</td><td class="ltr-val">${money(proposal.financialStats?.ebitda)}</td><td>Margin guidance</td></tr>
            <tr><td>Valuation</td><td class="ltr-val">${money(proposal.financialStats?.valuation)}</td><td>Pre/Seed estimate</td></tr>
            <tr><td>${labels.break_even}</td><td class="ltr-val">${safe(proposal.financialStats?.breakEven)}</td><td>Estimated timeline</td></tr>
          </tbody>
        </table>

        <h2>${labels.milestones} Plan</h2>
        <table>
          <thead><tr><th>#</th><th>${labels.milestone_name}</th><th>${labels.duration} (Days)</th><th>${labels.amount}</th></tr></thead>
          <tbody>
            ${proposal.milestones?.map((m: any, i: number) => `
              <tr>
                <td>${i+1}</td>
                <td>${m.name}</td>
                <td>${m.durationDays}</td>
                <td class="ltr-val" style="font-weight: bold;">${Number(m.amount).toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
         <div class="footer">${labels.generated_footer} | Page 2</div>
      </div>

      <!-- PAGE 3: AI RISK ASSESSMENT -->
      <div class="page">
        <div class="header-bar"><div class="logo-text" style="color: var(--accent);">AI Risk Analysis</div></div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; flex-direction: ${isRTL?'row':'row-reverse'};">
          <div style="flex: 1; padding: 0 20px;">
            <h3 style="margin: 0; color: var(--primary);">${labels.ai_recommendation}</h3>
            <p style="font-size: 13px; line-height: 1.6; margin-top: 10px;">
              ${report.recommendation_text}
            </p>
          </div>
          <div class="score-badge">
            <div class="score-val">${report.investability_score}</div>
            <div class="score-lbl">Score</div>
          </div>
        </div>

        <!-- RISK METER -->
        <div class="risk-container">
          <div class="info-label" style="margin-bottom: 10px;">${labels.financial_risk_score} (Lower is Better)</div>
          <div class="risk-bar-bg">
            <div class="risk-marker" style="left: ${riskPercent}%;"></div>
          </div>
          <div class="risk-labels">
            <span>Low Risk (0)</span>
            <span style="font-weight: bold; color: ${riskColor}">${riskPercent}/100</span>
            <span>High Risk (100)</span>
          </div>
        </div>

        <div class="grid-4" style="margin-bottom: 30px;">
          <div class="info-box" style="text-align: center;">
            <div class="info-label">${labels.success_probability}</div>
            <div class="info-value" style="color: var(--accent); font-size: 18px;">${safe(report.success_probability)}%</div>
          </div>
          <div class="info-box" style="text-align: center;">
            <div class="info-label">${labels.team_competency}</div>
            <div class="info-value" style="color: #16a34a; font-size: 18px;">${safe(report.team_competency_score)}/100</div>
          </div>
          <div class="info-box" style="text-align: center;">
            <div class="info-label">${labels.market_sentiment}</div>
            <div class="info-value" style="color: #ca8a04; font-size: 18px;">${report.market_sentiment_score ? (report.market_sentiment_score * 100).toFixed(0) : 0}%</div>
          </div>
          <div class="info-box" style="text-align: center;">
             <div class="info-label">Trust Score</div>
             <div class="info-value" style="color: var(--primary); font-size: 18px;">${safe(report.proposer_trust_score)}/100</div>
          </div>
        </div>

        <div class="grid-2">
          <div>
            <h3 style="color: #16a34a; font-size: 14px; border-bottom: 2px solid #16a34a; padding-bottom: 5px; display: inline-block;">${labels.strengths}</h3>
            <ul class="analysis-list">
              ${report.xai_report.strengths.length > 0 ? report.xai_report.strengths.map((s: any) => `
                <li class="analysis-item good">${s.display_text}</li>
              `).join('') : `<li>${labels.noData}</li>`}
            </ul>
          </div>
          <div>
            <h3 style="color: #ef4444; font-size: 14px; border-bottom: 2px solid #ef4444; padding-bottom: 5px; display: inline-block;">${labels.weaknesses}</h3>
            <ul class="analysis-list">
              ${report.xai_report.weaknesses.length > 0 ? report.xai_report.weaknesses.map((w: any) => `
                <li class="analysis-item bad">${w.display_text}</li>
              `).join('') : `<li>${labels.noData}</li>`}
            </ul>
          </div>
        </div>
          <div class="footer">${labels.generated_footer} | Page 2</div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};