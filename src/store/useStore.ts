import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AppState, Settings } from '../types';

const DEFAULT_SETTINGS: Settings = {
    baseCurrency: 'IDR',
    exchangeRates: {
        USD: 1,
        MYR: 4.7,
        IDR: 15500,
    },
    theme: 'system',
};

export const useStore = create<AppState>()(
    persist(
        (set) => ({
            accounts: [],
            transactions: [],
            portfolio: [],
            settings: DEFAULT_SETTINGS,

            addAccount: (account) =>
                set((state) => ({ accounts: [...state.accounts, account] })),

            removeAccount: (id) =>
                set((state) => ({
                    accounts: state.accounts.filter((a) => a.id !== id),
                    transactions: state.transactions.filter((t) => t.accountId !== id && t.toAccountId !== id),
                })),

            updateAccount: (id, updates) =>
                set((state) => ({
                    accounts: state.accounts.map((a) => (a.id === id ? { ...a, ...updates } : a)),
                })),

            addTransaction: (transaction) =>
                set((state) => {
                    // Logic to update account balances based on transaction type could be added here or computed.
                    // For now, we just store the transaction.
                    // Actually, for a simple app, it's often better to COMPUTE balances from initial + transactions,
                    // but the requirement asks for "define initial balance".
                    // So Balance = Initial Balance + Sum(Income) - Sum(Expense) +/- Transfers.
                    // We will use derived state in components for 'current balance'.
                    return { transactions: [...state.transactions, transaction] };
                }),

            removeTransaction: (id) =>
                set((state) => ({
                    transactions: state.transactions.filter((t) => t.id !== id),
                })),

            updateTransaction: (id, updates) =>
                set((state) => ({
                    transactions: state.transactions.map((t) => (t.id === id ? { ...t, ...updates } : t)),
                })),

            addPortfolioItem: (item) =>
                set((state) => ({ portfolio: [...state.portfolio, item] })),

            removePortfolioItem: (id) =>
                set((state) => ({ portfolio: state.portfolio.filter((i) => i.id !== id) })),

            updatePortfolioItem: (id, updates) =>
                set((state) => ({
                    portfolio: state.portfolio.map((i) => (i.id === id ? { ...i, ...updates } : i)),
                })),

            updateSettings: (updates) =>
                set((state) => ({ settings: { ...state.settings, ...updates } })),

            resetData: () =>
                set({
                    accounts: [],
                    transactions: [],
                    portfolio: [],
                    settings: DEFAULT_SETTINGS,
                }),
        }),
        {
            name: 'finance-manager-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
