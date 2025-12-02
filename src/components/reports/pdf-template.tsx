// src/components/reports/pdf-template.tsx - FINAL STABLE VERSION

import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// 1. ثبت فونت‌ها
// نکته: اطمینان حاصل کنید فایل‌های .ttf در پوشه public/fonts موجود هستند
Font.register({ family: 'Vazirmatn', src: '/fonts/Vazirmatn-Regular.ttf' });
Font.register({ family: 'Vazirmatn-Bold', src: '/fonts/Vazirmatn-Bold.ttf' });
Font.register({ family: 'Roboto', src: '/fonts/Roboto-Regular.ttf' });
Font.register({ family: 'Roboto-Bold', src: '/fonts/Roboto-Bold.ttf' });

interface ReportPDFProps {
  report: any;
  proposal: any;
  proposalId: string;
  t: (key: string) => string;
  locale: string;
}

// 2. کامپوننت واسط متن (Safe Text Component)
// این کامپوننت جلوی کرش کردن موتور PDF در زبان‌های RTL را می‌گیرد
const PdfText = ({ style, children, ...props }: any) => {
  return (
    <Text
      style={style}
      // غیرفعال کردن الگوریتم شکستن کلمات که باعث خطای reading id می‌شود
      hyphenationCallback={(word) => [word]}
      {...props}
    >
      {children}
    </Text>
  );
};

