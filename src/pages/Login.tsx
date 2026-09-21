// src/pages/Login.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/useAuthStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, ChefHat } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  
  // Estado para alternar entre "Iniciar Sesión" (true) y "Registrarse" (false)
  const [isLoginView, setIsLoginView] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nombreRestaurante: '' // Este campo solo se usará al registrarse
  });

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLoginView) {
        // ==========================================
        // 1. FLUJO DE INICIAR SESIÓN
        // ==========================================
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
        if (authError) throw authError;

        // Buscar a qué restaurante pertenece este usuario
        const { data: userData, error: userError } = await supabase
          .from('usuarios')
          .select('restaurante_id, rol')
          .eq('id', authData.user.id)
          .single();

        if (userError) throw userError;

        // Guardar la sesión en la memoria de la app y entrar al sistema
        setAuth(authData.user, userData.restaurante_id, userData.rol);
        navigate('/admin/dashboard');

      } else {
        // ==========================================
        // 2. FLUJO DE CREAR TIENDA (REGISTRO)
        // ==========================================
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
        });
        if (authError) throw authError;

        // Si el usuario se creó correctamente en Supabase Auth
        if (authData.user) {
          // A. Crear su base de datos de Restaurante
          const { data: restData, error: restError } = await supabase
            .from('restaurantes')
            .insert([{ nombre: formData.nombreRestaurante }])
            .select()
            .single();
            
          if (restError) throw new Error('Error al crear el restaurante: ' + restError.message);

          // B. Crear su Perfil de Usuario y vincularlo al restaurante
          const { error: userError } = await supabase
            .from('usuarios')
            .insert([{
              id: authData.user.id,
              restaurante_id: restData.id,
              rol: 'admin' // Le damos rol de Dueño/Admin
            }]);
            
          if (userError) throw new Error('Error al asignar permisos: ' + userError.message);

          alert('¡Tienda creada con éxito! Ahora puedes iniciar sesión con tu nueva cuenta.');
          setIsLoginView(true); // Devolvemos al usuario a la vista de Login
          setFormData({ ...formData, password: '' }); // Limpiamos la contraseña por seguridad
        }
      }
    } catch (error: any) {
      console.error('Error de autenticación:', error);
      alert(`❌ ${error.message || 'Ocurrió un error. Verifica tus datos.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 transition-colors duration-300">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8">
        
        <div className="flex flex-col items-center mb-8">
          <div className="bg-indigo-600 p-3 rounded-full mb-4 shadow-lg shadow-indigo-600/30">
            <ChefHat size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Cocin<span className="text-indigo-600 dark:text-indigo-400">App</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-center font-medium">
            {isLoginView ? 'Inicia sesión en tu panel de control' : 'Crea tu carta digital en segundos'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-5">
          {/* CAMPO DINÁMICO: Solo se muestra si estamos en modo "Crear Tienda" */}
          {!isLoginView && (
            <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Nombre de tu Local</label>
              <Input
                required
                placeholder="Ej: La Esquina Burger"
                value={formData.nombreRestaurante}
                onChange={(e) => setFormData({ ...formData, nombreRestaurante: e.target.value })}
                className="dark:bg-slate-800 dark:border-slate-700 dark:text-white h-11"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Correo Electrónico</label>
            <Input
              required
              type="email"
              placeholder="ejemplo@correo.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="dark:bg-slate-800 dark:border-slate-700 dark:text-white h-11"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Contraseña</label>
            <Input
              required
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="dark:bg-slate-800 dark:border-slate-700 dark:text-white h-11"
            />
            {!isLoginView && <p className="text-xs text-slate-400">Mínimo 6 caracteres.</p>}
          </div>

          <Button type="submit" disabled={isLoading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-12 text-lg font-bold shadow-md">
            {isLoading ? <Loader2 className="animate-spin mr-2" /> : (isLoginView ? 'Ingresar al Panel' : 'Crear mi Tienda')}
          </Button>
        </form>

        <div className="mt-8 text-center pt-6 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => {
              setIsLoginView(!isLoginView);
              setFormData({ email: '', password: '', nombreRestaurante: '' }); // Limpia formulario al cambiar
            }}
            className="text-sm text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline font-medium transition-colors"
          >
            {isLoginView ? '¿No tienes cuenta? Crea tu tienda gratis' : '¿Ya tienes una tienda? Inicia Sesión'}
          </button>
        </div>

      </div>
    </div>
  );
}