import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useStore } from '../store/useStore';
import type { Transaction } from '../types';

interface TransactionFormProps {
    onClose: () => void;
    initialData?: Transaction;
    defaultDate?: string;
}

const CATEGORIES = [
    'Food & Dining',
    'Shopping',
    'Housing',
    'Transportation',
    'Utilities',
    'Healthcare',
    'Entertainment',
    'Salary',
    'Investment',
    'Other',
];

const TransactionForm: React.FC<TransactionFormProps> = ({ onClose, initialData, defaultDate }) => {
    const { addTransaction, updateTransaction, accounts } = useStore();
    const [formData, setFormData] = useState<Omit<Transaction, 'id'>>({
        date: defaultDate || new Date().toISOString().split('T')[0],
        amount: 0,
        type: 'Expense',
        category: 'Food & Dining',
        accountId: accounts[0]?.id || '',
        toAccountId: '',
        note: '',
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                date: initialData.date,
                amount: initialData.amount,
                type: initialData.type,
                category: initialData.category,
                accountId: initialData.accountId,
                toAccountId: initialData.toAccountId || '',
                note: initialData.note || '',
            });
        }
    }, [initialData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (initialData) {
            updateTransaction(initialData.id, formData);
        } else {
            addTransaction({
                id: uuidv4(),
                ...formData,
            });
        }
        onClose();
    };

    if (accounts.length === 0) {
        return (
            <div className="text-center p-4">
                <p className="text-gray-500 mb-4">You need at least one account to create a transaction.</p>
                <button onClick={onClose} className="text-blue-600 hover:underline">Close</button>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Type Selection */}
            <div className="flex space-x-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
                {(['Expense', 'Income', 'Transfer'] as const).map((type) => (
                    <button
                        key={type}
                        type="button"
                        onClick={() => setFormData({ ...formData, type })}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${formData.type === type
                            ? 'bg-white text-blue-600 shadow-sm dark:bg-gray-600 dark:text-blue-400'
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                    >
                        {type}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Date
                    </label>
                    <input
                        type="date"
                        required
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Amount
                    </label>
                    <input
                        type="number"
                        step="0.01"
                        required
                        min="0.01"
                        value={formData.amount || ''}
                        onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="0.00"
                    />
                </div>
            </div>

            {formData.type === 'Transfer' ? (
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            From Account
                        </label>
                        <select
                            value={formData.accountId}
                            onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                            {accounts.map((acc) => (
                                <option key={acc.id} value={acc.id}>
                                    {acc.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            To Account
                        </label>
                        <select
                            value={formData.toAccountId}
                            onChange={(e) => setFormData({ ...formData, toAccountId: e.target.value })}
                            required={formData.type === 'Transfer'}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                            <option value="" disabled>Select Account</option>
                            {accounts
                                .filter((acc) => acc.id !== formData.accountId)
                                .map((acc) => (
                                    <option key={acc.id} value={acc.id}>
                                        {acc.name}
                                    </option>
                                ))}
                        </select>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Account
                        </label>
                        <select
                            value={formData.accountId}
                            onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                            {accounts.map((acc) => (
                                <option key={acc.id} value={acc.id}>
                                    {acc.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Category
                        </label>
                        <input
                            list="categories"
                            type="text"
                            required
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            placeholder="Select or type..."
                        />
                        <datalist id="categories">
                            {CATEGORIES.map((cat) => (
                                <option key={cat} value={cat} />
                            ))}
                        </datalist>
                    </div>
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Note (Optional)
                </label>
                <textarea
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    rows={2}
                />
            </div>

            <div className="pt-4 flex space-x-3">
                <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800"
                >
                    {initialData ? 'Update Transaction' : 'Add Transaction'}
                </button>
            </div>
        </form>
    );
};

export default TransactionForm;
