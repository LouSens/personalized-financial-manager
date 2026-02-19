import React, { useState, useMemo } from 'react';
import { Plus, Calendar as CalendarIcon, ArrowUpRight, ArrowDownLeft, RefreshCw, Trash2, Edit2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { Transaction } from '../types';
import { formatCurrency } from '../utils/currency';
import { format, parseISO, eachMonthOfInterval, subMonths } from 'date-fns';
import Modal from '../components/ui/Modal';
import TransactionForm from '../components/TransactionForm';

const Transactions: React.FC = () => {
    const { transactions, accounts, removeTransaction, settings } = useStore();
    const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>(undefined);

    // Generate list of months for dropdown (last 12 months + future?)
    // Or just existing transaction months + current.
    const months = useMemo(() => {
        const today = new Date();
        const range = eachMonthOfInterval({
            start: subMonths(today, 11),
            end: today, // or future if planned?
        });
        return range.map(d => format(d, 'yyyy-MM')).reverse();
    }, []);

    const filteredTransactions = useMemo(() => {
        return transactions
            .filter(t => t.date.startsWith(selectedMonth))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [transactions, selectedMonth]);

    const stats = useMemo(() => {
        return filteredTransactions.reduce(
            (acc, t) => {
                if (t.type === 'Transfer') return acc;
                const account = accounts.find(a => a.id === t.accountId);
                if (!account) return acc;

                // Simple conversion
                const rate = settings.exchangeRates[account.currency] || 1;
                const baseRate = settings.exchangeRates[settings.baseCurrency] || 1;
                // Amount in USD = Amount / rate
                // Amount in Base = Amount in USD * baseRate
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

    const getAccountName = (id?: string) => accounts.find(a => a.id === id)?.name || 'Unknown';
    const getAccountCurrency = (id: string) => accounts.find(a => a.id === id)?.currency || settings.baseCurrency;

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-20 md:pb-0">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Transactions</h2>
                    <div className="flex items-center space-x-2 mt-1">
                        <CalendarIcon size={16} className="text-gray-500" />
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="bg-transparent border-none focus:ring-0 text-sm font-medium text-gray-600 dark:text-gray-300 cursor-pointer"
                        >
                            {months.map(m => (
                                <option key={m} value={m}>{format(parseISO(m + '-01'), 'MMMM yyyy')}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <button
                    onClick={() => { setEditingTransaction(undefined); setIsModalOpen(true); }}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm w-full md:w-auto justify-center"
                >
                    <Plus size={20} className="mr-2" />
                    Add Transaction
                </button>
            </div>

            {/* Monthly Stats */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-100 dark:border-green-900/30">
                    <p className="text-sm text-green-600 dark:text-green-400 mb-1">Total Income</p>
                    <p className="text-xl font-bold text-green-700 dark:text-green-300">
                        {formatCurrency(stats.income, settings.baseCurrency)}
                    </p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 dark:border-red-900/30">
                    <p className="text-sm text-red-600 dark:text-red-400 mb-1">Total Expenses</p>
                    <p className="text-xl font-bold text-red-700 dark:text-red-300">
                        {formatCurrency(stats.expense, settings.baseCurrency)}
                    </p>
                </div>
            </div>

            {/* Transaction List */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                {filteredTransactions.length > 0 ? (
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {filteredTransactions.map((t) => (
                            <div key={t.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex items-center justify-between group">
                                <div className="flex items-center space-x-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t.type === 'Income' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                                        t.type === 'Expense' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                                            'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                                        }`}>
                                        {t.type === 'Income' && <ArrowDownLeft size={20} />}
                                        {t.type === 'Expense' && <ArrowUpRight size={20} />}
                                        {t.type === 'Transfer' && <RefreshCw size={20} />}
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-gray-900 dark:text-white">{t.category || t.type}</h4>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {format(parseISO(t.date), 'dd MMM')} • {getAccountName(t.accountId)}
                                            {t.type === 'Transfer' && ` → ${getAccountName(t.toAccountId)}`}
                                        </p>
                                        {t.note && <p className="text-xs text-gray-400 italic mt-0.5">{t.note}</p>}
                                    </div>
                                </div>

                                <div className="flex items-center space-x-4">
                                    <span className={`font-bold ${t.type === 'Income' ? 'text-green-600 dark:text-green-400' :
                                        t.type === 'Expense' ? 'text-red-600 dark:text-red-400' :
                                            'text-gray-900 dark:text-white'
                                        }`}>
                                        {t.type === 'Expense' ? '-' : '+'}{formatCurrency(t.amount, getAccountCurrency(t.accountId))}
                                    </span>

                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                                        <button onClick={() => { setEditingTransaction(t); setIsModalOpen(true); }} className="p-1 text-gray-400 hover:text-blue-500">
                                            <Edit2 size={16} />
                                        </button>
                                        <button onClick={() => handleDelete(t.id)} className="p-1 text-gray-400 hover:text-red-500">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                        No transactions found for this month.
                    </div>
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
            >
                <TransactionForm
                    onClose={() => setIsModalOpen(false)}
                    initialData={editingTransaction}
                    defaultDate={selectedMonth + '-01'} // approximate default
                />
            </Modal>
        </div>
    );
};

export default Transactions;
