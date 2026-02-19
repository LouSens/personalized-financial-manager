import React from 'react';
import { useStore } from '../store/useStore';
import { exportToExcel } from '../utils/export';
import { Trash2, Download, Moon, Sun, Monitor, AlertTriangle } from 'lucide-react';

const Settings: React.FC = () => {
    const { settings, updateSettings, resetData, accounts, transactions, portfolio } = useStore();

    const handleExport = () => {
        exportToExcel({ accounts, transactions, portfolio });
    };

    const handleReset = () => {
        if (window.confirm('Are you sure you want to reset all data? This cannot be undone.')) {
            resetData();
        }
    };

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h2>

            {/* Theme Settings */}
            <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Appearance</h3>
                <div className="flex space-x-4">
                    {(['light', 'dark', 'system'] as const).map((theme) => (
                        <button
                            key={theme}
                            onClick={() => updateSettings({ theme })}
                            className={`flex flex-col items-center p-4 rounded-lg border-2 transition-all ${settings.theme === theme
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-transparent hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                        >
                            {theme === 'light' && <Sun className="w-6 h-6 mb-2" />}
                            {theme === 'dark' && <Moon className="w-6 h-6 mb-2" />}
                            {theme === 'system' && <Monitor className="w-6 h-6 mb-2" />}
                            <span className="capitalize">{theme}</span>
                        </button>
                    ))}
                </div>
            </section>

            {/* Currency Settings */}
            <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Currency Settings</h3>

                <div className="mb-4">
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Base Currency
                    </label>
                    <select
                        value={settings.baseCurrency}
                        onChange={(e) => updateSettings({ baseCurrency: e.target.value })}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                    >
                        {Object.keys(settings.exchangeRates).map((c) => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                </div>

                <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Exchange Rates (vs USD)</h4>
                    {Object.entries(settings.exchangeRates).map(([currency, rate]) => (
                        <div key={currency} className="flex items-center space-x-2">
                            <span className="w-12 font-mono text-sm dark:text-gray-300">{currency}</span>
                            <input
                                type="number"
                                step="0.0001"
                                value={rate}
                                onChange={(e) => {
                                    const newRates = { ...settings.exchangeRates, [currency]: parseFloat(e.target.value) || 0 };
                                    updateSettings({ exchangeRates: newRates });
                                }}
                                disabled={currency === 'USD'} // Assuming USD is base anchor for rates
                                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                            {currency !== 'USD' && (
                                <button
                                    onClick={() => {
                                        const newRates = { ...settings.exchangeRates };
                                        delete newRates[currency];
                                        updateSettings({ exchangeRates: newRates });
                                    }}
                                    className="text-red-500 hover:bg-red-50 p-1 rounded"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    ))}

                    <div className="flex items-center space-x-2 mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                        <input
                            type="text"
                            placeholder="New code (e.g. EUR)"
                            id="new-currency-code"
                            className="w-20 px-2 py-1 text-sm border border-gray-300 rounded uppercase focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            maxLength={3}
                        />
                        <button
                            onClick={() => {
                                const input = document.getElementById('new-currency-code') as HTMLInputElement;
                                const val = input.value.toUpperCase();
                                if (val && !settings.exchangeRates[val]) {
                                    updateSettings({ exchangeRates: { ...settings.exchangeRates, [val]: 1 } });
                                    input.value = '';
                                }
                            }}
                            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            Add
                        </button>
                    </div>
                </div>
            </section>

            {/* Data Management */}
            <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Data Management</h3>

                <div className="space-y-4">
                    <button
                        onClick={handleExport}
                        className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-200 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-700 dark:focus:ring-gray-700"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Export Data to Excel
                    </button>

                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button
                            onClick={handleReset}
                            className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-transparent rounded-lg hover:bg-red-100 focus:ring-4 focus:outline-none focus:ring-red-200 dark:text-red-400 dark:bg-red-900/20 dark:hover:bg-red-900/40"
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Reset All Data
                        </button>
                        <p className="mt-2 text-xs text-center text-gray-500 dark:text-gray-400">
                            <AlertTriangle className="inline w-3 h-3 mr-1" />
                            This action cannot be undone. All accounts, transactions, and portfolio data will be deleted.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Settings;
