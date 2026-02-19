import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Settings from './pages/Settings';

// Placeholders for other pages
const Dashboard = () => <div className="p-4"><h2 className="text-2xl font-bold">Dashboard</h2><p>Coming soon...</p></div>;
const Accounts = () => <div className="p-4"><h2 className="text-2xl font-bold">Accounts</h2><p>Coming soon...</p></div>;
const Transactions = () => <div className="p-4"><h2 className="text-2xl font-bold">Transactions</h2><p>Coming soon...</p></div>;
const Portfolio = () => <div className="p-4"><h2 className="text-2xl font-bold">Portfolio</h2><p>Coming soon...</p></div>;

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="accounts" element={<Accounts />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="portfolio" element={<Portfolio />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
