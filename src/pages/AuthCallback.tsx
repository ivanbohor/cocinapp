// src/pages/AuthCallback.tsx
import { useEffect, useState, useRef  } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/useAuthStore';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [error, setError] = useState<string | null>(null);
    // ✅ Guard contra Strict Mode doble-mount
  const processedRef = useRef(false);
  

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;
    const handle = async () => {
      try {
        // Supabase procesa el hash de la URL automáticamente al detectar la sesión
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (!session) {
          // Puede tardar unos ms en procesar el token del hash
          await new Promise((r) => setTimeout(r, 500));
          const retry = await supabase.auth.getSession();
          if (!retry.data.session) {
            throw new Error('No pudimos verificar tu sesión.');
          }
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No pudimos verificar tu cuenta.');

        // Verificar si ya tiene una tienda creada
        const { data: existingUser } = await supabase
          .from('usuarios')
          .select('restaurante_id, rol')
          .eq('id', user.id)
          .maybeSingle();

        if (existingUser) {
          // Ya tiene tienda → login normal
          setAuth(user, existingUser.restaurante_id, existingUser.rol);
          setStatus('success');
          setTimeout(() => navigate('/admin', { replace: true }), 1200);
          return;
        }

        // No tiene tienda → crear usando el nombre del metadata
        const nombreRestaurante = (user.user_metadata?.nombre_restaurante as string) || '';

        if (!nombreRestaurante || nombreRestaurante.trim().length < 2) {
          throw new Error(
            'No encontramos el nombre de tu restaurante. Por favor, volvé a crear la tienda desde el registro.'
          );
        }

        // Llamar a la función atómica (ahora idempotente)
            const { data: rpcData, error: rpcError } = await supabase.rpc(
            'crear_tienda_completa',
            { p_nombre_restaurante: nombreRestaurante }
            );

            if (rpcError) {
            // Si el RPC falla, revisar si el usuario YA tiene tienda (por doble ejecución)
            const { data: fallback } = await supabase
                .from('usuarios')
                .select('restaurante_id, rol')
                .eq('id', user.id)
                .maybeSingle();

            if (fallback) {
                // Ya existe — usar esa tienda
                setAuth(user, fallback.restaurante_id, fallback.rol);
                setStatus('success');
                setTimeout(() => navigate('/admin', { replace: true }), 800);
                return;
            }

            throw rpcError;
            }

            const restauranteId = (rpcData as { restaurante_id: string })?.restaurante_id;
            const rol = (rpcData as { rol: string })?.rol || 'admin';

            if (!restauranteId) {
            throw new Error('No pudimos crear tu tienda. Contactá a soporte.');
            }

            setAuth(user, restauranteId, rol);
            setStatus('success');
            setTimeout(() => navigate('/admin', { replace: true }), 800);
      } catch (err) {
        console.error('Error en AuthCallback:', err);
        setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado.');
        setStatus('error');
        setTimeout(() => {
          navigate('/login?error=' + encodeURIComponent(
            err instanceof Error ? err.message : 'Error de verificación'
          ), { replace: true });
        }, 3000);
      }
    };

    handle();
  }, [navigate, setAuth]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-50 dark:bg-ink-950 p-4">
      <div className="w-full max-w-sm rounded-card border border-ink-200 bg-white p-6 text-center shadow-lg dark:border-ink-800 dark:bg-ink-900">
        {status === 'processing' && (
          <>
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-100 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400 mb-4">
              <Loader2 size={26} className="animate-spin" aria-hidden="true" />
            </div>
            <h1 className="text-lg font-semibold text-ink-900 dark:text-ink-100">
              Activando tu cuenta...
            </h1>
            <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">
              Estamos preparando tu tienda. Tarda unos segundos.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 mb-4">
              <CheckCircle2 size={26} aria-hidden="true" />
            </div>
            <h1 className="text-lg font-semibold text-ink-900 dark:text-ink-100">
              ¡Todo listo!
            </h1>
            <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">
              Entrando a tu panel...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 mb-4">
              <AlertCircle size={26} aria-hidden="true" />
            </div>
            <h1 className="text-lg font-semibold text-ink-900 dark:text-ink-100">
              Algo salió mal
            </h1>
            <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">
              {error || 'No pudimos activar tu cuenta.'}
            </p>
            <p className="mt-4 text-xs text-ink-400">
              Redirigiendo al login...
            </p>
          </>
        )}
      </div>
    </div>
  );
}