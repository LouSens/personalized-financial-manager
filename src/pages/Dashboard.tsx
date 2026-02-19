import React, { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { formatCurrency, convertCurrency } from '../utils/currency';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart as RechartsPieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import { endOfMonth, eachMonthOfInterval, subMonths, format, parseISO, isAfter } from 'date-fns';
import { Wallet, PieChart, TrendingUp } from 'lucide-react';

const Dashboard: React.FC = () => {
    const { accounts, transactions, portfolio, settings } = useStore();

    // --- 1. Current Net Worth Calculation ---
    const calculateCurrentCashBalance = () => {
        // Sum of all initial balances
        const totalInitial = accounts.reduce((acc, account) => {
            return acc + convertCurrency(account.initialBalance, account.currency, settings.baseCurrency, settings.exchangeRates);
        }, 0);

        // Sum of all transactions (converted to base currency)
        const totalTransactions = transactions.reduce((acc, t) => {
            const account = accounts.find(a => a.id === t.accountId);
            if (!account) return acc;

            let amount = 0;
            const rate = settings.exchangeRates[account.currency] || 1;
            const baseRate = settings.exchangeRates[settings.baseCurrency] || 1;
            // Amount component in base currency
            const amountInBase = (t.amount / rate) * baseRate;

            if (t.type === 'Income') amount = amountInBase;
            else if (t.type === 'Expense') amount = -amountInBase;
            else if (t.type === 'Transfer') {
                if (t.accountId === t.toAccountId) return acc; // Same account transfer, no net change
                // Outflow from source
                amount = -amountInBase;

                // Inflow to destination
                if (t.toAccountId) {
                    const toAccount = accounts.find(a => a.id === t.toAccountId);
                    if (toAccount) {
                        // For total cash balance in base currency, we just add the same value back
                        // because it's a transfer within the system.
                        amount += amountInBase;
                    }
                }
            }
            return acc + amount;
        }, 0);

        return totalInitial + totalTransactions;
    };

    const currentCashBalance = calculateCurrentCashBalance();
    const currentPortfolioValue = portfolio.reduce((acc, item) => acc + (item.quantity * item.currentPrice), 0); // Assuming base currency for portfolio
    const currentNetWorth = currentCashBalance + currentPortfolioValue;

    // --- 2. Net Worth History (Last 6 Months) ---
    const netWorthHistory = useMemo(() => {
        const today = new Date();
        const months = eachMonthOfInterval({
            start: subMonths(today, 5),
            end: today,
        });

        return months.map(monthDate => {
            const monthEnd = endOfMonth(monthDate);

            const cashAtMonth = accounts.reduce((acc, account) => {
                return acc + convertCurrency(account.initialBalance, account.currency, settings.baseCurrency, settings.exchangeRates);
            }, 0) + transactions.reduce((acc, t) => {
                if (isAfter(parseISO(t.date), monthEnd)) return acc;

                const account = accounts.find(a => a.id === t.accountId);
                if (!account) return acc;

                let amount = 0;
                const rate = settings.exchangeRates[account.currency] || 1;
                const baseRate = settings.exchangeRates[settings.baseCurrency] || 1;
                const amountInBase = (t.amount / rate) * baseRate;

                if (t.type === 'Income') amount = amountInBase;
                else if (t.type === 'Expense') amount = -amountInBase;
                // Transfers cancel out for Net Worth
                return acc + amount;
            }, 0);

            // Assume portfolio value is constant (limitation) or we could try to verify purchase date if we had it.
            // We'll just add current portfolio value.
            return {
                name: format(monthDate, 'MMM'),
                netWorth: cashAtMonth + currentPortfolioValue,
            };
        });
    }, [accounts, transactions, currentPortfolioValue, settings]);

    // --- 3. Asset Allocation ---
    const allocationData = useMemo(() => {
        // Group by Account Type + Portfolio
        const typeMap = new Map<string, number>();

        // Cash/Accounts
        accounts.forEach(account => {
            // Calculate current balance for this account
            // Optimization: We could use a helper, but let's re-calc briefly
            // Actually, for allocation, we can just sum up balances by type.
            // We need 'current' balance of account.
            // Let's copy logic from Accounts.tsx or generalize.
            // For dashboard, let's just use 'Cash' vs 'Investment' (Portfolio).
            // Or specific account types.

            // Let's simplify: Group by Account Type.
            // We need the Current Balance of this account.
            const accountTransactions = transactions.filter(t => t.accountId === account.id || t.toAccountId === account.id);
            const txSum = accountTransactions.reduce((sum, t) => {
                let pad = 0;
                if (t.accountId === account.id) {
                    if (t.type === 'Income') pad = t.amount;
                    if (t.type === 'Expense') pad = -t.amount;
                    if (t.type === 'Transfer') pad = -t.amount;
                }
                if (t.toAccountId === account.id && t.type === 'Transfer') {
                    pad = t.amount;
                }
                return sum + pad;
            }, 0);

            const bal = account.initialBalance + txSum;
            const balInBase = convertCurrency(bal, account.currency, settings.baseCurrency, settings.exchangeRates);

            const type = account.type;
            typeMap.set(type, (typeMap.get(type) || 0) + balInBase);
        });

        // Portfolio
        const portfolioVal = currentPortfolioValue; // Already in base
        if (portfolioVal > 0) {
            typeMap.set('Stock Portfolio', (typeMap.get('Stock Portfolio') || 0) + portfolioVal);
        }

        return Array.from(typeMap.entries()).map(([name, value]) => ({ name, value }));
    }, [accounts, transactions, currentPortfolioValue, settings]);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

    // --- 4. Monthly Income vs Expense (Last 6 Months) ---
    const monthlyStats = useMemo(() => {
        const today = new Date();
        const months = eachMonthOfInterval({
            start: subMonths(today, 5),
            end: today,
        });

        return months.map(monthDate => {
            const monthStr = format(monthDate, 'yyyy-MM');
            const monthTransactions = transactions.filter(t => t.date.startsWith(monthStr));

            let income = 0;
            let expense = 0;

            monthTransactions.forEach(t => {
                const account = accounts.find(a => a.id === t.accountId);
                if (!account) return;
                const rate = settings.exchangeRates[account.currency] || 1;
                const baseRate = settings.exchangeRates[settings.baseCurrency] || 1;
                const amountInBase = (t.amount / rate) * baseRate;

                if (t.type === 'Income') income += amountInBase;
                if (t.type === 'Expense') expense += amountInBase;
            });

            return {
                name: format(monthDate, 'MMM'),
                Income: income,
                Expense: expense
            };
        });
    }, [transactions, accounts, settings]);

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-20 md:pb-0">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h2>

            {/* Top Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-200 dark:shadow-none">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-blue-100 text-sm font-medium">Net Worth</p>
                            <h3 className="text-3xl font-bold mt-1">{formatCurrency(currentNetWorth, settings.baseCurrency)}</h3>
                        </div>
                        <div className="p-2 bg-blue-500 rounded-lg">
                            <TrendingUp size={24} className="text-white" />
                        </div>
                    </div>
                    <p className="text-sm text-blue-100 opacity-80">
                        Across {accounts.length} accounts & portfolio
                    </p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Cash Balance</p>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(currentCashBalance, settings.baseCurrency)}</h3>
                        </div>
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <Wallet size={24} className="text-green-600 dark:text-green-400" />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Portfolio Value</p>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(currentPortfolioValue, settings.baseCurrency)}</h3>
                        </div>
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                            <PieChart size={24} className="text-purple-600 dark:text-purple-400" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Net Worth Growth */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Net Worth Growth</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={netWorthHistory}>
                                <defs>
                                    <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} dy={10} />
                                <YAxis hide />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value: any) => formatCurrency(value, settings.baseCurrency)}
                                />
                                <Area type="monotone" dataKey="netWorth" stroke="#2563EB" strokeWidth={3} fillOpacity={1} fill="url(#colorNetWorth)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Monthly Income vs Expense */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Income vs Expense</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthlyStats} barGap={8}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} dy={10} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value: any) => formatCurrency(value, settings.baseCurrency)}
                                />
                                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                                <Bar dataKey="Income" fill="#10B981" radius={[4, 4, 0, 0]} barSize={20} />
                                <Bar dataKey="Expense" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Asset Allocation */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Asset Allocation</h3>
                <div className="h-64 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                            <Pie
                                data={allocationData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {allocationData.map((_entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value: any) => formatCurrency(value, settings.baseCurrency)} />
                            <Legend />
                        </RechartsPieChart>
                    </ResponsiveContainer>
                </div>
            </div>

        </div>
    );
};

export default Dashboard;
