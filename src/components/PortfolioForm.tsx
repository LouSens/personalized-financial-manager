import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useStore } from '../store/useStore';
import type { PortfolioItem } from '../types';
import { formatCurrency } from '../utils/currency';

interface PortfolioFormProps {
    onClose: () => void;
    initialData?: PortfolioItem;
}

const PortfolioForm: React.FC<PortfolioFormProps> = ({ onClose, initialData }) => {
    const { addPortfolioItem, updatePortfolioItem, settings } = useStore();
    const [formData, setFormData] = useState<Omit<PortfolioItem, 'id'>>({
        symbol: '',
        name: '',
        quantity: 0,
        costBasis: 0,
        currentPrice: 0,
        currency: settings.baseCurrency,
    });

    const [unitCost, setUnitCost] = useState(0);

    useEffect(() => {
        if (initialData) {
            setFormData({
                symbol: initialData.symbol,
                name: initialData.name,
                quantity: initialData.quantity,
                costBasis: initialData.costBasis,
                currentPrice: initialData.currentPrice,
                currency: initialData.currency || settings.baseCurrency,
            });
            setUnitCost(initialData.quantity > 0 ? initialData.costBasis / initialData.quantity : 0);
        }
    }, [initialData, settings.baseCurrency]);

    const handleQuantityChange = (val: number) => {
        setFormData(prev => ({
            ...prev,
            quantity: val,
            costBasis: val * unitCost
        }));
    };

    const handleUnitCostChange = (val: number) => {
        setUnitCost(val);
        setFormData(prev => ({
            ...prev,
            costBasis: prev.quantity * val
        }));
    };


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (initialData) {
            updatePortfolioItem(initialData.id, formData);
        } else {
            addPortfolioItem({
                id: uuidv4(),
                ...formData,
            });
        }
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Symbol/Ticker
                    </label>
                    <input
                        type="text"
                        required
                        value={formData.symbol}
                        onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="e.g. AAPL"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Name
                    </label>
                    <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="e.g. Apple Inc."
                    />
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Quantity
                    </label>
                    <input
                        type="number"
                        step="0.0001"
                        required
                        value={formData.quantity}
                        onChange={(e) => handleQuantityChange(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Average Buy Price
                    </label>
                    <input
                        type="number"
                        step="0.01"
                        required
                        value={unitCost}
                        onChange={(e) => handleUnitCostChange(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="Price paid per unit"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Current Price (Per Unit)
                    </label>
                    <input
                        type="number"
                        step="0.01"
                        required
                        value={formData.currentPrice}
                        onChange={(e) => setFormData({ ...formData, currentPrice: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Currency
                    </label>
                    <select
                        value={formData.currency}
                        onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                        {Object.keys(settings.exchangeRates).map((currency) => (
                            <option key={currency} value={currency}>
                                {currency}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg text-sm text-gray-600 dark:text-gray-400">
                <div className="flex justify-between mb-1">
                    <span>Total Invested:</span>
                    <span>{formatCurrency(formData.costBasis, formData.currency)}</span>
                </div>
                <div className="flex justify-between font-medium">
                    <span>Market Value:</span>
                    <span>{formatCurrency((formData.quantity * formData.currentPrice), formData.currency)}</span>
                </div>
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
                    {initialData ? 'Update Holding' : 'Add Holding'}
                </button>
            </div>
        </form>
    );
};

export default PortfolioForm;
