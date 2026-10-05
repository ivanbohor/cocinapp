// src/pages/ResetPassword.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/stores/useToastStore';
import { Loader2, Lock, AlertCircle } from 'lucide-react';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Supabase procesa el token en el hash y crea una sesión temporal.
  // Verificamos que exista esa sesión.
  useEffect(() => {
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        setError('El enlace expiró o es inválido. Pedí uno nuevo.');
      }
      setIsChecking(false);
    };
    check();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success('Contraseña actualizada', 'Ya podés iniciar sesión con tu nueva contraseña.');
      setTimeout(() => navigate('/admin', { replace: true }), 1200);
    } catch (err) {
      console.error(err);
      setError('No pudimos actualizar tu contraseña. El enlace puede haber expirado.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-ink-50 dark:bg-ink-950 p-4">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-ink-50 dark:bg-ink-950 p-4">
      <div className="w-full max-w-sm">
        <div className="rounded-card border border-ink-200 bg-white p-6 shadow-lg dark:border-ink-800 dark:bg-ink-900">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-100 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400 mb-4">
            <Lock size={26} aria-hidden="true" />
          </div>
          <h1 className="text-lg font-semibold text-ink-900 dark:text-ink-100 text-center">
            Nueva contraseña
          </h1>
          <p className="mt-2 text-sm text-ink-500 dark:text-ink-400 text-center">
            Elegí una contraseña nueva para tu cuenta.
          </p>

          {error && (
            <div role="alert" className="mt-4 flex items-start gap-2 rounded-field border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-ink-800 dark:text-ink-200">
                Nueva contraseña
              </label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading || !!error}
                className="h-11 dark:bg-ink-800 dark:border-ink-700 dark:text-white"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-ink-800 dark:text-ink-200">
                Confirmá tu contraseña
              </label>
              <Input
                id="confirmPassword"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading || !!error}
                className="h-11 dark:bg-ink-800 dark:border-ink-700 dark:text-white"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading || !!error}
              className="w-full h-11"
            >
              {isLoading ? (
                <><Loader2 size={16} className="mr-2 animate-spin" /> Guardando...</>
              ) : (
                'Guardar contraseña'
              )}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}