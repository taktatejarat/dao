// src/hooks/useCurrencyConverter.ts (فایل جدید)
import { useTranslation } from './use-translation';

const exchangeRates = {
    'en': { rate: 1, symbol: 'USD' },
    'fa': { rate: 1200000, symbol: 'IRR' },
    'ar': { rate: 3.75, symbol: 'SAR' },
    'tr': { rate: 41.99, symbol: 'TRY' },
    'de': { rate: 0.859, symbol: 'EUR' },
    'ru': { rate: 80.8, symbol: 'RUB' },
};
const RYC_PRICE_USD = 0.5; // مثال: قیمت هر توکن RYC به دلار

export const useCurrencyConverter = () => {
    const { locale } = useTranslation();
    const currentRate = exchangeRates[locale as keyof typeof exchangeRates] || exchangeRates['en'];

    const convertRycToLocalCurrency = (rycAmount: string | number): string => {
        const amount = typeof rycAmount === 'string' ? parseFloat(rycAmount) : rycAmount;
        if (isNaN(amount) || amount <= 0) return `0 ${currentRate.symbol}`;
        const valueInUsd = amount * RYC_PRICE_USD;
        const localValue = valueInUsd * currentRate.rate;
        return new Intl.NumberFormat(locale, { style: 'currency', currency: currentRate.symbol }).format(localValue);
    };
    return { convertRycToLocalCurrency };
};