"use client"

import { TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import * as React from "react"
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

const chartConfig = {
  investment: {
    label: "Investment",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

export function InvestmentChart() {
  const { t, locale } = useTranslation();
  chartConfig.investment.label = t('dashboard.investment_chart_label');

  const chartData = React.useMemo(() => {
    const data = [];
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
        const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
        data.push({
            month: formatLocaleDate(date, locale, { month: 'short' }),
            investment: Math.floor(Math.random() * (300 - 150 + 1) + 150),
        });
    }
    return data;
  }, [locale]);


  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">{t('dashboard.investment_analysis')}</CardTitle>
        <CardDescription>{t('dashboard.investment_analysis_desc')}</CardDescription>
      </CardHeader>
      <CardContent>
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
