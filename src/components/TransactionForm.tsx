import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useStore } from '../store/useStore';
import type { Transaction } from '../types';

interface TransactionFormProps {
    onClose: () => void;
    initialData?: Transaction;
    defaultDate?: string;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ onClose, initialData, defaultDate }) => {
    const { addTransaction, updateTransaction, accounts, settings } = useStore();
    const [formData, setFormData] = useState<Omit<Transaction, 'id'>>({
        date: initialData?.date || defaultDate || new Date().toISOString().split('T')[0],
        amount: initialData?.amount || 0,
        type: initialData?.type || 'Expense',
        category: initialData?.category || settings.categories[0],
        accountId: initialData?.accountId || accounts[0]?.id || '',
        toAccountId: initialData?.toAccountId || '',
        note: initialData?.note || '',
        toAmount: initialData?.toAmount,
    });

    const [isCrossCurrency, setIsCrossCurrency] = useState(false);

    // Update form when initialData changes
    useEffect(() => {
        if (initialData) {
            setFormData({
                date: initialData.date,
                amount: initialData.amount,
                type: initialData.type,
                category: initialData.category,
                accountId: initialData.accountId,
                toAccountId: initialData.toAccountId,
                note: initialData.note,
                toAmount: initialData.toAmount
            });
        }
    }, [initialData]);

    // Detect cross-currency transfer and auto-calculate
    useEffect(() => {
        if (formData.type === 'Transfer' && formData.accountId && formData.toAccountId) {
            const fromAccount = accounts.find(a => a.id === formData.accountId);
            const toAccount = accounts.find(a => a.id === formData.toAccountId);

            if (fromAccount && toAccount && fromAccount.currency !== toAccount.currency) {
                setIsCrossCurrency(true);
                // Auto-calculate estimate if not already set or if user clears it
                // Only calculate if we have an amount
                if (formData.amount > 0) {
                    const fromRate = settings.exchangeRates[fromAccount.currency] || 1;
                    const toRate = settings.exchangeRates[toAccount.currency] || 1;
                    const baseAmount = formData.amount / fromRate;
                    const estimatedToAmount = baseAmount * toRate;

                    // Only update if current toAmount is vastly different (change of accounts) or undefined
                    // To avoid overwriting user manual input, checking if it matches expectation roughly or is undefined.
                    // Simpler approach: If newly switching to cross-currency, set it.
                    // But we are in useEffect, so we need to be careful not to loop.
                    // We'll rely on the user to adjust if needed, but provide the initial estimate.

                    // Check if toAmount is undefined or internal logic to suggestion?
                    // Let's just update if it's currently undefined/null.
                    if (formData.toAmount === undefined || formData.toAmount === 0) {
                        setFormData(prev => ({ ...prev, toAmount: parseFloat(estimatedToAmount.toFixed(2)) }));
                    }
                }
            } else {
                setIsCrossCurrency(false);
                if (formData.toAmount !== undefined) {
                    setFormData(prev => ({ ...prev, toAmount: undefined }));
                }
            }
        } else {
            setIsCrossCurrency(false);
        }
    }, [formData.type, formData.accountId, formData.toAccountId, formData.amount, accounts, settings.exchangeRates]);


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const transactionData = {
            id: initialData?.id || uuidv4(),
            ...formData,
            // Ensure quantities are valid numbers
            amount: formData.amount || 0,
            // Ensure toAmount is set for cross-currency, otherwise undefined
            // Also sanitize to ensure it is a number if present
            toAmount: isCrossCurrency ? (formData.toAmount || 0) : undefined
        };

        if (initialData) {
            updateTransaction(initialData.id, transactionData);
        } else {
            addTransaction(transactionData);
        }
        onClose();
    };

    if (accounts.length === 0) {
        return (
            <div className="text-center p-4">
                <p className="text-slate-500 mb-4">You need at least one account to create a transaction.</p>
                <button onClick={onClose} className="text-blue-600 hover:underline">Close</button>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-4 p-1 bg-slate-100 dark:bg-zinc-800 rounded-lg">
                {(['Expense', 'Income', 'Transfer'] as const).map((type) => (
                    <button
                        key={type}
                        type="button"
                        onClick={() => setFormData({ ...formData, type })}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${formData.type === type
                            ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-white shadow-sm'
                            : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-300'
                            }`}
                    >
                        {type}
                    </button>
                ))}
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Amount
                </label>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
                        {accounts.find(a => a.id === formData.accountId)?.currency || settings.baseCurrency}
                    </span>
                    <input
                        type="number"
                        step="0.01"
                        required
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                        className="w-full pl-12 pr-4 py-2 bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                    />
                </div>
            </div>

            {isCrossCurrency && (
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Converted Amount (Received)
                    </label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
                            {accounts.find(a => a.id === formData.toAccountId)?.currency || ''}
                        </span>
                        <input
                            type="number"
                            step="0.01"
                            required
                            value={formData.toAmount || ''}
                            onChange={(e) => setFormData({ ...formData, toAmount: parseFloat(e.target.value) || 0 })}
                            className="w-full pl-12 pr-4 py-2 bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                        />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                        Exchange rate: 1 {accounts.find(a => a.id === formData.accountId)?.currency} ≈ {
                            ((formData.toAmount || 0) / (formData.amount || 1)).toFixed(4)
                        } {accounts.find(a => a.id === formData.toAccountId)?.currency}
                    </p>
                </div>
            )}

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        {formData.type === 'Income' ? 'To Account' : 'From Account'}
                    </label>
                    <select
                        value={formData.accountId}
                        onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                    >
                        {accounts.map((account) => (
                            <option key={account.id} value={account.id}>
                                {account.name}
                            </option>
                        ))}
                    </select>
                </div>

                {formData.type === 'Transfer' ? (
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            To Account
                        </label>
                        <select
                            value={formData.toAccountId}
                            onChange={(e) => setFormData({ ...formData, toAccountId: e.target.value })}
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                        >
                            <option value="">Select Account</option>
                            {accounts
                                .filter(a => a.id !== formData.accountId)
                                .map((account) => (
                                    <option key={account.id} value={account.id}>
                                        {account.name}
                                    </option>
                                ))
                            }
                        </select>
                    </div>
                ) : (
                    <div>
                        {/* Empty placeholder */}
                    </div>
                )}
            </div>

            {/* Category Selection - Always Visible */}
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Category
                </label>
                <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                >
                    {settings.categories.map((category) => (
                        <option key={category} value={category}>
                            {category}
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Date
                </label>
                <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Note (Optional)
                </label>
                <textarea
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white resize-none h-24"
                    placeholder="Add details..."
                />
            </div>

            <button
                type="submit"
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-xl shadow-lg shadow-blue-500/20 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
                {initialData ? 'Save Changes' : 'Add Transaction'}
            </button>
        </form>
    );
};

export default TransactionForm;
