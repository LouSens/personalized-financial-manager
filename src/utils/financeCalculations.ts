import { endOfMonth, isAfter } from 'date-fns';
import type { Account, Transaction, PortfolioItem, Settings } from '../types';
import { convertCurrency } from './currency';

/**
 * Calculates the total value, cost basis, gain/loss, and percentage return of the portfolio.
 * Ensures consitency with Portfolio page logic.
 */
export const calculatePortfolioStats = (
    portfolio: PortfolioItem[],
    settings: Settings
) => {
    const totalCost = portfolio.reduce((acc, item) => {
        return acc + convertCurrency(item.costBasis, item.currency || settings.baseCurrency, settings.baseCurrency, settings.exchangeRates);
    }, 0);

    const totalValue = portfolio.reduce((acc, item) => {
        const itemMarketValue = item.quantity * item.currentPrice;
        return acc + convertCurrency(itemMarketValue, item.currency || settings.baseCurrency, settings.baseCurrency, settings.exchangeRates);
    }, 0);

    const totalGainLoss = totalValue - totalCost;
    const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

    return {
        totalCost,
        totalValue,
        totalGainLoss,
        totalGainLossPercent
    };
};

/**
 * Calculates the cash balance (sum of all accounts) at a specific point in time.
 * If date is provided, considers only transactions up to that date.
 */
export const getCashBalanceAtDate = (
    accounts: Account[],
    transactions: Transaction[],
    date: Date = new Date(),
    settings: Settings
): number => {
    // 1. Calculate Initial Balance (Sum of all accounts' initial balance)
    // Note: Initial balance is assumed to be the starting point. 
    // If we wanted true time-travel for initial balance we'd need account creation dates, 
    // but typically initial balance acts as "Balance at start of tracking".
    const totalInitial = accounts.reduce((acc, account) => {
        return acc + convertCurrency(account.initialBalance, account.currency, settings.baseCurrency, settings.exchangeRates);
    }, 0);

    // 2. Sum transactions up to the end of the target date
    const targetEnd = endOfMonth(date); // We usually want balance at END of the month/period

    const totalTransactions = transactions.reduce((acc, t) => {
        const tDate = new Date(t.date);
        if (isAfter(tDate, targetEnd)) return acc;

        const account = accounts.find(a => a.id === t.accountId);
        if (!account) return acc;

        let amount = 0;
        const rate = settings.exchangeRates[account.currency] || 1;
        const baseRate = settings.exchangeRates[settings.baseCurrency] || 1;

        // Convert transaction amount to BASE currency
        // Logic: amount / sourceRate * baseRate
        const amountInBase = (t.amount / rate) * baseRate;

        if (t.type === 'Income') {
            amount = amountInBase;
        } else if (t.type === 'Expense') {
            amount = -amountInBase;
        } else if (t.type === 'Transfer') {
            // Outflow from source
            amount = -amountInBase;

            // Inflow to destination (if it's one of our accounts)
            if (t.toAccountId) {
                const toAccount = accounts.find(a => a.id === t.toAccountId);
                if (toAccount) {
                    // If we have a specific 'toAmount', use that converted to base
                    if (t.toAmount !== undefined) {
                        const toRate = settings.exchangeRates[toAccount.currency] || 1;
                        const toAmountInBase = (t.toAmount / toRate) * baseRate;
                        amount += toAmountInBase;
                    } else {
                        // Otherwise assume conservation of value in base currency
                        amount += amountInBase;
                    }
                }
            }
        }
        return acc + amount;
    }, 0);

    return totalInitial + totalTransactions;
};

/**
 * Calculates a specific account's balance at a specific point in time.
 * Returns the balance in the ACCOUNT'S currency.
 */
export const getAccountBalanceAtDate = (
    account: Account,
    transactions: Transaction[],
    date: Date = new Date()
): number => {
    const targetEnd = endOfMonth(date);

    // Initial Balance
    let balance = account.initialBalance;

    // Filter transactions relevant to this account up to the date
    const accountTransactions = transactions.filter(t => {
        const tDate = new Date(t.date);
        return !isAfter(tDate, targetEnd) && (t.accountId === account.id || t.toAccountId === account.id);
    });

    // Sum transactions
    const totalTransactionAmount = accountTransactions.reduce((acc, t) => {
        let amount = 0;
        if (t.type === 'Income' && t.accountId === account.id) {
            amount = t.amount;
        } else if (t.type === 'Expense' && t.accountId === account.id) {
            amount = -t.amount;
        } else if (t.type === 'Transfer') {
            if (t.accountId === account.id) {
                amount = -t.amount; // Outgoing
            } else if (t.toAccountId === account.id) {
                // Incoming: Use toAmount if available, otherwise original amount
                amount = t.toAmount !== undefined ? t.toAmount : t.amount;
            }
        }
        return acc + amount;
    }, 0);

    return balance + totalTransactionAmount;
};

/**
 * Calculates Net Worth at a specific date.
 * Net Worth = Cash Balance + Portfolio Value
 */
export const getNetWorthAtDate = (
    accounts: Account[],
    transactions: Transaction[],
    portfolio: PortfolioItem[],
    date: Date = new Date(),
    settings: Settings
): number => {
    const cashBalance = getCashBalanceAtDate(accounts, transactions, date, settings);

    // For Portfolio, we don't have historical price data in this simple app.
    // We will assume the portfolio value allows for some constant or manual entry.
    // LIMITATION: Use current portfolio value for all dates (or 0 if we assume they didn't have it? Hard to say).
    // Better approach for this app: Use current portfolio value always, 
    // as we don't track historical portfolio snapshots.
    const { totalValue: portfolioValue } = calculatePortfolioStats(portfolio, settings);

    return cashBalance + portfolioValue;
};

/**
 * Calculates percentage change between current and previous value.
 */
export const calculatePercentageChange = (current: number, previous: number): number => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
};
