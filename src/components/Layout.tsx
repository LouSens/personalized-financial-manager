import React, { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Wallet, ArrowRightLeft, PieChart, Settings, Sun, Moon, Menu, X } from 'lucide-react';
import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';

const Layout: React.FC = () => {
    const { settings, updateSettings } = useStore();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const location = useLocation();

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
        if (settings.theme === 'system') {
            const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            updateSettings({ theme: isDark ? 'light' : 'dark' });
        } else {
            updateSettings({ theme: settings.theme === 'light' ? 'dark' : 'light' });
        }
    };

    const navItems = [
        { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
        { to: 'accounts', icon: Wallet, label: 'Accounts' },
        { to: 'transactions', icon: ArrowRightLeft, label: 'Transactions' },
        { to: 'portfolio', icon: PieChart, label: 'Portfolio' },
        { to: 'settings', icon: Settings, label: 'Settings' },
    ];

    const isEffectiveDark = settings.theme === 'dark' ||
        (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    const ThemeToggleIcon = isEffectiveDark ? Sun : Moon;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-slate-100 flex flex-col md:flex-row transition-colors duration-500 font-sans selection:bg-cyan-500/30">
            {/* Mobile Header */}
            <header className="md:hidden flex justify-between items-center p-4 sticky top-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-slate-200 dark:border-zinc-800">
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">Apex</h1>
                <div className="flex items-center gap-2">
                    <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors">
                        <ThemeToggleIcon size={20} />
                    </button>
                    <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors">
                        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </header>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="md:hidden fixed inset-0 z-40 bg-white dark:bg-black pt-20 px-4"
                    >
                        <nav className="flex flex-col gap-2">
                            {navItems.map((item) => (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={({ isActive }) => clsx(
                                        "flex items-center gap-4 p-4 rounded-xl text-lg font-medium transition-all duration-200",
                                        isActive
                                            ? "bg-blue-50 dark:bg-zinc-900 text-blue-600 dark:text-cyan-400"
                                            : "text-slate-500 dark:text-zinc-500 active:scale-95"
                                    )}
                                >
                                    <item.icon size={24} />
                                    {item.label}
                                </NavLink>
                            ))}
                        </nav>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Desktop Sidebar */}
            <aside className="hidden md:flex flex-col w-72 h-screen sticky top-0 p-6 border-r border-slate-200 dark:border-zinc-800 bg-white/50 dark:bg-black/50 backdrop-blur-xl">
                <div className="mb-10">
                    <h1 className="text-2xl font-bold tracking-tight">
                        <span className="text-blue-600 dark:text-cyan-400">Apex</span> Finance
                    </h1>
                </div>

                <nav className="flex-1 space-y-2">
                    {navItems.map((item) => {
                        const isActive = location.pathname === (item.to === '/' ? '/' : `/${item.to}`);
                        return (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                className={clsx(
                                    "group flex items-center gap-3 p-3.5 rounded-xl transition-all duration-300 relative overflow-hidden",
                                    isActive
                                        ? "text-blue-600 dark:text-white font-medium"
                                        : "text-slate-500 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-zinc-300"
                                )}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="activeNav"
                                        className="absolute inset-0 bg-blue-50 dark:bg-blue-500/10 rounded-xl"
                                        initial={false}
                                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                    />
                                )}
                                <item.icon size={22} className="relative z-10" />
                                <span className="relative z-10">{item.label}</span>
                                {isActive && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-600 dark:bg-cyan-400 rounded-r-full" />
                                )}
                            </NavLink>
                        );
                    })}
                </nav>

                <div className="pt-6 border-t border-slate-200 dark:border-zinc-800">
                    <button
                        onClick={toggleTheme}
                        className="flex items-center gap-3 p-3 w-full rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-900 transition-colors text-slate-500 dark:text-zinc-400"
                    >
                        <ThemeToggleIcon size={20} />
                        <span className="text-sm font-medium">{isEffectiveDark ? 'Light Mode' : 'Dark Mode'}</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 relative overflow-hidden">
                {/* Background ambient glow for dark mode */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[100px] opacity-0 dark:opacity-100 transition-opacity duration-1000" />
                    <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px] opacity-0 dark:opacity-100 transition-opacity duration-1000" />
                </div>

                <div className="relative z-10 p-6 md:p-10 max-w-7xl mx-auto h-full overflow-y-auto no-scrollbar">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;
