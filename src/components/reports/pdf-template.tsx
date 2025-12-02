// src/components/reports/pdf-template.tsx - FULL DATA & FAIL-SAFE

import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// رجیستر کردن فونت‌ها
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

export const ProposalReportPDF = ({ report, proposal, proposalId, t, locale }: ReportPDFProps) => {
  const isRTL = locale === 'fa' || locale === 'ar';
  const isRussian = locale === 'ru';
  
  const mainFont = isRussian ? 'Roboto' : 'Vazirmatn';
  const boldFont = isRussian ? 'Roboto-Bold' : 'Vazirmatn-Bold';

  const rawDate = new Date().toLocaleDateString(locale === 'fa' ? 'fa-IR' : 'en-US');
  // استفاده از کاراکترهای کنترلی برای اصلاح جهت تاریخ در متن فارسی
  const displayDate = isRTL ? `\u202A${rawDate}\u202C` : rawDate;

  const styles = StyleSheet.create({
    page: { 
        flexDirection: 'column', backgroundColor: '#fff', padding: 30, 
        fontFamily: mainFont, fontSize: 10, color: '#333' 
    },
    header: { 
        marginBottom: 20, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#ccc',
        flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center'
    },
    brand: { fontSize: 16, fontFamily: boldFont, color: '#2563eb' },
    meta: { fontSize: 9, color: '#666', textAlign: isRTL ? 'left' : 'right' },
    
    // عناوین بخش‌ها
    sectionTitle: { 
        fontSize: 13, fontFamily: boldFont, color: '#000', marginTop: 15, marginBottom: 6,
        textAlign: isRTL ? 'right' : 'left', borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 2
    },
    // متون معمولی
    text: { 
        marginBottom: 6, lineHeight: 1.5, textAlign: isRTL ? 'right' : 'left', fontSize: 10 
    },
    // لیبل‌های کوچک بالای مقادیر
    label: { 
        color: '#666', fontSize: 8, marginBottom: 2, textAlign: isRTL ? 'right' : 'left' 
    },
    // مقادیر ضخیم
    value: { 
        fontFamily: boldFont, fontSize: 10, marginBottom: 8, textAlign: isRTL ? 'right' : 'left' 
    },
    
    // گرید سیستم
    row: { flexDirection: isRTL ? 'row-reverse' : 'row', flexWrap: 'wrap', marginBottom: 5 },
    col2: { width: '50%', paddingHorizontal: 4 },
    col3: { width: '33%', paddingHorizontal: 4 },
    col4: { width: '25%', paddingHorizontal: 2 },
    
    // استایل‌های AI
    aiBox: { backgroundColor: '#f5f3ff', padding: 10, borderRadius: 5, marginBottom: 15 },
    scoreVal: { fontSize: 24, fontFamily: boldFont, color: '#2563eb', textAlign: 'center' },
    
    footer: { 
        position: 'absolute', bottom: 20, left: 30, right: 30, 
        textAlign: 'center', fontSize: 8, color: '#999', borderTopWidth: 1, borderColor: '#eee', paddingTop: 10
    }
  });

  // ایمن‌سازی داده‌ها (جلوگیری از undefined)
  const p = proposal || {};
  const market = p.marketStats || {};
  const finance = p.financialStats || {};
  const milestones = p.milestones || [];
  
  // توابع کمکی برای ایمن‌سازی متن
  const safeText = (txt: any) => (txt ? String(txt) : "-");
  const currency = (val: any) => (val ? `$${Number(val).toLocaleString()}` : "-");

  return (
    <Document>
      
      {/* ================= PAGE 1: PROJECT OVERVIEW ================= */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brand}>{t('common.rayan_chain_vc') || "RayanChain VC"}</Text>
          <View>
             <Text style={styles.meta}>{displayDate}</Text>
             <Text style={styles.meta}>ID: {proposalId}</Text>
          </View>
        </View>

        {/* Title Block */}
        <View style={{ marginBottom: 20, alignItems: 'center' }}>
            <Text style={{ fontSize: 20, fontFamily: boldFont, textAlign: 'center', marginBottom: 5 }}>
                {safeText(p.projectName)}
            </Text>
            <Text style={{ fontSize: 11, color: '#666', textAlign: 'center' }}>
                {safeText(p.tagline)}
            </Text>
        </View>

        {/* Info Grid */}
        <View style={styles.row}>
            <View style={styles.col2}>
                <Text style={styles.label}>{t('new_proposal_page.industry') || "Industry"}</Text>
                <Text style={styles.value}>{safeText(p.startupIndustry)}</Text>
            </View>
            <View style={styles.col2}>
                <Text style={styles.label}>{t('new_proposal_page.business_model') || "Business Model"}</Text>
                <Text style={styles.value}>{safeText(p.businessModel)}</Text>
            </View>
        </View>

        <View style={styles.row}>
            <View style={styles.col2}>
                <Text style={styles.label}>{t('new_proposal_page.website') || "Website"}</Text>
                <Text style={{...styles.value, color: '#2563eb'}}>{safeText(p.website)}</Text>
            </View>
            <View style={styles.col2}>
                <Text style={styles.label}>{t('new_proposal_page.team_experience_years_label') || "Team Exp"}</Text>
                <Text style={styles.value}>{safeText(p.teamExperienceYears)} Years</Text>
            </View>
        </View>

        {/* Description Section */}
        <Text style={styles.sectionTitle}>{t('new_proposal_page.tabs.details') || "Project Details"}</Text>
        
        <Text style={styles.label}>{t('new_proposal_page.full_description') || "Description"}</Text>
        <Text style={styles.text}>{safeText(p.description)}</Text>
        
        <Text style={styles.label}>{t('new_proposal_page.problem') || "Problem"}</Text>
        <Text style={styles.text}>{safeText(p.problem)}</Text>
        
        <Text style={styles.label}>{t('new_proposal_page.solution') || "Solution"}</Text>
        <Text style={styles.text}>{safeText(p.solution)}</Text>

        <View style={styles.footer}><Text>Page 1 / 3</Text></View>
      </Page>

      {/* ================= PAGE 2: MARKET, TEAM & FINANCIALS ================= */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}><Text style={styles.brand}>Data Analysis</Text></View>

        {/* Market Stats */}
        <Text style={styles.sectionTitle}>{t('new_proposal_page.tabs.market') || "Market"}</Text>
        <View style={styles.row}>
            <View style={styles.col3}><Text style={styles.label}>TAM</Text><Text style={styles.value}>{currency(market.tam)}</Text></View>
            <View style={styles.col3}><Text style={styles.label}>SAM</Text><Text style={styles.value}>{currency(market.sam)}</Text></View>
            <View style={styles.col3}><Text style={styles.label}>SOM</Text><Text style={styles.value}>{currency(market.som)}</Text></View>
        </View>
        <Text style={styles.label}>{t('new_proposal_page.competitors') || "Competitor Analysis"}</Text>
        <Text style={styles.text}>{safeText(market.competitors)}</Text>

        {/* Team Bio */}
        <Text style={styles.sectionTitle}>{t('new_proposal_page.tabs.team') || "Team"}</Text>
        <Text style={styles.text}>{safeText(p.teamBio)}</Text>

        {/* Financial Stats */}
        <Text style={styles.sectionTitle}>{t('new_proposal_page.tabs.financials') || "Financials"}</Text>
        <View style={styles.row}>
            <View style={styles.col3}><Text style={styles.label}>Burn Rate</Text><Text style={styles.value}>{currency(finance.burnRate)}/mo</Text></View>
            <View style={styles.col3}><Text style={styles.label}>Revenue (Y1)</Text><Text style={styles.value}>{currency(finance.revenueProj)}</Text></View>
            <View style={styles.col3}><Text style={styles.label}>Break-even</Text><Text style={styles.value}>{safeText(finance.breakEven)} M</Text></View>
        </View>
        
        {/* Funding History */}
        {finance.hasPreviousFunding === 'true' && (
            <View style={{ marginTop: 5 }}>
                <Text style={styles.label}>{t('new_proposal_page.funding_details') || "Previous Funding"}</Text>
                <Text style={styles.text}>{safeText(finance.fundingHistoryDetails)}</Text>
            </View>
        )}

        {/* Milestones Table */}
        <Text style={styles.sectionTitle}>{t('new_proposal_page.funding_milestones') || "Funding Milestones"}</Text>
        <View style={{ marginTop: 5 }}>
            {milestones.length > 0 ? (
                milestones.map((m: any, i: number) => (
                    <View key={i} style={{ ...styles.row, borderBottomWidth: 1, borderColor: '#eee', paddingVertical: 6, alignItems: 'center' }}>
                        <Text style={{ width: '50%', textAlign: isRTL ? 'right' : 'left', fontSize: 9 }}>{safeText(m.name)}</Text>
                        <Text style={{ width: '25%', textAlign: 'center', fontSize: 9 }}>{safeText(m.durationDays)} Days</Text>
                        <Text style={{ width: '25%', textAlign: 'center', fontFamily: boldFont, fontSize: 9 }}>{m.amount} RYC</Text>
                    </View>
                ))
            ) : (
                <Text style={styles.text}>No milestones defined.</Text>
            )}
        </View>

        <View style={styles.footer}><Text>Page 2 / 3</Text></View>
      </Page>

      {/* ================= PAGE 3: AI ANALYSIS REPORT ================= */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
            <Text style={{ ...styles.brand, color: '#7c3aed' }}>{t('reports_page.ai_audit_report') || "AI Report"}</Text>
        </View>

        {/* AI Summary */}
        <View style={styles.aiBox}>
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ width: '65%' }}>
                    <Text style={{ fontSize: 10, color: '#5b21b6', textAlign: isRTL ? 'right' : 'left', marginBottom: 4 }}>
                        {t('reports_page.ai_recommendation') || "AI Recommendation"}
                    </Text>
                    <Text style={{ fontSize: 10, fontFamily: boldFont, color: '#4c1d95', lineHeight: 1.4, textAlign: isRTL ? 'right' : 'left' }}>
                        {safeText(report.recommendation_text)}
                    </Text>
                </View>
                <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={styles.scoreVal}>{safeText(report.investability_score)}</Text>
                    <Text style={{ fontSize: 10, color: '#4c1d95', marginTop: 2 }}>
                        {safeText(report.overall_risk_level_label)}
                    </Text>
                </View>
            </View>
        </View>

        {/* Strengths */}
        <Text style={{ ...styles.sectionTitle, color: '#16a34a' }}>{t('reports_page.xai_strengths') || "Strengths"}</Text>
        <View style={{ marginBottom: 10 }}>
            {report.xai_report?.strengths?.length > 0 ? (
                report.xai_report.strengths.map((item: any, i: number) => (
                    <View key={`s-${i}`} style={{ marginBottom: 4, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                        <Text style={{ color: '#16a34a', marginHorizontal: 4 }}>•</Text>
                        <Text style={{ fontSize: 9, color: '#14532d', flex: 1, textAlign: isRTL ? 'right' : 'left' }}>
                            {safeText(item.display_text)}
                        </Text>
                    </View>
                ))
            ) : <Text style={{ fontSize: 9, color: '#999', textAlign: isRTL ? 'right' : 'left' }}>-</Text>}
        </View>

        {/* Weaknesses */}
        <Text style={{ ...styles.sectionTitle, color: '#dc2626' }}>{t('reports_page.xai_weaknesses') || "Weaknesses"}</Text>
        <View style={{ marginBottom: 10 }}>
            {report.xai_report?.weaknesses?.length > 0 ? (
                report.xai_report.weaknesses.map((item: any, i: number) => (
                    <View key={`w-${i}`} style={{ marginBottom: 4, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                        <Text style={{ color: '#dc2626', marginHorizontal: 4 }}>•</Text>
                        <Text style={{ fontSize: 9, color: '#7f1d1d', flex: 1, textAlign: isRTL ? 'right' : 'left' }}>
                            {safeText(item.display_text)}
                        </Text>
                    </View>
                ))
            ) : <Text style={{ fontSize: 9, color: '#999', textAlign: isRTL ? 'right' : 'left' }}>-</Text>}
        </View>

        <View style={styles.footer}>
            <Text>{t('common.generated_footer') || "Generated by RayanChain AI"}</Text>
        </View>
      </Page>

    </Document>
  );
};