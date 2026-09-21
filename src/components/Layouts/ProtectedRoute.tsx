// src/components/Layouts/ProtectedRoute.tsx
import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';

export default function ProtectedRoute() {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Traemos las funciones para guardar los datos en nuestra memoria global
  const { setAuth, clearAuth } = useAuthStore();

  useEffect(() => {
    verificarUsuario();
  }, []);

  const verificarUsuario = async () => {
    try {
      // 1. ¿Hay una sesión activa en el navegador?
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setIsAuthenticated(false);
        clearAuth();
        setIsChecking(false);
        return;
      }

      // 2. Si hay sesión, buscamos su perfil en nuestra nueva tabla
      const { data: perfil, error } = await supabase
        .from('perfiles_usuario')
        .select('rol, restaurante_id, nombre_empleado')
        .eq('id', session.user.id)
        .single(); // .single() asegura que solo traiga 1 fila

      if (error || !perfil) {
        console.error("Error al obtener el perfil. ¿Está el usuario en la tabla perfiles_usuario?", error);
        setIsAuthenticated(false);
        setIsChecking(false);
        return;
      }

      // 3. ¡Éxito! Guardamos el rol y el restaurante en la memoria
      setAuth(perfil.rol, perfil.restaurante_id, perfil.nombre_empleado);
      setIsAuthenticated(true);
      
    } catch (error) {
      console.error("Error crítico de autenticación:", error);
      setIsAuthenticated(false);
    } finally {
      setIsChecking(false);
    }
  };

  // Pantalla de carga mientras verificamos en la base de datos
  if (isChecking) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  // Si está autorizado, entra. Si no, lo expulsamos.
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}