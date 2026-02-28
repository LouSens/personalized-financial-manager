export type Currency = string; // Was 'USD' | 'MYR' | 'IDR', now dynamic

export interface Account {
    id: string;
    name: string;
    type: string;
    balance: number;
    initialBalance: number;
    currency: Currency;
    color: string;
}

export interface Transaction {
    id: string;
    date: string; // ISO date string
    amount: number;
    type: 'Income' | 'Expense' | 'Transfer';
    category: string;
    accountId: string;
    toAccountId?: string; // For transfers
    note?: string;
    toAmount?: number; // For cross-currency transfers, the amount received in destination currency
}

export interface PortfolioItem {
    id: string;
    symbol: string;
    name: string;
    quantity: number;
    costBasis: number; // Total cost
    currentPrice: number; // Manually updated for now
    currency: Currency; // Currency of the asset
}

export interface Settings {
    baseCurrency: Currency;
    exchangeRates: Record<Currency, number>; // Base is USD
    theme: 'light' | 'dark' | 'system';
    categories: string[];
    accountTypes: string[];
}

export interface AppState {
    accounts: Account[];
    transactions: Transaction[];
    portfolio: PortfolioItem[];
    settings: Settings;
    addAccount: (account: Account) => void;
    removeAccount: (id: string) => void;
    updateAccount: (id: string, updates: Partial<Account>) => void;
    addTransaction: (transaction: Transaction) => void;
    removeTransaction: (id: string) => void;
    updateTransaction: (id: string, updates: Partial<Transaction>) => void;
    addPortfolioItem: (item: PortfolioItem) => void;
    removePortfolioItem: (id: string) => void;
    updatePortfolioItem: (id: string, updates: Partial<PortfolioItem>) => void;
    updateSettings: (updates: Partial<Settings>) => void;
    resetData: () => void;
}
