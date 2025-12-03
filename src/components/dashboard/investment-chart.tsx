// src/components/dashboard/investment-chart.tsx

"use client"

import { TrendingUp, BarChart2 } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts"
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useTranslation } from "@/hooks/use-translation"
import { DaoLoadingSpinner } from "../icons/dao-loading-spinner";

interface ChartDataPoint {
    month: string;
    investment: number;
}

interface InvestmentChartProps {
    data?: ChartDataPoint[]; // ✅ داده ورودی
    isLoading?: boolean;
}

export function InvestmentChart({ data: inputData, isLoading: parentLoading }: InvestmentChartProps) {
    const { t } = useTranslation();
    const [internalData, setInternalData] = useState<ChartDataPoint[]>([]);
    const [isInternalLoading, setIsInternalLoading] = useState(true);

    // منطق هیبرید: اگر داده نیامد، فچ کن (برای سازگاری با صفحات قدیمی)
    useEffect(() => {
        if (inputData) {
            setInternalData(inputData);
            setIsInternalLoading(false);
            return;
        }

        // Fallback: Fetching logic if no data provided
        const fetchChartData = async () => {
            try {
                const response = await fetch('/api/charts/investments');
                const result = await response.json();
                if (result.success) {
                    setInternalData(result.data);
                }
            } catch (error) {
                console.error("Chart fetch error:", error);
            } finally {
                setIsInternalLoading(false);
            }
        };
        fetchChartData();
    }, [inputData]);

    const isLoading = parentLoading !== undefined ? parentLoading : isInternalLoading;

    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle className="font-headline text-gradient flex items-center gap-2">
                    <BarChart2 className="h-5 w-5" />
                    {t('dashboard.investment_analysis')}
                </CardTitle>
                <CardDescription>{t('dashboard.investment_analysis_desc')}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 min-h-[200px]">
                {isLoading ? (
                    <div className="flex h-full items-center justify-center"><DaoLoadingSpinner /></div>
                ) : internalData.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                        {t('dashboard.no_chart_data')}
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={internalData}>
                            <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
                            <XAxis 
                                dataKey="month" 
                                tickLine={false} 
                                axisLine={false} 
                                tickMargin={10} 
                                fontSize={12}
                                tick={{ fill: 'currentColor', opacity: 0.7 }}
                            />
                            <YAxis hide />
                            <Tooltip 
                                cursor={{ fill: 'var(--muted)', opacity: 0.2 }}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            />
                            <Bar 
                                dataKey="investment" 
                                fill="currentColor" 
                                className="fill-primary" 
                                radius={[4, 4, 0, 0]} 
                                barSize={40}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
            <CardFooter className="flex-col items-start gap-1 text-sm border-t pt-4">
                <div className="flex gap-2 font-medium leading-none text-green-500">
                    {t('dashboard.trending_up')} <TrendingUp className="h-4 w-4" />
                </div>
                <div className="leading-none text-muted-foreground text-xs">
                    {t('dashboard.investment_analysis_footer2')}
                </div>
            </CardFooter>
        </Card>
    )
}