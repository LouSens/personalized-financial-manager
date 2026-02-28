import React, { useState, useMemo } from 'react';
import { Plus, Calendar as CalendarIcon, ArrowUpRight, ArrowDownLeft, RefreshCw, Trash2, Edit2, Search } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { Transaction } from '../types';
import { formatCurrency } from '../utils/currency';
import { format, parseISO, eachMonthOfInterval, subMonths } from 'date-fns';
import Modal from '../components/ui/Modal';
import TransactionForm from '../components/TransactionForm';
import Card from '../components/ui/Card';
import { motion, AnimatePresence } from 'framer-motion';

const Transactions: React.FC = () => {
    const transactions = useStore((state) => state.transactions);
    const accounts = useStore((state) => state.accounts);
    const removeTransaction = useStore((state) => state.removeTransaction);
    const settings = useStore((state) => state.settings);
    const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>(undefined);
    const [searchTerm, setSearchTerm] = useState('');

    const months = useMemo(() => {
        const today = new Date();
        const range = eachMonthOfInterval({
            start: subMonths(today, 11),
            end: today,
        });
        return range.map(d => format(d, 'yyyy-MM')).reverse();
    }, []);

    const filteredTransactions = useMemo(() => {
        return transactions
            .filter(t => t.date.startsWith(selectedMonth))
            .filter(t =>
                t.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.note?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.type.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
    }, [transactions, selectedMonth, searchTerm]);

    const stats = useMemo(() => {
        return filteredTransactions.reduce(
            (acc, t) => {
                if (t.type === 'Transfer') return acc;
                const account = accounts.find(a => a.id === t.accountId);
                if (!account) return acc;

                const rate = settings.exchangeRates[account.currency] || 1;
                const baseRate = settings.exchangeRates[settings.baseCurrency] || 1;
                const amountInBase = (t.amount / rate) * baseRate;

                if (t.type === 'Income') acc.income += amountInBase;
                if (t.type === 'Expense') acc.expense += amountInBase;

                return acc;
            },
            { income: 0, expense: 0 }
        );
    }, [filteredTransactions, accounts, settings]);

    const handleDelete = (id: string) => {
        if (window.confirm('Delete this transaction?')) {
            removeTransaction(id);
        }
    };

    const openAddModal = () => {
        setEditingTransaction(undefined);
        setIsModalOpen(true);
    };

    const getAccountName = (id?: string) => accounts.find(a => a.id === id)?.name || 'Unknown';
    const getAccountCurrency = (id: string) => accounts.find(a => a.id === id)?.currency || settings.baseCurrency;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
            className="space-y-6 max-w-5xl mx-auto pb-20 md:pb-0"
        >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Transactions</h2>
                    <div className="flex flex-wrap items-center gap-4 mt-2">
                        <div className="relative">
                            <CalendarIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="pl-9 pr-4 py-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
                            >
                                {months.map(m => (
                                    <option key={m} value={m}>{format(parseISO(m + '-01'), 'MMMM yyyy')}</option>
                                ))}
                            </select>
                        </div>

                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 pr-4 py-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-sm text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-48 placeholder:text-slate-400"
                            />
                        </div>
                    </div>
                </div>
                <button
                    onClick={openAddModal}
                    className="flex items-center px-4 py-2 bg-blue-600 dark:bg-blue-600 text-white rounded-xl hover:bg-blue-700 dark:hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20 active:scale-95 font-medium"
                >
                    <Plus size={20} className="mr-2" />
                    New Transaction
                </button>
            </div>

            {/* Monthly Stats */}
            <div className="grid grid-cols-2 gap-4">
                <Card className="bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30" glow={false}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 mb-1">Total Income</p>
                            <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 tracking-tight">
                                {formatCurrency(stats.income, settings.baseCurrency)}
                            </p>
                        </div>
                        <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-full">
                            <ArrowDownLeft size={24} className="text-emerald-600 dark:text-emerald-400" />
                        </div>
                    </div>
                </Card>
                <Card className="bg-rose-50/50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-900/30" glow={false}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-rose-600 dark:text-rose-400 mb-1">Total Expenses</p>
                            <p className="text-2xl font-bold text-rose-700 dark:text-rose-300 tracking-tight">
                                {formatCurrency(stats.expense, settings.baseCurrency)}
                            </p>
                        </div>
                        <div className="p-3 bg-rose-100 dark:bg-rose-900/30 rounded-full">
                            <ArrowUpRight size={24} className="text-rose-600 dark:text-rose-400" />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Transaction List */}
            <Card className="overflow-hidden" noPadding>
                {filteredTransactions.length > 0 ? (
                    <div className="divide-y divide-slate-100 dark:divide-zinc-800">
                        <AnimatePresence mode="popLayout">
                            {filteredTransactions.map((t) => (
                                <motion.div
                                    key={t.id}
                                    layout
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    transition={{ duration: 0.15 }}
                                    className="p-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors flex items-center justify-between group relative"
                                >
                                    <div className="flex items-center space-x-4 relative z-10">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${t.type === 'Income' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' :
                                            t.type === 'Expense' ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400' :
                                                'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'
                                            }`}>
                                            {t.type === 'Income' && <ArrowDownLeft size={20} />}
                                            {t.type === 'Expense' && <ArrowUpRight size={20} />}
                                            {t.type === 'Transfer' && <RefreshCw size={20} />}
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-slate-900 dark:text-white text-base">{t.category || t.type}</h4>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                                                    {format(parseISO(t.date), 'dd MMM')}
                                                </p>
                                                <span className="text-xs text-slate-400 dark:text-zinc-600">•</span>
                                                <p className="text-xs text-slate-500 dark:text-zinc-500">
                                                    {getAccountName(t.accountId)}
                                                    {t.type === 'Transfer' && ` → ${getAccountName(t.toAccountId)}`}
                                                </p>
                                            </div>
                                            {t.note && <p className="text-xs text-slate-400 dark:text-zinc-500 italic mt-1">{t.note}</p>}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6 relative z-10">
                                        <span className={`font-bold text-lg tabular-nums tracking-tight ${t.type === 'Income' ? 'text-emerald-600 dark:text-emerald-400' :
                                            t.type === 'Expense' ? 'text-rose-600 dark:text-rose-400' :
                                                'text-slate-900 dark:text-white'
                                            }`}>
                                            {t.type === 'Expense' ? '-' : '+'}{formatCurrency(t.amount, getAccountCurrency(t.accountId))}
                                        </span>

                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                            <button onClick={() => { setEditingTransaction(t); setIsModalOpen(true); }} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(t.id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                ) : (
                    <div className="p-12 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                            <Search size={24} className="opacity-50" />
                        </div>
                        <p className="text-lg font-medium text-slate-900 dark:text-white mb-1">No transactions found</p>
                        <p className="text-sm opacity-70">Try adjusting your filters or add a new transaction.</p>
                    </div>
                )}
            </Card>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
            >
                <TransactionForm
                    onClose={() => setIsModalOpen(false)}
                    initialData={editingTransaction}
                    defaultDate={selectedMonth + '-01'}
                />
            </Modal>
        </motion.div>
    );
};

export default Transactions;
