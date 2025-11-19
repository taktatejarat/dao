"use client"

import { TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { useTranslation } from "@/hooks/use-translation"
import { useLanguage } from "@/context/LanguageProvider"
import { formatLocaleDate } from "@/lib/utils"
import React from "react";
import { DaoLoadingSpinner } from "../icons/dao-loading-spinner";

const chartConfig = {
  investment: {
    label: "Investment",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig


export function InvestmentChart() {
    const { t, locale } = useTranslation();
    const [chartData, setChartData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchChartData = async () => {
            try {
                const response = await fetch('/api/charts/investments');
                const data = await response.json();
                if (data.success) {
                    // فرمت کردن ماه برای نمایش محلی
                    const formattedData = data.data.map((item: any) => ({
                        ...item,
                        month: formatLocaleDate(new Date(item.month), locale, { month: 'short' }),
                    }));
                    setChartData(formattedData);
                }
            } catch (error) {
                console.error("Failed to fetch chart data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchChartData();
    }, [locale]);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-gradient">{t('dashboard.investment_analysis')}</CardTitle>
                <CardDescription>{t('dashboard.investment_analysis_desc')}</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center items-center h-[200px]"><DaoLoadingSpinner /></div>
                ) : (
                    <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <YAxis hide={true} />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <Bar dataKey="investment" fill="var(--color-investment)" radius={4} />
          </BarChart>
        </ChartContainer>
        )}
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 font-medium leading-none">
          {t('dashboard.investment_analysis_footer1')} <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          {t('dashboard.investment_analysis_footer2')}
        </div>
      </CardFooter>
         </Card>
    )
}
