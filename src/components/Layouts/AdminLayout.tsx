// src/components/Layouts/AdminLayout.tsx
import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { useThemeStore } from '@/stores/useThemeStore';
import { supabase } from '@/lib/supabase';
import { useStockAlarms } from '@/hooks/useStockAlarms';

import {
  BarChart3, Utensils, Table, Wallet, Package, Settings,
  LayoutDashboard, LogOut, Sun, Moon, Menu, X, Receipt, 
} from 'lucide-react';

export default function AdminLayout() {
  const navigate = useNavigate();
  const { clearAuth } = useAuthStore();
  const { isDark: isDarkMode, toggleTheme } = useThemeStore();

   // 🔔 Alarmas globales — corren mientras estés en el admin
  useStockAlarms();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    clearAuth();
    navigate('/login');
  };

  const menuItems = [
    { path: '/admin/dashboard', icon: BarChart3, label: 'Resumen Financiero' },
    { path: '/admin/productos', icon: Utensils, label: 'Menú y Productos' },
    { path: '/admin/mesas', icon: Table, label: 'Gestión de Mesas' },
    { path: '/admin/gastos', icon: Wallet, label: 'Control de Gastos' },
    { path: '/admin/ventas', icon: Receipt, label: 'Historial de Ventas' },
    { path: '/admin/stock', icon: Package, label: 'Stock y Alertas' },
    { path: '/admin/configuracion', icon: Settings, label: 'Perfil de Negocio' },
    { path: '/pos', icon: LayoutDashboard, label: 'Ir al POS (Caja)' },
  ];

  

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-ink-50 dark:bg-ink-950 transition-colors duration-300">

      {/* NAVBAR MÓVIL */}
      <div className="md:hidden flex items-center justify-between bg-ink-900 dark:bg-ink-950 text-white p-4 sticky top-0 z-40 shadow-md">
        <div className="font-black text-xl tracking-tight">
          Cocin<span className="text-brand-400">App</span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-1 rounded-md hover:bg-ink-800 transition-colors"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* OVERLAY MÓVIL */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside className={`
        fixed md:sticky top-0 left-0 z-50 h-screen w-64 flex flex-col
        bg-ink-900 dark:bg-ink-950 text-ink-300
        transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* LOGO */}
        <div className="hidden md:block p-6 border-b border-ink-800">
          <h1 className="text-2xl font-black text-white tracking-tight">
            Cocin<span className="text-brand-500">App</span>
          </h1>
          <span className="text-xs font-bold uppercase tracking-wider text-ink-500 bg-ink-800 px-2 py-1 rounded-md mt-2 inline-block">
            Panel Admin
          </span>
        </div>

        {/* NAV */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-dark">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 rounded-lg font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-brand-500 text-white shadow-lg shadow-brand-900/20'
                    : 'hover:bg-ink-800 hover:text-white'
                }`
              }
            >
              <item.icon size={20} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* BOTONES INFERIORES */}
        <div className="p-4 border-t border-ink-800 space-y-2 bg-ink-900/50 dark:bg-ink-950/50">
          

          <button
            onClick={toggleTheme}
            className="flex w-full items-center gap-3 px-3 py-3 rounded-lg font-medium text-ink-400 hover:text-white hover:bg-ink-800 transition-all"
          >
            {isDarkMode ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} />}
            {isDarkMode ? 'Modo Claro' : 'Modo Oscuro'}
          </button>

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-3 py-3 rounded-lg font-medium text-red-400 hover:text-red-300 hover:bg-red-950/30 transition-all"
          >
            <LogOut size={20} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* CONTENIDO */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[100vw] md:max-w-none overflow-x-hidden">
        <div className="mx-auto w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}