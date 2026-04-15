import { Routes, Route, NavLink } from 'react-router-dom';
import { clsx } from 'clsx';
import Dashboard from './pages/Dashboard';
import SettingsPage from './pages/Settings';
import ApiKeysPage from './pages/ApiKeys';

const NAV = [
  { to: '/', label: 'Labels', exact: true },
  { to: '/settings', label: 'Sender Profiles' },
  { to: '/apikeys', label: 'API & Webhooks' },
];

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <span className="text-xl">📦</span>
              <span className="font-bold text-lg tracking-tight">Label Manager</span>
              <span className="text-orange-200 text-xs font-medium hidden sm:block">Post.at · DPD · DHL · UPS</span>
            </div>
          </div>
        </div>
      </header>

      {/* Nav */}
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1">
            {NAV.map(({ to, label, exact }) => (
              <NavLink
                key={to}
                to={to}
                end={exact}
                className={({ isActive }) => clsx(
                  'px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                  isActive
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                )}
              >
                {label}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/apikeys" element={<ApiKeysPage />} />
        </Routes>
      </main>
    </div>
  );
}
