import * as XLSX from 'xlsx';
import type { AppState } from '../types';

export const exportToExcel = (data: Pick<AppState, 'accounts' | 'transactions' | 'portfolio'>) => {
    const wb = XLSX.utils.book_new();

    // Accounts Sheet
    const accountsWs = XLSX.utils.json_to_sheet(data.accounts);
    XLSX.utils.book_append_sheet(wb, accountsWs, 'Accounts');

    // Transactions Sheet
    const transactionsWs = XLSX.utils.json_to_sheet(data.transactions);
    XLSX.utils.book_append_sheet(wb, transactionsWs, 'Transactions');

    // Portfolio Sheet
    const portfolioWs = XLSX.utils.json_to_sheet(data.portfolio);
    XLSX.utils.book_append_sheet(wb, portfolioWs, 'Portfolio');

    // Generate date string for filename
    const dateStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `finance_data_${dateStr}.xlsx`);
};