export const ProposalReportPDF = ({ report, proposal, proposalId, t, locale }: ReportPDFProps) => {
  const isRTL = locale === 'fa' || locale === 'ar';
  const isRussian = locale === 'ru';
  
  // انتخاب فونت
  const mainFont = isRussian ? 'Roboto' : 'Vazirmatn';
  const boldFont = isRussian ? 'Roboto-Bold' : 'Vazirmatn-Bold';
  
  // فونت اعداد (همیشه Roboto برای جلوگیری از بهم ریختگی اعداد)
  const numFont = 'Roboto';
  const numFontBold = 'Roboto-Bold';

  const rawDate = new Date().toLocaleDateString(locale === 'fa' ? 'fa-IR' : 'en-US');
  const displayDate = isRTL ? `\u202A${rawDate}\u202C` : rawDate;

  // توابع ایمن‌سازی
  const safe = (val: any) => (val === null || val === undefined) ? "-" : String(val);
  const money = (val: any) => (val ? `$${Number(val).toLocaleString()}` : "-");

  const p = proposal || {};
  const market = p.marketStats || {};
  const finance = p.financialStats || {};
  const milestones = p.milestones || [];

  const styles = StyleSheet.create({
    page: { 
        flexDirection: 'column', backgroundColor: '#fff', padding: 30, 
        fontFamily: mainFont, fontSize: 10, color: '#333' 
    },
    header: { 
        marginBottom: 15, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#ccc',
        flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center'
    },
    brand: { fontSize: 16, fontFamily: boldFont, color: '#2563eb' },
    
    metaContainer: { flexDirection: 'column', alignItems: isRTL ? 'flex-start' : 'flex-end' },
    metaRow: { flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', marginBottom: 2 },
    metaLabel: { fontSize: 9, color: '#666', fontFamily: mainFont },
    metaValue: { fontSize: 9, color: '#333', fontFamily: numFont, marginHorizontal: 3 }, // اعداد با فونت انگلیسی

    sectionTitle: { 
        fontSize: 13, fontFamily: boldFont, color: '#111827', marginTop: 15, marginBottom: 8,
        textAlign: isRTL ? 'right' : 'left', borderBottomWidth: 1, borderBottomColor: '#f3f4f6', paddingBottom: 4
    },
    
    text: { marginBottom: 5, lineHeight: 1.5, textAlign: isRTL ? 'right' : 'left', fontSize: 10, color: '#4b5563' },
    label: { color: '#6b7280', fontSize: 8, marginBottom: 2, textAlign: isRTL ? 'right' : 'left' },
    value: { fontFamily: isRTL ? numFontBold : boldFont, fontSize: 10, marginBottom: 8, textAlign: isRTL ? 'right' : 'left', color: '#111827' },
    
    row: { flexDirection: isRTL ? 'row-reverse' : 'row', flexWrap: 'wrap', marginBottom: 5 },
    col2: { width: '50%', paddingHorizontal: 4 },
    col3: { width: '33.33%', paddingHorizontal: 4 },
    col4: { width: '25%', paddingHorizontal: 2 },
    
    // استایل‌های AI
    aiBox: { 
        backgroundColor: '#f5f3ff', padding: 10, borderRadius: 6, marginBottom: 15, 
        borderWidth: 1, borderColor: '#7c3aed' 
    },
    scoreLabel: { fontSize: 9, color: '#5b21b6', textAlign: 'center', marginBottom: 2 },
    scoreVal: { fontSize: 24, fontFamily: numFontBold, color: '#2563eb', textAlign: 'center' },
    
    // استایل کارت‌های کوچک (رفع خطای TypeScript قبلی)
    card: { backgroundColor: '#f9fafb', padding: 8, borderRadius: 4, marginBottom: 5, borderWidth: 1, borderColor: '#e5e7eb' },

    footer: { 
        position: 'absolute', bottom: 20, left: 30, right: 30, 
        textAlign: 'center', fontSize: 8, color: '#9ca3af', borderTopWidth: 1, borderColor: '#eee', paddingTop: 10
    }
  });

  return (
    <Document>
      
      {/* ================= PAGE 1 ================= */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <PdfText style={styles.brand}>{t('common.rayan_chain_vc') || "RayanChain VC"}</PdfText>
          <View style={styles.metaContainer}>
             <View style={styles.metaRow}>
                 <PdfText style={styles.metaLabel}>{t('common.date')}: </PdfText>
                 <PdfText style={styles.metaValue}>{displayDate}</PdfText>
             </View>
             <View style={styles.metaRow}>
                 <PdfText style={styles.metaLabel}>{t('common.id')}: </PdfText>
                 {/* استفاده از فونت انگلیسی برای ID الزامی است */}
                 <Text style={styles.metaValue} hyphenationCallback={(w)=>[w]}>{safe(proposalId)}</Text>
             </View>
          </View>
        </View>

        <View style={{ marginBottom: 20, alignItems: 'center' }}>
            <PdfText style={{ fontSize: 22, fontFamily: boldFont, textAlign: 'center', marginBottom: 5 }}>
                {safe(p.projectName)}
            </PdfText>
            <PdfText style={{ fontSize: 11, color: '#666', textAlign: 'center' }}>
                {safe(p.tagline)}
            </PdfText>
        </View>

        <View style={styles.row}>
            <View style={styles.col2}>
                <PdfText style={styles.label}>{t('new_proposal_page.industry')}</PdfText>
                <PdfText style={styles.value}>{safe(p.startupIndustry)}</PdfText>
            </View>
            <View style={styles.col2}>
                <PdfText style={styles.label}>{t('new_proposal_page.business_model')}</PdfText>
                <PdfText style={styles.value}>{safe(p.businessModel)}</PdfText>
            </View>
        </View>

        <View style={styles.row}>
            <View style={styles.col2}>
                <PdfText style={styles.label}>{t('new_proposal_page.website')}</PdfText>
                {/* وب‌سایت چون انگلیسی است، با فونت Roboto نمایش داده شود بهتر است */}
                <Text style={{...styles.value, color: '#2563eb', fontFamily: numFont}} hyphenationCallback={(w)=>[w]}>
                    {safe(p.website)}
                </Text>
            </View>
            <View style={styles.col2}>
                <PdfText style={styles.label}>{t('new_proposal_page.team_experience_years_label')}</PdfText>
                <PdfText style={styles.value}>{safe(p.teamExperienceYears)}</PdfText>
            </View>
        </View>

        <PdfText style={styles.sectionTitle}>{t('new_proposal_page.tabs.details')}</PdfText>
        <PdfText style={styles.text}>{safe(p.description)}</PdfText>
        
        <PdfText style={styles.label}>{t('new_proposal_page.problem')}</PdfText>
        <PdfText style={styles.text}>{safe(p.problem)}</PdfText>
        
        <PdfText style={styles.label}>{t('new_proposal_page.solution')}</PdfText>
        <PdfText style={styles.text}>{safe(p.solution)}</PdfText>

        <View style={styles.footer}><PdfText>1 / 3</PdfText></View>
      </Page>

      {/* ================= PAGE 2 ================= */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}><PdfText style={styles.brand}>Data Analysis</PdfText></View>

        <PdfText style={styles.sectionTitle}>{t('new_proposal_page.tabs.market')}</PdfText>
        <View style={styles.row}>
            <View style={styles.col3}><PdfText style={styles.label}>TAM</PdfText><Text style={styles.metaValue}>{money(market.tam)}</Text></View>
            <View style={styles.col3}><PdfText style={styles.label}>SAM</PdfText><Text style={styles.metaValue}>{money(market.sam)}</Text></View>
            <View style={styles.col3}><PdfText style={styles.label}>SOM</PdfText><Text style={styles.metaValue}>{money(market.som)}</Text></View>
        </View>
        <PdfText style={styles.label}>{t('new_proposal_page.competitors')}</PdfText>
        <PdfText style={styles.text}>{safe(market.competitors)}</PdfText>

        <PdfText style={styles.sectionTitle}>{t('new_proposal_page.tabs.financials')}</PdfText>
        <View style={styles.row}>
            <View style={styles.col3}><PdfText style={styles.label}>Burn Rate</PdfText><Text style={styles.metaValue}>{money(finance.burnRate)}</Text></View>
            <View style={styles.col3}><PdfText style={styles.label}>Revenue</PdfText><Text style={styles.metaValue}>{money(finance.revenueProj)}</Text></View>
            <View style={styles.col3}><PdfText style={styles.label}>Break-even</PdfText><Text style={styles.metaValue}>{safe(finance.breakEven)} Mo</Text></View>
        </View>

        <PdfText style={styles.sectionTitle}>{t('new_proposal_page.funding_milestones')}</PdfText>
        <View style={{ marginTop: 5 }}>
            <View style={{ ...styles.row, borderBottomWidth: 1, borderColor: '#000', paddingBottom: 4 }}>
                <PdfText style={{ width: '50%', fontFamily: boldFont, textAlign: isRTL ? 'right' : 'left', fontSize: 9 }}>Name</PdfText>
                <PdfText style={{ width: '25%', fontFamily: boldFont, textAlign: 'center', fontSize: 9 }}>Duration</PdfText>
                <PdfText style={{ width: '25%', fontFamily: boldFont, textAlign: 'center', fontSize: 9 }}>Amount</PdfText>
            </View>
            {milestones.length > 0 ? (
                milestones.map((m: any, i: number) => (
                    <View key={i} style={{ ...styles.row, borderBottomWidth: 1, borderColor: '#eee', paddingVertical: 6 }}>
                        <PdfText style={{ width: '50%', textAlign: isRTL ? 'right' : 'left', fontSize: 9 }}>{safe(m.name)}</PdfText>
                        <Text style={{ width: '25%', textAlign: 'center', fontSize: 9, fontFamily: numFont }}>{safe(m.durationDays)} Days</Text>
                        <Text style={{ width: '25%', textAlign: 'center', fontFamily: numFontBold, fontSize: 9 }}>{m.amount}</Text>
                    </View>
                ))
            ) : (
                <PdfText style={styles.text}>No milestones defined.</PdfText>
            )}
        </View>

        <View style={styles.footer}><PdfText>2 / 3</PdfText></View>
      </Page>

      {/* ================= PAGE 3 ================= */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
            <PdfText style={{ ...styles.brand, color: '#7c3aed' }}>{t('reports_page.ai_audit_report')}</PdfText>
        </View>

        <View style={styles.aiBox}>
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ width: '65%' }}>
                    <PdfText style={{ fontSize: 10, color: '#5b21b6', textAlign: isRTL ? 'right' : 'left', marginBottom: 4 }}>
                        {t('reports_page.ai_recommendation')}
                    </PdfText>
                    <PdfText style={{ fontSize: 10, fontFamily: boldFont, color: '#4c1d95', lineHeight: 1.5, textAlign: isRTL ? 'right' : 'left' }}>
                        {safe(report.recommendation_text)}
                    </PdfText>
                </View>
                
                <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                    <PdfText style={styles.scoreLabel}>{t('reports_page.investability_score')}</PdfText>
                    <Text style={styles.scoreVal}>{safe(report.investability_score)}</Text>
                    <PdfText style={{ fontSize: 10, color: '#4c1d95', marginTop: 2, fontFamily: boldFont }}>
                        {safe(report.overall_risk_level_label)}
                    </PdfText>
                </View>
            </View>
        </View>

        {/* 4 Key Metrics */}
        <PdfText style={styles.sectionTitle}>{t('reports_page.financial_analysis_title')}</PdfText>
        <View style={styles.row}>
            {/* Success */}
            <View style={styles.col4}>
                <View style={styles.card}>
                    <PdfText style={{ fontSize: 8, color: '#666', textAlign: 'center', marginBottom: 4 }}>{t('reports_page.success_probability')}</PdfText>
                    <Text style={{ fontSize: 14, fontFamily: numFontBold, color: '#111827', textAlign: 'center' }}>{safe(report.success_probability)}%</Text>
                </View>
            </View>
            {/* Risk */}
            <View style={styles.col4}>
                <View style={styles.card}>
                    <PdfText style={{ fontSize: 8, color: '#666', textAlign: 'center', marginBottom: 4 }}>{t('reports_page.financial_risk_score')}</PdfText>
                    <Text style={{ fontSize: 14, fontFamily: numFontBold, color: '#dc2626', textAlign: 'center' }}>{safe(report.risk_score)}</Text>
                </View>
            </View>
            {/* Team */}
            <View style={styles.col4}>
                <View style={styles.card}>
                    <PdfText style={{ fontSize: 8, color: '#666', textAlign: 'center', marginBottom: 4 }}>{t('reports_page.team_competency')}</PdfText>
                    <Text style={{ fontSize: 14, fontFamily: numFontBold, color: '#16a34a', textAlign: 'center' }}>{safe(report.team_competency_score)}</Text>
                </View>
            </View>
            {/* Market */}
            <View style={styles.col4}>
                <View style={styles.card}>
                    <PdfText style={{ fontSize: 8, color: '#666', textAlign: 'center', marginBottom: 4 }}>{t('reports_page.market_sentiment')}</PdfText>
                    <Text style={{ fontSize: 14, fontFamily: numFontBold, color: '#2563eb', textAlign: 'center' }}>{report.market_sentiment_score ? (report.market_sentiment_score * 100).toFixed(0) : "0"}%</Text>
                </View>
            </View>
        </View>

        {/* Strengths & Weaknesses */}
        <View style={{ flexDirection: 'column', marginTop: 10 }}>
            
            <PdfText style={{ ...styles.sectionTitle, color: '#16a34a' }}>{t('reports_page.xai_strengths')}</PdfText>
            {report.xai_report.strengths?.length > 0 ? report.xai_report.strengths.map((item: any, i: number) => (
                <View key={`s-${i}`} style={{ marginBottom: 4, flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'flex-start' }}>
                    <Text style={{ color: '#16a34a', marginHorizontal: 5 }}>-</Text>
                    <PdfText style={{ ...styles.text, color: '#14532d', flex: 1 }}>
                        {safe(item.display_text)}
                    </PdfText>
                </View>
            )) : <PdfText style={styles.text}>-</PdfText>}

            <PdfText style={{ ...styles.sectionTitle, color: '#dc2626' }}>{t('reports_page.xai_weaknesses')}</PdfText>
            {report.xai_report.weaknesses?.length > 0 ? report.xai_report.weaknesses.map((item: any, i: number) => (
                <View key={`w-${i}`} style={{ marginBottom: 4, flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'flex-start' }}>
                    <Text style={{ color: '#dc2626', marginHorizontal: 5 }}>-</Text>
                    <PdfText style={{ ...styles.text, color: '#7f1d1d', flex: 1 }}>
                        {safe(item.display_text)}
                    </PdfText>
                </View>
            )) : <PdfText style={styles.text}>-</PdfText>}

        </View>

        <View style={styles.footer}><PdfText>{t('common.generated_footer')}</PdfText></View>
      </Page>

    </Document>
  );
};