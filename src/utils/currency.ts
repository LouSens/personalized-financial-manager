import type { Currency } from '../types';

export const formatCurrency = (amount: number, currency: Currency): string => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
};

export const convertCurrency = (
    amount: number,
    from: Currency,
    to: Currency,
    rates: Record<Currency, number>
): number => {
    if (from === to) return amount;
    const amountInUSD = amount / rates[from];
    return amountInUSD * rates[to];
};
