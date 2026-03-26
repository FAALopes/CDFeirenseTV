import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  PlusCircle,
  Settings,
  Users,
  Monitor,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/slides/new', icon: PlusCircle, label: 'Novo Slide' },
  { to: '/settings', icon: Settings, label: 'Definições', adminOnly: true },
  { to: '/users', icon: Users, label: 'Utilizadores', adminOnly: true },
];

const pageTitles: Record<string, string> = {
  '/': 'Painel de Controlo',
  '/slides/new': 'Novo Slide',
  '/settings': 'Definições',
  '/users': 'Utilizadores',
};

export default function Layout() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const isAdmin = user?.role === 'admin';

  const getPageTitle = () => {
    if (location.pathname.match(/^\/slides\/\d+$/)) return 'Editar Slide';
    return pageTitles[location.pathname] || 'CDF TV Manager';
  };

  const filteredNav = navItems.filter((item) => !item.adminOnly || isAdmin);

  return (
    <div className="flex h-screen bg-cdf-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-cdf-900 text-white transform transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } flex flex-col`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-cdf-800">
          <div className="w-10 h-10 rounded-full bg-cdf-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">CDF</span>
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">CDF TV</h1>
            <p className="text-cdf-300 text-xs">Manager</p>
          </div>
          <button
            className="lg:hidden ml-auto p-1 hover:bg-cdf-800 rounded"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {filteredNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-cdf-700 text-white'
                    : 'text-cdf-200 hover:bg-cdf-800 hover:text-white'
                }`
              }
            >
              <item.icon size={20} />
              {item.label}
            </NavLink>
          ))}

          {/* TV Preview - external link */}
          <a
            href="/tv"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-cdf-200 hover:bg-cdf-800 hover:text-white transition-colors"
          >
            <Monitor size={20} />
            TV Preview
          </a>
        </nav>

        {/* User info & logout at bottom */}
        <div className="px-4 py-4 border-t border-cdf-800 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-cdf-700 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-white">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-cdf-400 truncate">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-300 hover:bg-red-900/30 hover:text-red-200 transition-colors"
          >
            <LogOut size={20} />
            Sair
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} className="text-gray-600" />
            </button>
            <h2 className="text-lg font-semibold text-gray-800">{getPageTitle()}</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 hidden sm:inline">{user?.name}</span>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
