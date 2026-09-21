// src/App.tsx
import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from '@/pages/Login';
import AdminLayout from '@/components/Layouts/AdminLayout';
import PosDashboard from '@/pages/PosDashboard';
import AdminProducts from '@/pages/AdminProducts';
import AdminDashboard from '@/pages/AdminDashboard';
import ProtectedRoute from '@/components/Layouts/ProtectedRoute';
import { useThemeStore } from '@/stores/useThemeStore';
import AdminRestaurant from '@/pages/AdminRestaurant';
// 1. Importamos la vista del menú público
import PublicMenu from '@/pages/PublicMenu'; 
import AdminMesas from '@/pages/AdminMesas';
import AdminGastos from '@/pages/AdminGastos';
import AdminStock from '@/pages/AdminStock';
import AdminVentas from '@/pages/AdminVentas';

export default function App() {
  const { isDark } = useThemeStore();

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        
        {/* 2. RUTA PÚBLICA DEL MENÚ DIGITAL (Fuera del candado de seguridad) */}
        <Route path="/m/:slug" element={<PublicMenu />} />

        {/* RUTAS PRIVADAS */}
        <Route element={<ProtectedRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} /> 
            <Route path="productos" element={<AdminProducts />} />
            <Route path="mesas" element={<AdminMesas />} />
            <Route path="gastos" element={<AdminGastos />} />
            <Route path="stock" element={<AdminStock />} /> {/* <-- CORRECCIÓN AQUÍ */}
            <Route path="configuracion" element={<AdminRestaurant />} />
            <Route path="ventas" element={<AdminVentas />} />
          </Route>
          <Route path="/pos" element={<PosDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}