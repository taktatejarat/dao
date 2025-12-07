// src/app/api/proposals/submit/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { logEvent } from '@/lib/logger';
import { keccak256, encodePacked, Address, parseEther } from 'viem';
import { z } from 'zod';

// --- Zod Schemas ---

// 1. اسکیمای مشترک (Milestones)
const milestoneSchema = z.object({
    name: z.string().min(3),
    durationDays: z.string().regex(/^\d+$/),
    amount: z.string().regex(/^\d*\.?\d*$/),
});

// 2. اسکیمای پروپوزال سرمایه‌گذاری (Funding) - همان قبلی شما
const fundingProposalSchema = z.object({
    type: z.literal('funding').optional(), // پیش‌فرض
    proposerAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    projectName: z.string().min(3),
    tagline: z.string().optional(),
    website: z.string().url().optional().or(z.literal('')),
    description: z.string().min(20),
    problem: z.string().min(20),
    solution: z.string().min(20),
    businessModel: z.string().min(1),
    startupIndustry: z.string().min(1),
    
    teamExperienceYears: z.string().regex(/^\d+$/),
    teamBio: z.string().min(20),
    
    marketStats: z.object({
        tam: z.string().optional(),
        sam: z.string().optional(),
        som: z.string().optional(),
        competitors: z.string().optional(),
        marketSize: z.string().optional(), 
    }),
    financialStats: z.object({
        burnRate: z.string().optional(),
        revenueProj: z.string().optional(),
        breakEven: z.string().optional(),
        hasPreviousFunding: z.string().refine(val => val === 'true' || val === 'false', "Invalid boolean string"),
        fundingHistoryDetails: z.string().optional(),
    }),

    recipient: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    milestones: z.array(milestoneSchema).min(1),
    documents: z.object({
        pitchDeck: z.string().nullable(),
        financials: z.string().nullable(),
        legal: z.string().nullable(),
    }),
});

// 3. اسکیمای جدید برای پروپوزال خزانه (Treasury)
const treasuryProposalSchema = z.object({
    type: z.literal('treasury'),
    proposerAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    title: z.string().min(3),
    description: z.string().min(10),
    recipient: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    amount: z.string().regex(/^\d*\.?\d*$/),
    tokenType: z.number().min(0).max(1), // 0: Native, 1: RYC
});

// --- Helper Functions ---

function safeJSONStringify(obj: any): string {
    const replacer = (key: string, value: any) =>
        typeof value === 'bigint' ? value.toString() : value;
    return JSON.stringify(obj, replacer);
}

function safeJsonResponse(data: any, options: ResponseInit = {}) {
    return new NextResponse(safeJSONStringify(data), {
        ...options,
        headers: { ...options.headers, 'Content-Type': 'application/json' },
    });
}

function computeProposalHash(data: object): `0x${string}` {
    const dataString = JSON.stringify(data);
    // اضافه کردن زمان برای یکتا شدن هش حتی اگر محتوا تکراری باشد
    const salt = keccak256(encodePacked(['string', 'uint256'], ['rayan-chain-proposal', BigInt(Date.now())]));
    return keccak256(encodePacked(['string', 'bytes32'], [dataString, salt]));
}

// --- Main Handler ---

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { type = 'funding' } = body; // تشخیص نوع پروپوزال

        const db = await getDb();
        const proposalsCollection = db.collection('proposals');

        // ==========================================
        // SCENARIO 1: Treasury Action Proposal
        // ==========================================
        if (type === 'treasury') {
            const validation = treasuryProposalSchema.safeParse(body);
            if (!validation.success) {
                return NextResponse.json({ success: false, message: "Invalid treasury data", errors: validation.error.flatten() }, { status: 400 });
            }
            const data = validation.data;

            // تولید هش توضیحات
            const descriptionHash = computeProposalHash({ 
                title: data.title, 
                description: data.description, 
                type: 'treasury' 
            });

            // ذخیره در دیتابیس (با فرمت سازگار با سیستم)
            const offChainData = {
                type: 'treasury',
                projectName: data.title, // مپ کردن تایتل به نام پروژه برای نمایش در لیست
                description: data.description,
                proposerAddress: data.proposerAddress,
                recipient: data.recipient,
                amount: data.amount,
                tokenType: data.tokenType,
                
                // فیلدهای سیستمی
                descriptionHash,
                createdAt: new Date(),
                onChainStatus: 'pending_submission',
                proposalIdOnChain: null,
                
                // فیلدهای خالی برای جلوگیری از کرش کردن UI در لیست‌ها
                tagline: 'Treasury Withdrawal Request',
                milestones: [], 
                aiAnalysis: null 
            };

            const result = await proposalsCollection.insertOne(offChainData);

            // آرگومان‌های قرارداد برای createTreasuryActionProposal
            const txArgs = [
                descriptionHash,
                data.recipient as Address,
                parseEther(data.amount),
                data.tokenType
            ];

            return safeJsonResponse({
                success: true,
                message: 'Treasury proposal ready.',
                mongoId: result.insertedId.toString(),
                txArgs,
                functionName: 'createTreasuryActionProposal'
            });
        }

        // ==========================================
        // SCENARIO 2: Funding Proposal (Startup)
        // ==========================================
        else {
            const validation = fundingProposalSchema.safeParse(body);
            if (!validation.success) {
                console.error("Validation failed:", JSON.stringify(validation.error.errors, null, 2));
                return NextResponse.json({ success: false, message: "Invalid funding data", errors: validation.error.flatten() }, { status: 400 });
            }
            const data = validation.data;

            const descriptionHash = computeProposalHash({
                projectName: data.projectName,
                description: data.description,
                documents: data.documents,
                marketStats: data.marketStats, 
                financialStats: data.financialStats
            });

            const offChainData = {
                ...data,
                type: 'funding', // مشخص کردن نوع
                descriptionHash,
                createdAt: new Date(),
                onChainStatus: 'pending_submission',
                proposalIdOnChain: null,
            };

            const result = await proposalsCollection.insertOne(offChainData);
            
            await logEvent('INFO', 'PROPOSAL_SUBMIT', 'Off-chain data saved.', {
                proposer: data.proposerAddress,
                mongoId: result.insertedId.toString(),
            });

            // آرگومان‌های قرارداد برای submitFundingProposal
            const txArgs = [
                descriptionHash,
                data.recipient as Address,
                data.milestones.map(m => ({
                    name: m.name,
                    durationDays: BigInt(m.durationDays),
                    amount: parseEther(m.amount),
                    state: 0, 
                    proofOfProgressHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
                    released: false,
                })),
            ];

            return safeJsonResponse({
                success: true,
                message: 'Funding proposal ready.',
                mongoId: result.insertedId.toString(),
                txArgs,
                functionName: 'submitFundingProposal'
            });
        }

    } catch (error) {
        console.error("Error in /api/proposals/submit:", error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
    }
}