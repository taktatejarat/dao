import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, formatEther, isAddress, type Address } from 'viem';
import { polygonAmoy } from 'viem/chains';

const client = createPublicClient({
    chain: polygonAmoy,
    transport: http(process.env.NEXT_PUBLIC_RPC_URL),
});

const ETHERSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY;
const ETHERSCAN_BASE_URL = 'https://api.etherscan.io/v2/api';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ address: string }>
}

export async function GET(
    req: NextRequest,
    props: Props
) {
    const params = await props.params; // ✅ Await
    const userAddress = params.address as Address;

    if (!isAddress(userAddress)) {
        return NextResponse.json({ success: false, message: 'Invalid address' }, { status: 400 });
    }

    try {
        // 1. دریافت اطلاعات پایه همزمان (Parallel Fetching)
        const [balance, transactionCount, code] = await Promise.all([
            client.getBalance({ address: userAddress }),
            client.getTransactionCount({ address: userAddress }),
            client.getBytecode({ address: userAddress }),
        ]);

        const isContract = code !== undefined && code !== '0x';
        const formattedBalance = parseFloat(formatEther(balance));

        // 2. دریافت لیست تراکنش‌های اخیر برای گراف (از Etherscan)
        let recentInteractions: any[] = [];
        if (ETHERSCAN_API_KEY) {
            try {
                // تلاش برای گرفتن تراکنش‌های واقعی
                const url = `${ETHERSCAN_BASE_URL}?chainid=80002&module=account&action=txlist&address=${userAddress}&startblock=0&endblock=99999999&page=1&offset=10&sort=desc&apikey=${ETHERSCAN_API_KEY}`;
                const res = await fetch(url);
                const data = await res.json();
                
                if (data.status === '1' && Array.isArray(data.result)) {
                    recentInteractions = data.result.map((tx: any) => ({
                        hash: tx.hash,
                        from: tx.from,
                        to: tx.to,
                        value: formatEther(BigInt(tx.value)),
                        isError: tx.isError === '1',
                        timeStamp: tx.timeStamp
                    }));
                }
            } catch (e) {
                console.warn("Explorer API failed, using fallback nodes");
            }
        }

        // اگر API تراکنش کار نکرد یا خالی بود، چند نود پیش‌فرض (قراردادهای سیستم) را نشان بده
        // تا گراف خالی نباشد (برای دمو)
        if (recentInteractions.length === 0) {
            // فرض می‌کنیم کاربر با قراردادهای اصلی تعامل داشته است
            recentInteractions = [
                { to: process.env.NEXT_PUBLIC_DAO_ADDRESS || '0xDAO...', type: 'Governance' },
                { to: process.env.NEXT_PUBLIC_TOKEN_ADDRESS || '0xToken...', type: 'Token Transfer' },
            ];
        }

        // 3. محاسبه امتیاز اعتماد (Trust Score Algorithm)
        let trustScore = 0;
        let reasons: string[] = [];

        // الف) قدمت و فعالیت (تعداد تراکنش)
        if (transactionCount > 0) trustScore += 20;
        if (transactionCount > 50) trustScore += 20;
        if (transactionCount > 100) trustScore += 10;

        // ب) موجودی (Skin in the game)
        if (formattedBalance > 0.01) trustScore += 10;
        if (formattedBalance > 1) trustScore += 20;

        // ج) آیا قرارداد است؟
        if (isContract) {
            trustScore = 80; // قراردادها معمولا معتبرترند (یا خیلی خطرناک!)
            reasons.push("Address is a Smart Contract");
        } else {
            reasons.push("EOA Wallet");
        }

        // د) بررسی ناهنجاری (Anomaly Detection)
        let anomalyDetected = false;
        let reportKey = 'analytics_page.status_clean';

        if (transactionCount === 0 && formattedBalance === 0) {
            trustScore = 10; // کیف پول کاملا خالی و جدید
            reportKey = 'analytics_page.status_inactive'; // نیاز به افزودن به ترجمه
        } else if (transactionCount > 1000 && formattedBalance < 0.001) {
            anomalyDetected = true;
            trustScore = 30; // رفتار ربات‌گونه (تراکنش زیاد، پول کم)
            reportKey = 'analytics_page.status_bot_suspected'; // نیاز به افزودن به ترجمه
        }

        // محدود کردن امتیاز به ۱۰۰
        trustScore = Math.min(trustScore, 100);

        // داده نهایی برای فرانت
        const analyticsData = {
            trust_score: trustScore,
            anomaly_detected: anomalyDetected,
            report_key: reportKey,
            stats: {
                balance: formattedBalance,
                txCount: transactionCount,
                isContract
            },
            graph_data: {
                centralNode: userAddress,
                connections: recentInteractions.slice(0, 8) // حداکثر ۸ نود برای شلوغ نشدن گراف
            }
        };

        return NextResponse.json({ success: true, data: analyticsData });

    } catch (error) {
        console.error('Analytics API Error:', error);
        return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
    }
}