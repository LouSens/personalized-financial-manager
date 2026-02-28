import React, { useState } from 'react';
import { Plus, TrendingUp, TrendingDown, Edit2, Trash2, PieChart } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { PortfolioItem } from '../types';
import { formatCurrency, convertCurrency } from '../utils/currency';
import Modal from '../components/ui/Modal';
import PortfolioForm from '../components/PortfolioForm';
import Card from '../components/ui/Card';
import { motion, type Variants } from 'framer-motion';

const Portfolio: React.FC = () => {
    const { portfolio, removePortfolioItem, settings } = useStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<PortfolioItem | undefined>(undefined);

    const totalCost = portfolio.reduce((acc, item) => {
        return acc + convertCurrency(item.costBasis, item.currency || settings.baseCurrency, settings.baseCurrency, settings.exchangeRates);
    }, 0);

    const totalValue = portfolio.reduce((acc, item) => {
        const itemMarketValue = item.quantity * item.currentPrice;
        return acc + convertCurrency(itemMarketValue, item.currency || settings.baseCurrency, settings.baseCurrency, settings.exchangeRates);
    }, 0);

    const totalGainLoss = totalValue - totalCost;
    const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

    const handleDelete = (id: string, symbol: string) => {
        if (window.confirm(`Remove ${symbol} from portfolio?`)) {
            removePortfolioItem(id);
        }
    };

    const CONTAINER_VARIANTS: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.03 }
        }
    };

    const ITEM_VARIANTS: Variants = {
        hidden: { opacity: 0, y: 8 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.2 } }
    };

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={CONTAINER_VARIANTS}
            className="space-y-6 max-w-6xl mx-auto pb-20 md:pb-0"
        >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Portfolio</h2>
                <button
                    onClick={() => { setEditingItem(undefined); setIsModalOpen(true); }}
                    className="flex items-center px-4 py-2 bg-blue-600 dark:bg-blue-600 text-white rounded-xl hover:bg-blue-700 dark:hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20 active:scale-95 font-medium"
                >
                    <Plus size={20} className="mr-2" />
                    Add Holding
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card variants={ITEM_VARIANTS}>
                    <p className="text-sm font-medium text-slate-500 dark:text-zinc-500 mb-2">Total Invested</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                        {formatCurrency(totalCost, settings.baseCurrency)}
                    </p>
                </Card>
                <Card variants={ITEM_VARIANTS}>
                    <p className="text-sm font-medium text-slate-500 dark:text-zinc-500 mb-2">Current Value</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                        {formatCurrency(totalValue, settings.baseCurrency)}
                    </p>
                </Card>
                <Card
                    variants={ITEM_VARIANTS}
                    className={`${totalGainLoss >= 0 ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30' : 'bg-rose-50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-900/30'}`}
                    glow={false}
                >
                    <p className={`text-sm font-medium mb-2 ${totalGainLoss >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>Total Gain/Loss</p>
                    <div className="flex items-baseline gap-3">
                        <span className={`text-3xl font-bold tracking-tight ${totalGainLoss >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>
                            {totalGainLoss >= 0 ? '+' : ''}{formatCurrency(totalGainLoss, settings.baseCurrency)}
                        </span>
                        <span className={`text-sm font-bold px-2 py-0.5 rounded-full flex items-center ${totalGainLoss >= 0 ? 'bg-emerald-200/50 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300' : 'bg-rose-200/50 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300'
                            }`}>
                            {totalGainLoss >= 0 ? <TrendingUp size={14} className="mr-1" /> : <TrendingDown size={14} className="mr-1" />}
                            {totalGainLossPercent.toFixed(2)}%
                        </span>
                    </div>
                </Card>
            </div>

            {/* Holdings List */}
            <Card className="overflow-hidden" noPadding>
                {portfolio.length > 0 ? (
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 dark:bg-zinc-900/50 text-slate-500 dark:text-zinc-500 text-xs uppercase font-semibold tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Symbol</th>
                                <th className="px-6 py-4 hidden sm:table-cell">Price</th>
                                <th className="px-6 py-4">Value</th>
                                <th className="px-6 py-4 hidden sm:table-cell">Gain/Loss</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                            {portfolio.map((item) => {
                                const marketValue = item.quantity * item.currentPrice;
                                const gainLoss = marketValue - item.costBasis;
                                const gainLossPercent = item.costBasis > 0 ? (gainLoss / item.costBasis) * 100 : 0;

                                return (
                                    <tr key={item.id} className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-xs">
                                                    {item.symbol.substring(0, 2)}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900 dark:text-white">{item.symbol}</div>
                                                    <div className="text-xs text-slate-500 dark:text-zinc-500">{item.name}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 hidden sm:table-cell">
                                            <div className="text-slate-700 dark:text-zinc-300 font-medium">
                                                {formatCurrency(item.currentPrice, item.currency || settings.baseCurrency)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-900 dark:text-white tabular-nums">{formatCurrency(marketValue, item.currency || settings.baseCurrency)}</div>
                                            <div className="text-xs text-slate-500 dark:text-zinc-500">{item.quantity} units</div>
                                        </td>
                                        <td className="px-6 py-4 hidden sm:table-cell">
                                            <div className={`font-medium tabular-nums ${gainLoss >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                                {gainLoss >= 0 ? '+' : ''}{formatCurrency(gainLoss, item.currency || settings.baseCurrency)}
                                            </div>
                                            <span className={`text-xs font-medium ${gainLoss >= 0 ? 'text-emerald-600/70 dark:text-emerald-400/70' : 'text-rose-600/70 dark:text-rose-400/70'}`}>
                                                {gainLossPercent.toFixed(2)}%
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => { setEditingItem(item); setIsModalOpen(true); }} className="p-2 text-slate-400 hover:text-blue-500 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => handleDelete(item.id, item.symbol)} className="p-2 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors">
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
                    <div className="p-16 text-center flex flex-col items-center justify-center">
                        <div className="w-20 h-20 bg-slate-50 dark:bg-zinc-800/50 rounded-full flex items-center justify-center mb-6">
                            <PieChart size={40} className="text-slate-300 dark:text-zinc-600" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">No holdings yet</h3>
                        <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">Start building your portfolio by adding your first stock, crypto, or asset holding.</p>
                        <button
                            onClick={() => { setEditingItem(undefined); setIsModalOpen(true); }}
                            className="mt-6 text-blue-600 dark:text-blue-400 font-medium hover:underline"
                        >
                            Add your first holding
                        </button>
                    </div>
                )}
            </Card>

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
        </motion.div>
    );
};

export default Portfolio;
