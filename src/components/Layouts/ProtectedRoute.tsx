// src/components/ProtectedRoute.tsx
import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/useAuthStore';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute() {
  const { user, setAuth, clearAuth } = useAuthStore();
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
      // la recuperamos de la tabla correcta: 'usuarios'
      if (!user) {
        const { data: userData, error: userError } = await supabase
          .from('usuarios') // ¡CORREGIDO! Antes buscaba en 'perfiles_usuario'
          .select('restaurante_id, rol')
          .eq('id', session.user.id)
          .single(); // Exigimos que devuelva 1 sola fila

        if (userError) throw userError;

        // Guardamos los datos en la memoria global de la app
        setAuth(session.user, userData.restaurante_id, userData.rol);
      }
    } catch (error) {
      console.error('Error de sesión en ProtectedRoute:', error);
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

  // Si después del chequeo no hay usuario validado, lo expulsamos al Login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Si todo está en orden, le permitimos ver el panel administrativo (hijos del Router)
  return <Outlet />;
}