// src/components/Layouts/AdminLayout.tsx
import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { supabase } from '@/lib/supabase';
// Importamos Receipt nuevamente
import { 
  BarChart3, Utensils, Table, Wallet, Package, Settings, 
  LayoutDashboard, LogOut, Sun, Moon, Menu, X, Receipt 
} from 'lucide-react';

export default function AdminLayout() {
  const navigate = useNavigate();
  const { clearAuth } = useAuthStore();
  
  // Estados para Responsive y Tema
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Inicializar el modo oscuro leyendo la preferencia guardada o el sistema
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDarkMode(true);
    }
  };

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
    { path: '/admin/ventas', icon: Receipt, label: 'Historial de Ventas' }, // <-- RESTAURADO
    { path: '/admin/stock', icon: Package, label: 'Stock y Alertas' },
    { path: '/admin/configuracion', icon: Settings, label: 'Perfil de Negocio' },
    { path: '/pos', icon: LayoutDashboard, label: 'Ir al POS (Caja)' },
  ];
  
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      
      {/* NAVBAR MÓVIL (Solo visible en pantallas pequeñas) */}
      <div className="md:hidden flex items-center justify-between bg-slate-900 dark:bg-slate-950 text-white p-4 sticky top-0 z-40 shadow-md">
        <div className="font-black text-xl tracking-tight">
          Cocin<span className="text-indigo-400">App</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-1 rounded-md hover:bg-slate-800 transition-colors">
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* OVERLAY FONDO OSCURO PARA MÓVILES */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* SIDEBAR (Menú Lateral) */}
      <aside className={`
        fixed md:sticky top-0 left-0 z-50 h-screen w-64 flex flex-col bg-slate-900 dark:bg-slate-950 text-slate-300 
        transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* LOGO (Oculto en móvil, visible en Desktop) */}
        <div className="hidden md:block p-6 border-b border-slate-800">
          <h1 className="text-2xl font-black text-white tracking-tight">
            Cocin<span className="text-indigo-500">App</span>
          </h1>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-800 px-2 py-1 rounded-md mt-2 inline-block">Panel Admin</span>
        </div>

        {/* LINKS DE NAVEGACIÓN */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-hide">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileMenuOpen(false)} // Cerrar menú al hacer clic en celular
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 rounded-lg font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' 
                    : 'hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <item.icon size={20} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* BOTONES INFERIORES (Tema y Salir) */}
        <div className="p-4 border-t border-slate-800 space-y-2 bg-slate-900/50 dark:bg-slate-950/50">
          <button 
            onClick={toggleDarkMode}
            className="flex w-full items-center gap-3 px-3 py-3 rounded-lg font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
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

      {/* ÁREA DE CONTENIDO PRINCIPAL */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[100vw] md:max-w-none overflow-x-hidden">
        <div className="mx-auto w-full">
          <Outlet />
        </div>
      </main>

    </div>
  );
}