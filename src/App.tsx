// src/App.tsx
import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useThemeStore } from '@/stores/useThemeStore';
import { Toaster } from '@/components/ui/toast';
import { ConfirmDialogHost } from '@/components/ui/confirm-dialog';
import ProtectedRoute from '@/components/Layouts/ProtectedRoute';

// ─── Carga diferida (lazy chunks) ─────────────────────────────────────────────
// Cada import() genera un chunk JS independiente que solo se descarga
// cuando el usuario navega a esa ruta por primera vez.
const Login          = lazy(() => import('@/pages/Login'));
const PublicMenu     = lazy(() => import('@/pages/PublicMenu'));
const AdminLayout    = lazy(() => import('@/components/Layouts/AdminLayout'));
const PosDashboard   = lazy(() => import('@/pages/PosDashboard'));
const AdminDashboard = lazy(() => import('@/pages/AdminDashboard'));
const AdminProducts  = lazy(() => import('@/pages/AdminProducts'));
const AdminMesas     = lazy(() => import('@/pages/AdminMesas'));
const AdminGastos    = lazy(() => import('@/pages/AdminGastos'));
const AdminStock     = lazy(() => import('@/pages/AdminStock'));
const AdminVentas    = lazy(() => import('@/pages/AdminVentas'));
const AdminRestaurant = lazy(() => import('@/pages/AdminRestaurant'));

// ─── Fallback de carga de página ──────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
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
      {/* Suspense global: cubre cualquier chunk lazy que aún no haya cargado */}
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Raíz */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />

          {/* Ruta pública del Menú Digital — fuera del candado de seguridad */}
          <Route path="/m/:slug" element={<PublicMenu />} />

          {/* Rutas privadas — solo admins */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard"    element={<AdminDashboard />} />
              <Route path="productos"    element={<AdminProducts />} />
              <Route path="mesas"        element={<AdminMesas />} />
              <Route path="gastos"       element={<AdminGastos />} />
              <Route path="stock"        element={<AdminStock />} />
              <Route path="ventas"       element={<AdminVentas />} />
              <Route path="configuracion" element={<AdminRestaurant />} />
            </Route>
          </Route>

          {/* Rutas privadas — admin y cajero POS */}
          <Route element={<ProtectedRoute allowedRoles={['admin', 'pos']} />}>
            <Route path="/pos" element={<PosDashboard />} />
          </Route>
        </Routes>
      </Suspense>

      {/* Sistemas globales de UI — siempre montados, fuera del Suspense */}
      <Toaster />
      <ConfirmDialogHost />
    </BrowserRouter>
  );
}