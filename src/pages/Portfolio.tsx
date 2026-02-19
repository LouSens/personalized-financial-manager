import React, { useState } from 'react';
import { Plus, TrendingUp, TrendingDown, Edit2, Trash2, PieChart } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { PortfolioItem } from '../types';
import { formatCurrency } from '../utils/currency';
import Modal from '../components/ui/Modal';
import PortfolioForm from '../components/PortfolioForm';

const Portfolio: React.FC = () => {
    const { portfolio, removePortfolioItem, settings } = useStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<PortfolioItem | undefined>(undefined);

    const totalCost = portfolio.reduce((acc, item) => acc + item.costBasis, 0);
    const totalValue = portfolio.reduce((acc, item) => acc + (item.quantity * item.currentPrice), 0);
    const totalGainLoss = totalValue - totalCost;
    const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

    const handleDelete = (id: string, symbol: string) => {
        if (window.confirm(`Remove ${symbol} from portfolio?`)) {
            removePortfolioItem(id);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-20 md:pb-0">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Portfolio</h2>
                <button
                    onClick={() => { setEditingItem(undefined); setIsModalOpen(true); }}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                    <Plus size={20} className="mr-2" />
                    Add Holding
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Invested</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {formatCurrency(totalCost, settings.baseCurrency)}
                    </p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Current Value</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {formatCurrency(totalValue, settings.baseCurrency)}
                    </p>
                </div>
                <div className={`p-5 rounded-xl shadow-sm border ${totalGainLoss >= 0
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900/30'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30'
                    }`}>
                    <p className={`text-sm mb-1 ${totalGainLoss >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>Total Gain/Loss</p>
                    <div className="flex items-center space-x-2">
                        <span className={`text-2xl font-bold ${totalGainLoss >= 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                            {totalGainLoss >= 0 ? '+' : ''}{formatCurrency(totalGainLoss, settings.baseCurrency)}
                        </span>
                        <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${totalGainLoss >= 0 ? 'bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200' : 'bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200'
                            }`}>
                            {totalGainLoss >= 0 ? <TrendingUp size={14} className="inline mr-1" /> : <TrendingDown size={14} className="inline mr-1" />}
                            {totalGainLossPercent.toFixed(2)}%
                        </span>
                    </div>
                </div>
            </div>

            {/* Holdings List */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden overflow-x-auto">
                {portfolio.length > 0 ? (
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 text-xs uppercase font-semibold">
                            <tr>
                                <th className="px-6 py-4">Symbol</th>
                                <th className="px-6 py-4 hidden md:table-cell">Price</th>
                                <th className="px-6 py-4">Value</th>
                                <th className="px-6 py-4 hidden md:table-cell">Gain/Loss</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {portfolio.map((item) => {
                                const marketValue = item.quantity * item.currentPrice;
                                const gainLoss = marketValue - item.costBasis;
                                const gainLossPercent = item.costBasis > 0 ? (gainLoss / item.costBasis) * 100 : 0;

                                return (
                                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-900 dark:text-white">{item.symbol}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">{item.name}</div>
                                        </td>
                                        <td className="px-6 py-4 hidden md:table-cell text-gray-600 dark:text-gray-300">
                                            {formatCurrency(item.currentPrice, settings.baseCurrency)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-gray-900 dark:text-white">{formatCurrency(marketValue, settings.baseCurrency)}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">{item.quantity} units</div>
                                        </td>
                                        <td className={`px-6 py-4 hidden md:table-cell font-medium ${gainLoss >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                            {gainLoss >= 0 ? '+' : ''}{formatCurrency(gainLoss, settings.baseCurrency)}
                                            <span className="block text-xs opacity-80">{gainLossPercent.toFixed(2)}%</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end space-x-2">
                                                <button onClick={() => { setEditingItem(item); setIsModalOpen(true); }} className="p-1.5 text-gray-400 hover:text-blue-500 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => handleDelete(item.id, item.symbol)} className="p-1.5 text-gray-400 hover:text-red-500 rounded hover:bg-red-50 dark:hover:bg-red-900/20">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                ) : (
                    <div className="p-12 text-center text-gray-500 dark:text-gray-400 flex flex-col items-center">
                        <PieChart size={48} className="mb-4 opacity-20" />
                        <p>No holdings yet. Start building your portfolio!</p>
                    </div>
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingItem ? 'Edit Holding' : 'Add Holding'}
            >
                <PortfolioForm
                    onClose={() => setIsModalOpen(false)}
                    initialData={editingItem}
                />
            </Modal>
        </div>
    );
};

export default Portfolio;
