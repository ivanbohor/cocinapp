// src/components/Layouts/ProtectedRoute.tsx
import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/useAuthStore';
import { Loader2 } from 'lucide-react';

// Mapa de redirección por defecto según el rol del usuario
const ROLE_FALLBACK: Record<string, string> = {
  pos: '/pos',
  admin: '/admin/dashboard',
};

interface ProtectedRouteProps {
  /** Si se omite, cualquier usuario autenticado puede acceder. */
  allowedRoles?: string[];
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user, rol, setAuth, clearAuth } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      // 1. Verificamos si existe una sesión activa almacenada por Supabase en el navegador
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;

      if (!session) {
        clearAuth();
        setIsChecking(false);
        return;
      }

      // 2. Si hay sesión en Supabase pero React la olvidó (Ej: el usuario apretó F5),
      // la recuperamos de la tabla 'usuarios'
      if (!user) {
        const { data: userData, error: userError } = await supabase
          .from('usuarios')
          .select('restaurante_id, rol')
          .eq('id', session.user.id)
          .single();

        if (userError) throw userError;

        // Guardamos los datos en la memoria global de la app
        setAuth(session.user, userData.restaurante_id, userData.rol);
      }
    } catch (error) {
      // Solo emitimos trazas en desarrollo para no exponer info en producción
      if (import.meta.env.DEV) {
        console.error('[ProtectedRoute] Error de sesión:', error);
      }
      clearAuth(); // Si algo falla, por seguridad borramos la memoria
    } finally {
      // Terminamos de cargar, pase lo que pase
      setIsChecking(false);
    }
  };

  // Pantalla de carga mientras verificamos la identidad
  if (isChecking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mb-4" />
        <p className="text-slate-500 dark:text-slate-400 font-medium">Verificando credenciales...</p>
      </div>
    );
  }

  // Si después del chequeo no hay usuario validado, lo redirigimos al Login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // --- RBAC: Control de acceso basado en rol ---
  // Si la ruta define roles permitidos y el rol del usuario no está entre ellos,
  // redirigimos al destino correcto para su rol (no al login — ya está autenticado).
  if (allowedRoles && allowedRoles.length > 0 && rol) {
    const isAllowed = allowedRoles.includes(rol);
    if (!isAllowed) {
      const fallback = ROLE_FALLBACK[rol] ?? '/login';
      return <Navigate to={fallback} replace />;
    }
  }

  // Si todo está en orden, renderizamos las rutas hijas
  return <Outlet />;
}