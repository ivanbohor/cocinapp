// src/pages/ForgotPassword.tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Loader2, Mail, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
    } catch (err) {
      console.error(err);
      setError('No pudimos enviar el correo. Verificá tu dirección e intentá de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-ink-50 dark:bg-ink-950 p-4">
      <div className="w-full max-w-sm">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 hover:text-ink-900 dark:text-ink-400 dark:hover:text-ink-100 mb-6"
        >
          <ArrowLeft size={16} />
          Volver al login
        </Link>

        <div className="rounded-card border border-ink-200 bg-white p-6 shadow-lg dark:border-ink-800 dark:bg-ink-900">
          {sent ? (
            <div className="text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 mb-4">
                <CheckCircle2 size={26} aria-hidden="true" />
              </div>
              <h1 className="text-lg font-semibold text-ink-900 dark:text-ink-100">
                Revisá tu correo
              </h1>
              <p className="mt-2 text-sm text-ink-500 dark:text-ink-400 leading-relaxed">
                Si existe una cuenta con <strong className="text-ink-700 dark:text-ink-200">{email}</strong>,
                vas a recibir un enlace para resetear tu contraseña.
              </p>
              <p className="mt-3 text-xs text-ink-400">
                Revisá la carpeta de spam si no lo ves en 2 minutos.
              </p>
              <Link to="/login" className="block mt-5">
                <Button variant="outline" className="w-full">
                  Volver al login
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-100 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400 mb-4">
                <Mail size={26} aria-hidden="true" />
              </div>
              <h1 className="text-lg font-semibold text-ink-900 dark:text-ink-100 text-center">
                Recuperar contraseña
              </h1>
              <p className="mt-2 text-sm text-ink-500 dark:text-ink-400 text-center">
                Ingresá tu correo y te enviamos un enlace para crear una contraseña nueva.
              </p>

              {error && (
                <div role="alert" className="mt-4 flex items-start gap-2 rounded-field border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium text-ink-800 dark:text-ink-200">
                    Correo electrónico
                  </label>
                  <Input
                    id="email"
                    type="email"
                    required
                    autoFocus
                    autoComplete="email"
                    inputMode="email"
                    placeholder="vos@turestaurante.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="h-11 dark:bg-ink-800 dark:border-ink-700 dark:text-white"
                  />
                </div>
                <Button type="submit" disabled={isLoading} className="w-full h-11">
                  {isLoading ? (
                    <><Loader2 size={16} className="mr-2 animate-spin" /> Enviando...</>
                  ) : (
                    'Enviar enlace'
                  )}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}