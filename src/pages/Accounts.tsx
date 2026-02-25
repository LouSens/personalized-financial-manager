import React, { useState } from 'react';
import { Plus, Wallet, Trash2, Edit2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { Account } from '../types';
import { formatCurrency, convertCurrency } from '../utils/currency';
import Modal from '../components/ui/Modal';
import AccountForm from '../components/AccountForm';
import Card from '../components/ui/Card';
import { motion, type Variants } from 'framer-motion';

const Accounts: React.FC = () => {
    const accounts = useStore((state) => state.accounts);
    const transactions = useStore((state) => state.transactions);
    const removeAccount = useStore((state) => state.removeAccount);
    const settings = useStore((state) => state.settings);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<Account | undefined>(undefined);

    const getAccountBalance = (account: Account) => {
        const accountTransactions = transactions.filter(
            (t) => t.accountId === account.id || t.toAccountId === account.id
        );

        const totalTransactionAmount = accountTransactions.reduce((acc, t) => {
            let amount = 0;
            if (t.type === 'Income' && t.accountId === account.id) {
                amount = t.amount;
            } else if (t.type === 'Expense' && t.accountId === account.id) {
                amount = -t.amount;
            } else if (t.type === 'Transfer') {
                if (t.accountId === account.id) {
                    amount = -t.amount; // Outgoing is always based on source amount
                } else if (t.toAccountId === account.id) {
                    // Incoming: Use toAmount if available (cross-currency), otherwise source amount
                    amount = t.toAmount !== undefined ? t.toAmount : t.amount;
                }
            }
            return acc + amount;
        }, 0);

        return account.initialBalance + totalTransactionAmount;
    };

    const totalNetWorth = accounts.reduce((acc, account) => {
        const balance = getAccountBalance(account);
        return acc + convertCurrency(balance, account.currency, settings.baseCurrency, settings.exchangeRates);
    }, 0);

    const openAddModal = () => {
        setEditingAccount(undefined);
        setIsModalOpen(true);
    };

    const openEditModal = (account: Account) => {
        setEditingAccount(account);
        setIsModalOpen(true);
    };

    const handleDelete = (id: string, name: string) => {
        if (window.confirm(`Are you sure you want to delete "${name}"? All associated transactions will be removed.`)) {
            removeAccount(id);
        }
    };

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
            initial="hidden"
            animate="visible"
            variants={CONTAINER_VARIANTS}
            className="space-y-6 max-w-6xl mx-auto pb-20 md:pb-0"
        >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Accounts</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                        Total Net Worth: <span className="font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded">{formatCurrency(totalNetWorth, settings.baseCurrency)}</span>
                    </p>
                </div>
                <button
                    onClick={openAddModal}
                    className="flex items-center px-4 py-2 bg-blue-600 dark:bg-blue-600 text-white rounded-xl hover:bg-blue-700 dark:hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20 active:scale-95 font-medium"
                >
                    <Plus size={20} className="mr-2" />
                    Add Account
                </button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {accounts.map((account) => {
                    const currentBalance = getAccountBalance(account);
                    return (
                        <motion.div key={account.id} variants={ITEM_VARIANTS}>
                            <Card className="h-full hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); openEditModal(account); }}
                                        className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDelete(account.id, account.name); }}
                                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                <div className="flex items-start justify-between mb-6">
                                    <div
                                        className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg"
                                        style={{ backgroundColor: account.color, boxShadow: `0 8px 16px -4px ${account.color}60` }}
                                    >
                                        <Wallet size={28} />
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">{account.type}</p>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate mb-1">{account.name}</h3>
                                    <p className={`text-2xl font-bold tracking-tight ${currentBalance < 0 ? 'text-rose-500' : 'text-slate-900 dark:text-white'}`}>
                                        {formatCurrency(currentBalance, account.currency)}
                                    </p>
                                    {account.currency !== settings.baseCurrency && (
                                        <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1 font-medium">
                                            ≈ {formatCurrency(convertCurrency(currentBalance, account.currency, settings.baseCurrency, settings.exchangeRates), settings.baseCurrency)}
                                        </p>
                                    )}
                                </div>
                            </Card>
                        </motion.div>
                    );
                })}

                {accounts.length === 0 && (
                    <motion.div variants={ITEM_VARIANTS} className="col-span-full">
                        <div className="py-16 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl bg-slate-50/50 dark:bg-zinc-900/20">
                            <div className="w-16 h-16 bg-slate-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                                <Wallet size={32} className="opacity-50" />
                            </div>
                            <p className="font-medium text-slate-600 dark:text-slate-300">No accounts found</p>
                            <p className="text-sm">Add your first account to get started.</p>
                        </div>
                    </motion.div>
                )}

                {/* Add New Account Card (Optional, nice UX) */}
                <motion.button
                    variants={ITEM_VARIANTS}
                    onClick={openAddModal}
                    className="group flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-slate-200 dark:border-zinc-800 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all h-full min-h-[200px]"
                >
                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <Plus size={24} />
                    </div>
                    <p className="font-semibold text-slate-600 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">Add New Account</p>
                </motion.button>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingAccount ? 'Edit Account' : 'Add New Account'}
            >
                <AccountForm
                    onClose={() => setIsModalOpen(false)}
                    initialData={editingAccount}
                />
            </Modal>
        </motion.div>
    );
};

export default Accounts;
