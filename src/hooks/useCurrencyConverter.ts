// src/hooks/useCurrencyConverter.ts (فایل جدید)

import { useTranslation } from './use-translation';
import { useReadContract } from 'wagmi';
import { useWeb3 } from '@/context/Web3Provider';
import { daoRegistryAbi, rayanChainTokenAbi } from '@/lib/blockchain/generated';
import { formatUnits } from 'viem';
import type { Address } from 'viem';
import { REGISTRY_KEYS } from '@/lib/blockchain/registry-keys'; // ✅ ایمپورت کلید رجیستری

const exchangeRates = {
    'en': { rate: 1, symbol: 'USD' },
    'fa': { rate: 1200000, symbol: 'IRR' },
    'ar': { rate: 3.75, symbol: 'SAR' },
    'tr': { rate: 41.99, symbol: 'TRY' },
    'de': { rate: 0.859, symbol: 'EUR' },
    'ru': { rate: 80.8, symbol: 'RUB' },
};


export const useCurrencyConverter = () => {
    const { locale } = useTranslation();
    const { registryAddress, isHydrated } = useWeb3();

    // ✅ FIX 1: خواندن آدرس توکن از رجیستری
    const { data: tokenAddressResult } = useReadContract({
        address: registryAddress as Address | undefined,
        abi: daoRegistryAbi,
        functionName: 'getAddress',
        args: [REGISTRY_KEYS.TOKEN],
        query: { enabled: !!registryAddress && isHydrated },
    });
    const tokenAddress = tokenAddressResult as Address | undefined;

    // ✅ FIX 2: خواندن قیمت RYC با ABI صحیح
    const { data: rycPriceInUsdBigInt, isLoading: isPriceLoading } = useReadContract({
        address: tokenAddress,
        // ✅ ABI را به صورت any کست می‌کنیم تا خطای TypeScript موقتاً حل شود.
        // شما باید ABI را مجدداً generate کنید تا این خطا به طور کامل رفع شود.
        abi: rayanChainTokenAbi as any,
        functionName: 'getRycPriceInUsd',
        query: {
            enabled: !!tokenAddress,
            staleTime: 1000 * 60 * 5,
        },
    });

    // ✅ FIX 3: مدیریت صحیح نوع داده برای formatUnits
    const rycPriceUsd = rycPriceInUsdBigInt && typeof rycPriceInUsdBigInt === 'bigint'
        ? parseFloat(formatUnits(rycPriceInUsdBigInt, 18))
        : 0;

    const currentRate = exchangeRates[locale as keyof typeof exchangeRates] || exchangeRates['en'];

    const convertRycToLocalCurrency = (rycAmount: string | number): string => {
        const amount = typeof rycAmount === 'string' ? parseFloat(rycAmount) : rycAmount;
        if (isPriceLoading || !rycPriceUsd || isNaN(amount) || amount <= 0) {
            return `~`;
        }
        const valueInUsd = amount * rycPriceUsd;
        const localValue = valueInUsd * currentRate.rate;
        return new Intl.NumberFormat(locale, { style: 'currency', currency: currentRate.symbol }).format(localValue);
    };

    return { convertRycToLocalCurrency, isPriceLoading };
};