import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, Wallet, ArrowRightLeft, PieChart, Settings, Sun, Moon } from 'lucide-react';
import { useStore } from '../store/useStore';

const Layout: React.FC = () => {
    const { settings, updateSettings } = useStore();

    // Apply theme class to html element
    React.useEffect(() => {
        const root = window.document.documentElement;
        if (settings.theme === 'dark') {
            root.classList.add('dark');
        } else if (settings.theme === 'light') {
            root.classList.remove('dark');
        } else {
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                root.classList.add('dark');
            } else {
                root.classList.remove('dark');
            }
        }
    }, [settings.theme]);

    const toggleTheme = () => {
        const nextTheme = settings.theme === 'light' ? 'dark' : 'light';
        updateSettings({ theme: nextTheme });
    };

    const navItems = [
        { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/accounts', icon: Wallet, label: 'Accounts' },
        { to: '/transactions', icon: ArrowRightLeft, label: 'Transactions' },
        { to: '/portfolio', icon: PieChart, label: 'Portfolio' },
        { to: '/settings', icon: Settings, label: 'Settings' },
    ];

    const ThemeToggleIcon = settings.theme === 'dark' ? Sun : Moon;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col md:flex-row transition-colors duration-200">
            {/* Mobile Header (Top Bar) */}
            <div className="md:hidden bg-white dark:bg-gray-800 p-4 flex justify-between items-center shadow-sm z-50 sticky top-0">
                <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">Apex Finance</h1>
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    aria-label="Toggle Theme"
                >
                    <ThemeToggleIcon size={20} />
                </button>
            </div>

            {/* Desktop Sidebar */}
            <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 fixed inset-y-0 left-0 z-40">
                <div className="p-6">
                    <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">Apex Finance</h1>
                </div>
                <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) =>
                                `flex items-center space-x-3 p-3 rounded-lg transition-colors ${isActive
                                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`
                            }
                        >
                            <item.icon size={20} />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>
                <div className="p-4 border-t border-gray-100 dark:border-gray-700">
                    <button
                        onClick={toggleTheme}
                        className="flex items-center space-x-3 p-3 w-full rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    >
                        <ThemeToggleIcon size={20} />
                        <span>{settings.theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-8 md:ml-64 pb-24 md:pb-8 overflow-x-hidden">
                <Outlet />
            </main>

            {/* Mobile Bottom Navigation */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex justify-around p-2 z-50 pb-safe">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                            `flex flex-col items-center p-2 rounded-lg transition-colors ${isActive
                                ? 'text-blue-600 dark:text-blue-400'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                            }`
                        }
                    >
                        <item.icon size={24} />
                        <span className="text-[10px] mt-1 font-medium">{item.label}</span>
                    </NavLink>
                ))}
            </div>
        </div>
    );
};

export default Layout;
