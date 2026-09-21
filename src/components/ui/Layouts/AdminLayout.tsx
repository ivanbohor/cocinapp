// src/components/Layouts/AdminLayout.tsx
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Utensils, Table, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminLayout() {
  const location = useLocation();

  const menuItems = [
    { path: '/admin/productos', icon: Utensils, label: 'Menú y Productos' },
    { path: '/admin/mesas', icon: Table, label: 'Gestión de Mesas' },
    { path: '/pos', icon: LayoutDashboard, label: 'Ir al POS (Caja)' },
  ];

  return (
    <div className="flex h-screen bg-slate-50">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shadow-sm z-20">
        <div className="p-6 border-b border-slate-100">
          <h1 className="text-2xl font-bold text-slate-900">CocinApp</h1>
          <span className="text-sm text-slate-500 font-medium">Panel Administrativo</span>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname.includes(item.path);
            const Icon = item.icon;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive 
                    ? 'bg-slate-900 text-white font-medium shadow-md' 
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon size={20} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200">
          <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50">
            <LogOut size={20} className="mr-3" />
            Cerrar Sesión
          </Button>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-8 shadow-sm z-10">
          <h2 className="text-xl font-semibold text-slate-800">
            {location.pathname.includes('productos') ? 'Gestión de Catálogo' : 
             location.pathname.includes('mesas') ? 'Gestión de Mesas' : 'Panel de Control'}
          </h2>
        </header>
        
        <div className="flex-1 p-8 overflow-auto">
          <Outlet />
        </div>
      </main>

    </div>
  );
}