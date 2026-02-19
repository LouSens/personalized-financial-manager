import React, { useState } from 'react';
import { Plus, Wallet, Trash2, Edit2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { Account } from '../types';
import { formatCurrency, convertCurrency } from '../utils/currency';
import Modal from '../components/ui/Modal';
import AccountForm from '../components/AccountForm';

const Accounts: React.FC = () => {
    const { accounts, transactions, removeAccount, settings } = useStore();
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
                    amount = -t.amount; // Outgoing
                } else if (t.toAccountId === account.id) {
                    // Incoming transfer
                    // We need to handle currency conversion if cross-currency transfer?
                    // For simplicity, let's assume transfers are 1:1 value if same currency, 
                    // or we rely on the amount stored (which is usually in source currency).
                    // If we want to support cross-currency, we need exchange rate at time of transaction.
                    // For now, let's assume simple transfers or same currency.
                    // If currencies differ, we might need a 'receivedAmount' in Transaction.
                    // Simplification: convert using current rates for now if needed, or just assume 1:1.
                    amount = t.amount;
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

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-20 md:pb-0">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Accounts</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Total Net Worth: <span className="font-semibold text-blue-600 dark:text-blue-400">{formatCurrency(totalNetWorth, settings.baseCurrency)}</span>
                    </p>
                </div>
                <button
                    onClick={openAddModal}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                    <Plus size={20} className="mr-2" />
                    Add Account
                </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {accounts.map((account) => {
                    const currentBalance = getAccountBalance(account);
                    return (
                        <div
                            key={account.id}
                            className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 relative group transition-all hover:shadow-md"
                        >
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-2">
                                <button
                                    onClick={() => openEditModal(account)}
                                    className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(account.id, account.name)}
                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            <div className="flex items-center space-x-4 mb-4">
                                <div
                                    className="w-12 h-12 rounded-full flex items-center justify-center text-white shadow-sm"
                                    style={{ backgroundColor: account.color }}
                                >
                                    <Wallet size={24} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white truncate max-w-[120px]">{account.name}</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{account.type}</p>
                                </div>
                            </div>

                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Current Balance</p>
                                <p className={`text-xl font-bold ${currentBalance < 0 ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
                                    {formatCurrency(currentBalance, account.currency)}
                                </p>
                                {account.currency !== settings.baseCurrency && (
                                    <p className="text-xs text-gray-400 mt-1">
                                        ≈ {formatCurrency(convertCurrency(currentBalance, account.currency, settings.baseCurrency, settings.exchangeRates), settings.baseCurrency)}
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}

                {accounts.length === 0 && (
                    <div className="col-span-full py-12 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                        <Wallet size={48} className="mb-4 opacity-20" />
                        <p>No accounts yet. Add one to get started!</p>
                    </div>
                )}
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
        </div>
    );
};

export default Accounts;
