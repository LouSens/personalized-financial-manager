import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { formatCurrency, convertCurrency } from '../utils/currency';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart as RechartsPieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import { eachMonthOfInterval, subMonths, subYears, format, parseISO, endOfMonth } from 'date-fns';
import { Wallet, PieChart, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { motion, type Variants } from 'framer-motion';
import Card from '../components/ui/Card';
import {
    calculatePortfolioStats,
    getNetWorthAtDate,
    getCashBalanceAtDate,
    calculatePercentageChange,
    getAccountBalanceAtDate
} from '../utils/financeCalculations';

const Dashboard: React.FC = () => {
    const accounts = useStore((state) => state.accounts);
    const transactions = useStore((state) => state.transactions);
    const portfolio = useStore((state) => state.portfolio);
    const settings = useStore((state) => state.settings);
    const [percentageMode, setPercentageMode] = useState<'MoM' | 'YoY'>('MoM');

    // --- Data Preparation ---
    // State for selected month (defaults to current month)
    const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));

    // Derived date object for calculations (End of the selected month)
    const selectedDate = useMemo(() => {
        // const date = new Date(selectedMonth + '-01'); // Start of month
        // We want calculations to be "at the end of this month" to capture all txs in it?
        // Or just "current state at end of month"?
        // Let's use end of month.
        // Wait, if it's CURRENT month, we might want "today"?
        // But using end of month covers "today" effectively for 'isBefore' checks if we treat future txs as non-existent.
        // But we don't have future txs usually. 
        // Let's use end of month logic for consistency.
        // Actually, date-fns 'endOfMonth' is good.
        // BUT, we need to import 'endOfMonth' and 'parseISO'.
        return new Date(new Date(selectedMonth + '-01').getFullYear(), new Date(selectedMonth + '-01').getMonth() + 1, 0);
    }, [selectedMonth]);

    // List of months for dropdown (Last 24 months)
    const months = useMemo(() => {
        const today = new Date();
        const range = eachMonthOfInterval({
            start: subMonths(today, 23),
            end: today,
        });
        return range.map(d => format(d, 'yyyy-MM')).reverse();
    }, []);

    // 1. Portfolio Stats (Fixes Discrepancy)
    const portfolioStats = useMemo(() =>
        calculatePortfolioStats(portfolio, settings),
        [portfolio, settings]);

    // 2. Comparisons (MoM / YoY)
    const comparisonDate = useMemo(() => {
        return percentageMode === 'MoM'
            ? subMonths(selectedDate, 1)
            : subYears(selectedDate, 1);
    }, [percentageMode, selectedDate]);

    // Net Worth
    const currentNetWorth = useMemo(() =>
        getNetWorthAtDate(accounts, transactions, portfolio, selectedDate, settings),
        [accounts, transactions, portfolio, settings, selectedDate]);

    const previousNetWorth = useMemo(() =>
        getNetWorthAtDate(accounts, transactions, portfolio, comparisonDate, settings),
        [accounts, transactions, portfolio, comparisonDate, settings]);

    const netWorthChange = calculatePercentageChange(currentNetWorth, previousNetWorth);

    // Cash Balance (Total Liquidity)
    const currentCash = useMemo(() =>
        getCashBalanceAtDate(accounts, transactions, selectedDate, settings),
        [accounts, transactions, settings, selectedDate]);

    const previousCash = useMemo(() =>
        getCashBalanceAtDate(accounts, transactions, comparisonDate, settings),
        [accounts, transactions, settings, comparisonDate]);

    const cashChange = calculatePercentageChange(currentCash, previousCash);


    // --- 2. Net Worth History (Last 6 Months relative to selected date) ---
    const netWorthHistory = useMemo(() => {
        const months = eachMonthOfInterval({
            start: subMonths(selectedDate, 5),
            end: selectedDate,
        });

        return months.map(monthDate => {
            const nw = getNetWorthAtDate(accounts, transactions, portfolio, monthDate, settings);
            return {
                name: format(monthDate, 'MMM'),
                netWorth: nw,
            };
        });
    }, [accounts, transactions, portfolio, settings, selectedDate]);

    // --- 5. Monthly Stats for Bar Chart (Last 6 Months relative to selected date) ---
    const monthlyStats = useMemo(() => {
        const months = eachMonthOfInterval({
            start: subMonths(selectedDate, 5),
            end: selectedDate,
        });

        return months.map(monthDate => {
            const monthStr = format(monthDate, 'yyyy-MM');
            const monthTransactions = transactions.filter(t => t.date.startsWith(monthStr));

            let income = 0;
            let expense = 0;

            monthTransactions.forEach(t => {
                if (t.type === 'Transfer') return;

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
    }, [transactions, accounts, settings, selectedDate]);

    // --- 3. Asset Allocation (Pie Chart) ---
    const allocationData = useMemo(() => {
        const typeMap = new Map<string, number>();

        // Cash/Accounts
        accounts.forEach(account => {
            const bal = getAccountBalanceAtDate(account, transactions, selectedDate);
            const balInBase = convertCurrency(bal, account.currency, settings.baseCurrency, settings.exchangeRates);

            const type = account.type;
            typeMap.set(type, (typeMap.get(type) || 0) + balInBase);
        });

        if (portfolioStats.totalValue > 0) {
            typeMap.set('Stock Portfolio', (typeMap.get('Stock Portfolio') || 0) + portfolioStats.totalValue);
        }

        return Array.from(typeMap.entries()).map(([name, value]) => ({ name, value }));
    }, [accounts, transactions, portfolioStats.totalValue, settings]);

    // --- 4. Expense Allocation by Category ---
    const categoryAllocationData = useMemo(() => {
        const categoryMap = new Map<string, number>();
        const monthStart = format(new Date(selectedMonth + '-01'), 'yyyy-MM-01');
        const monthEnd = format(endOfMonth(new Date(selectedMonth + '-01')), 'yyyy-MM-dd');

        transactions
            .filter(t => t.type === 'Expense' && t.date >= monthStart && t.date <= monthEnd)
            .forEach(t => {
                const account = accounts.find(a => a.id === t.accountId);
                if (!account) return;
                const rate = settings.exchangeRates[account.currency] || 1;
                const baseRate = settings.exchangeRates[settings.baseCurrency] || 1;
                const amountInBase = (t.amount / rate) * baseRate;

                const category = t.category || 'Uncategorized';
                categoryMap.set(category, (categoryMap.get(category) || 0) + amountInBase);
            });

        return Array.from(categoryMap.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value); // Sort by highest expense
    }, [transactions, accounts, settings, selectedMonth]);

    // --- Chart Colors ---
    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'];

    // --- Animation Variants ---
    const CONTAINER_VARIANTS: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const ITEM_VARIANTS: Variants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <motion.div
            variants={CONTAINER_VARIANTS}
            initial="hidden"
            animate="visible"
            className="space-y-8 pb-20 md:pb-0 max-w-7xl mx-auto"
        >
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                        Financial Overview
                    </h2>
                    <p className="text-slate-500 dark:text-zinc-400 mt-1">
                        Track your wealth and performance over time.
                    </p>
                </div>

                {/* Controls: Month Selector & MoM/YoY Toggle */}
                <div className="flex items-center gap-3 bg-white dark:bg-zinc-900 p-1.5 rounded-xl shadow-sm border border-slate-200 dark:border-zinc-800">
                    <div className="relative">
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="pl-3 pr-8 py-1.5 bg-transparent text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-lg transition-colors appearance-none"
                        >
                            {months.map(m => (
                                <option key={m} value={m}>{format(parseISO(m + '-01'), 'MMMM yyyy')}</option>
                            ))}
                        </select>
                        {/* Chevron / Icon for Select */}
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                    </div>

                    <div className="w-px h-6 bg-slate-200 dark:bg-zinc-700 mx-1"></div>

                    <div className="flex bg-slate-100 dark:bg-zinc-800 rounded-lg p-0.5 relative">
                        {/* Animated Background Pill */}
                        <motion.div
                            className="absolute top-0.5 bottom-0.5 rounded-md bg-white dark:bg-zinc-700 shadow-sm z-0"
                            layoutId="percentageModePill"
                            initial={false}
                            animate={{
                                left: percentageMode === 'MoM' ? '2px' : '50%',
                                width: 'calc(50% - 2px)'
                            }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                        <button
                            onClick={() => setPercentageMode('MoM')}
                            className={`relative z-10 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${percentageMode === 'MoM' ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-400'
                                }`}
                        >
                            MoM
                        </button>
                        <button
                            onClick={() => setPercentageMode('YoY')}
                            className={`relative z-10 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${percentageMode === 'YoY' ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-400'
                                }`}
                        >
                            YoY
                        </button>
                    </div>
                </div>
            </div>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Net Worth Card */}
                <Card variants={ITEM_VARIANTS}>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl">
                            <Wallet className="text-blue-600 dark:text-blue-400" size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-zinc-500">Net Worth</p>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                                {formatCurrency(currentNetWorth, settings.baseCurrency)}
                            </h3>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm bg-slate-50 dark:bg-white/5 p-3 rounded-xl border border-slate-100 dark:border-white/5">
                        {netWorthChange >= 0 ? (
                            <ArrowUpRight size={16} className="text-emerald-500" />
                        ) : (
                            <ArrowDownRight size={16} className="text-red-500" />
                        )}
                        <span className={`font-medium ${netWorthChange >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                            {Math.abs(netWorthChange).toFixed(1)}%
                        </span>
                        <span className="text-slate-400 dark:text-zinc-500">
                            vs last {percentageMode === 'MoM' ? 'month' : 'year'}
                        </span>
                    </div>
                </Card>

                {/* Portfolio Card */}
                <Card variants={ITEM_VARIANTS}>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-2xl">
                            <TrendingUp className="text-purple-600 dark:text-purple-400" size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-zinc-500">Portfolio</p>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                                {formatCurrency(portfolioStats.totalValue, settings.baseCurrency)}
                            </h3>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm bg-slate-50 dark:bg-white/5 p-3 rounded-xl border border-slate-100 dark:border-white/5">
                        {portfolioStats.totalGainLoss >= 0 ? (
                            <ArrowUpRight size={16} className="text-emerald-500" />
                        ) : (
                            <ArrowDownRight size={16} className="text-red-500" />
                        )}
                        <span className={`font-medium ${portfolioStats.totalGainLoss >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                            {Math.abs(portfolioStats.totalGainLossPercent).toFixed(1)}%
                        </span>
                        <span className="text-slate-400 dark:text-zinc-500">all time return</span>
                    </div>
                </Card>

                {/* Cash Balance Card (Replaced Monthly Savings) */}
                <Card variants={ITEM_VARIANTS}>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl">
                            <PieChart className="text-emerald-600 dark:text-emerald-400" size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-zinc-500">Cash Balance</p>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                                {formatCurrency(currentCash, settings.baseCurrency)}
                            </h3>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm bg-slate-50 dark:bg-white/5 p-3 rounded-xl border border-slate-100 dark:border-white/5">
                        {cashChange >= 0 ? (
                            <ArrowUpRight size={16} className="text-emerald-500" />
                        ) : (
                            <ArrowDownRight size={16} className="text-red-500" />
                        )}
                        <span className={`font-medium ${cashChange >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                            {Math.abs(cashChange).toFixed(1)}%
                        </span>
                        <span className="text-slate-400 dark:text-zinc-500">
                            vs last {percentageMode === 'MoM' ? 'month' : 'year'}
                        </span>
                    </div>
                </Card>
            </div>

            {/* Main Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Net Worth Growth */}
                <Card variants={ITEM_VARIANTS} className="min-h-[400px]">
                    <div className="flex flex-col h-full">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                            <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
                            Net Worth Growth
                        </h3>
                        <div className="flex-1 w-full min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={netWorthHistory}>
                                    <defs>
                                        <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" strokeOpacity={0.5} />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#71717a', fontSize: 12 }}
                                        dy={10}
                                    />
                                    <YAxis hide />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'var(--bg-card)',
                                            borderRadius: '12px',
                                            border: '1px solid var(--border-color)',
                                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                        }}
                                        itemStyle={{ color: 'var(--text-primary)' }}
                                        formatter={(value: any) => [formatCurrency(value, settings.baseCurrency), 'Net Worth']}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="netWorth"
                                        stroke="#3b82f6"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorNetWorth)"
                                        animationDuration={1500}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </Card>

                {/* Monthly Income vs Expense */}
                <Card variants={ITEM_VARIANTS} className="min-h-[400px]">
                    <div className="flex flex-col h-full">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                            <div className="w-1 h-6 bg-emerald-500 rounded-full"></div>
                            Income vs Expense
                        </h3>
                        <div className="flex-1 w-full min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={monthlyStats} barGap={8}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" strokeOpacity={0.5} />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#71717a', fontSize: 12 }}
                                        dy={10}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'var(--bg-card)',
                                            borderRadius: '12px',
                                            border: '1px solid var(--border-color)',
                                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                        }}
                                        itemStyle={{ color: 'var(--text-primary)' }}
                                        formatter={(value: any) => formatCurrency(value, settings.baseCurrency)}
                                        cursor={{ fill: 'transparent' }}
                                    />
                                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                                    <Bar dataKey="Income" fill="#10B981" radius={[4, 4, 0, 0]} barSize={32} animationDuration={1500} />
                                    <Bar dataKey="Expense" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={32} animationDuration={1500} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Allocations Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Asset Allocation */}
                <Card variants={ITEM_VARIANTS} className="min-h-[350px]">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <div className="w-1 h-6 bg-purple-500 rounded-full"></div>
                        Asset Allocation
                    </h3>
                    <div className="h-[250px] flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <RechartsPieChart>
                                <Pie
                                    data={allocationData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={110}
                                    paddingAngle={4}
                                    dataKey="value"
                                    cornerRadius={6}
                                    stroke="none"
                                >
                                    {allocationData.map((_entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value: any) => formatCurrency(value, settings.baseCurrency)}
                                    contentStyle={{
                                        backgroundColor: 'var(--bg-card)',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border-color)'
                                    }}
                                    itemStyle={{ color: 'var(--text-primary)' }}
                                />
                                <Legend layout="vertical" align="right" verticalAlign="middle" iconType="circle" />
                            </RechartsPieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Expense Allocation by Category */}
                <Card variants={ITEM_VARIANTS} className="min-h-[350px]">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <div className="w-1 h-6 bg-orange-500 rounded-full"></div>
                        Expenses by Category
                    </h3>
                    <div className="h-[250px] flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <RechartsPieChart>
                                <Pie
                                    data={categoryAllocationData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={110}
                                    paddingAngle={4}
                                    dataKey="value"
                                    cornerRadius={6}
                                    stroke="none"
                                >
                                    {categoryAllocationData.map((_entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value: any) => formatCurrency(value, settings.baseCurrency)}
                                    contentStyle={{
                                        backgroundColor: 'var(--bg-card)',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border-color)'
                                    }}
                                    itemStyle={{ color: 'var(--text-primary)' }}
                                />
                                <Legend layout="vertical" align="right" verticalAlign="middle" iconType="circle" />
                            </RechartsPieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>
        </motion.div>
    );
};

export default Dashboard;
