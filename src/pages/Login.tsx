// src/pages/Login.tsx
import { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/useAuthStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Loader2, ChefHat, QrCode, BarChart3, UtensilsCrossed,
  AlertCircle, CheckCircle2, ArrowRight, Mail,
} from 'lucide-react';

type ViewMode = 'login' | 'register' | 'check-email';

interface FormState {
  email: string;
  password: string;
  nombreRestaurante: string;
}

const INITIAL_FORM: FormState = { email: '', password: '', nombreRestaurante: '' };

const VALUE_PROPS = [
  { icon: QrCode, title: 'Menú QR con tu marca', description: 'Tus clientes escanean y ven tu carta siempre actualizada.' },
  { icon: BarChart3, title: 'Ventas y mesas bajo control', description: 'Cerrá el día sabiendo qué se vendió y qué falta.' },
  { icon: UtensilsCrossed, title: 'Catálogo sin complicaciones', description: 'Cargá platos, precios y categorías en minutos.' },
];

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setAuth } = useAuthStore();

  const [view, setView] = useState<ViewMode>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormState>(INITIAL_FORM);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const isLoginView = view === 'login';
  const isRegisterView = view === 'register';
  const isCheckEmailView = view === 'check-email';

  // Detectar mensajes que vienen desde /auth/callback
  useEffect(() => {
    const errorParam = searchParams.get('error');
    const messageParam = searchParams.get('message');
    if (errorParam) setErrorMsg(decodeURIComponent(errorParam));
    if (messageParam) setSuccessMsg(decodeURIComponent(messageParam));
  }, [searchParams]);

  const title = useMemo(() => {
    if (isLoginView) return 'Iniciá sesión';
    if (isRegisterView) return 'Creá tu tienda';
    return 'Confirmá tu correo';
  }, [isLoginView, isRegisterView]);

  const subtitle = useMemo(() => {
    if (isLoginView) return 'Entrá a tu panel para gestionar tu restaurante.';
    if (isRegisterView) return 'Tu carta digital lista en menos de 5 minutos.';
    return `Te enviamos un enlace a ${formData.email || 'tu correo'}. Abrilo para activar tu cuenta.`;
  }, [isLoginView, isRegisterView, formData.email]);

  const switchView = (next: ViewMode) => {
    setView(next);
    setFormData(INITIAL_FORM);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      // ══════════════════════════════════════════════════
      // LOGIN
      // ══════════════════════════════════════════════════
      if (isLoginView) {
        const { data: authData, error: authError } =
          await supabase.auth.signInWithPassword({
            email: formData.email,
            password: formData.password,
          });
        if (authError) throw authError;

        // Verificar si el email fue confirmado
        if (authData.user && !authData.user.email_confirmed_at) {
          await supabase.auth.signOut();
          throw new Error(
            'Todavía no confirmaste tu correo. Revisá tu bandeja de entrada (y la carpeta de spam).'
          );
        }

        const { data: userData, error: userError } = await supabase
          .from('usuarios')
          .select('restaurante_id, rol')
          .eq('id', authData.user.id)
          .maybeSingle();

        if (userError) throw userError;

        if (!userData) {
          await supabase.auth.signOut();
          throw new Error(
            'Tu cuenta no tiene una tienda asociada. Contactá a soporte o creá una nueva.'
          );
        }

        setAuth(authData.user, userData.restaurante_id, userData.rol);
        navigate('/admin');
        return;
      }

      // ══════════════════════════════════════════════════
      // REGISTRO
      // ══════════════════════════════════════════════════
      const redirectUrl = `${window.location.origin}/auth/callback`;

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            // Guardamos el nombre del restaurante en los metadatos del usuario
            // para poder crearlo después de la confirmación de email.
            nombre_restaurante: formData.nombreRestaurante.trim(),
          },
        },
      });
      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('No pudimos crear tu cuenta. Intentá de nuevo.');
      }

      // Si el usuario ya existía (Supabase devuelve identities vacío),
      // no le mandamos un email de confirmación pero tampoco creamos nada.
      if (authData.user.identities && authData.user.identities.length === 0) {
        throw new Error(
          'Ese correo ya tiene una cuenta. Probá iniciar sesión o recuperar tu contraseña.'
        );
      }

      // Pasamos a la vista de "confirmá tu correo"
      setView('check-email');
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Ocurrió un error. Verificá tus datos e intentá de nuevo.';

      const friendly = /Invalid login credentials/i.test(message)
        ? 'Correo o contraseña incorrectos.'
        : /Email not confirmed/i.test(message)
        ? 'Todavía no confirmaste tu correo. Revisá tu bandeja (y spam).'
        : /User already registered/i.test(message)
        ? 'Ese correo ya tiene una cuenta. Probá iniciar sesión.'
        : /Password should be at least/i.test(message)
        ? 'La contraseña es muy corta. Mínimo 6 caracteres.'
        : message;

      setErrorMsg(friendly);
      console.error('Error de autenticación:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: formData.email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
      setSuccessMsg('Te reenviamos el correo de confirmación.');
    } catch (error) {
      setErrorMsg(
        error instanceof Error ? error.message : 'No pudimos reenviar el correo.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-ink-50 text-ink-900 dark:bg-ink-950 dark:text-ink-100">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl grid-cols-1 lg:grid-cols-2">

        {/* Panel de marca */}
        <section
          aria-label="Propuesta de valor de CocinApp"
          className="relative hidden overflow-hidden bg-ink-900 p-10 text-white lg:flex lg:flex-col lg:justify-between"
        >
          <div aria-hidden="true" className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-brand-500/25 blur-3xl" />

          <header className="relative z-10 flex items-center gap-2">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-500 text-white">
              <ChefHat size={22} strokeWidth={2.25} />
            </span>
            <span className="text-lg font-semibold tracking-tight">
              Cocin<span className="text-brand-400">App</span>
            </span>
          </header>

          <div className="relative z-10 max-w-md">
            <h1 className="text-3xl font-semibold leading-tight tracking-tight xl:text-4xl">
              La gestión de tu restaurante, sin planillas ni cuadernos.
            </h1>
            <p className="mt-4 text-base text-ink-300">
              CocinApp digitaliza tu carta, tus ventas y tus mesas en un solo panel.
            </p>

            <ul className="mt-8 space-y-5">
              {VALUE_PROPS.map(({ icon: Icon, title, description }) => (
                <li key={title} className="flex gap-4">
                  <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/10">
                    <Icon size={18} strokeWidth={2} aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm font-medium">{title}</p>
                    <p className="text-sm text-ink-400">{description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <p className="relative z-10 text-xs text-ink-500">
            © {new Date().getFullYear()} CocinApp. Hecho para cocinas reales.
          </p>
        </section>

        {/* Formulario */}
        <section className="flex items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
          <div className="w-full max-w-sm">

            <header className="mb-8 flex items-center gap-2 lg:hidden">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-500 text-white">
                <ChefHat size={22} strokeWidth={2.25} />
              </span>
              <span className="text-lg font-semibold tracking-tight">
                Cocin<span className="text-brand-600">App</span>
              </span>
            </header>

            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {title}
            </h2>
            <p className="mt-2 text-sm text-ink-600 dark:text-ink-400">
              {subtitle}
            </p>

            {errorMsg && (
              <div role="alert" aria-live="assertive" className="mt-6 flex items-start gap-3 rounded-field border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
                <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
                <p>{errorMsg}</p>
              </div>
            )}

            {successMsg && (
              <div role="status" aria-live="polite" className="mt-6 flex items-start gap-3 rounded-field border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200">
                <CheckCircle2 size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
                <p>{successMsg}</p>
              </div>
            )}

            {/* ─── Vista: Confirmá tu correo ─── */}
            {isCheckEmailView ? (
              <div className="mt-6 space-y-5">
                <div className="rounded-card border border-brand-200 bg-brand-50 p-5 dark:border-brand-900/50 dark:bg-brand-950/30 text-center">
                  <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-900/50 dark:text-brand-400 mb-3">
                    <Mail size={26} aria-hidden="true" />
                  </div>
                  <p className="text-sm font-semibold text-ink-900 dark:text-ink-100">
                    Revisá tu correo
                  </p>
                  <p className="mt-2 text-sm text-ink-600 dark:text-ink-400 leading-relaxed">
                    Te enviamos un enlace de confirmación a{' '}
                    <strong className="text-ink-900 dark:text-ink-100">{formData.email}</strong>.
                    Hacé click en el enlace para activar tu cuenta y crear tu tienda.
                  </p>
                </div>

                <div className="text-xs text-ink-500 dark:text-ink-400 space-y-1.5 bg-ink-50 dark:bg-ink-900/50 rounded-field p-3">
                  <p>• Revisá la carpeta de <strong>spam</strong> si no lo ves en 2 minutos.</p>
                  <p>• El enlace expira en 24 horas.</p>
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleResendEmail}
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? (
                      <><Loader2 size={16} className="mr-2 animate-spin" /> Reenviando...</>
                    ) : (
                      'Reenviar correo'
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => switchView('login')}
                    className="w-full"
                  >
                    Volver al inicio de sesión
                  </Button>
                </div>
              </div>
            ) : (
              /* ─── Vistas: Login o Registro ─── */
              <form onSubmit={handleAuth} className="mt-6 space-y-5" noValidate>
                {isRegisterView && (
                  <div className="space-y-2">
                    <label htmlFor="nombreRestaurante" className="block text-sm font-medium text-ink-800 dark:text-ink-200">
                      Nombre de tu local
                    </label>
                    <Input
                      id="nombreRestaurante"
                      name="nombreRestaurante"
                      required
                      minLength={2}
                      autoComplete="organization"
                      placeholder="Ej: La Esquina Burger"
                      value={formData.nombreRestaurante}
                      onChange={(e) => setFormData({ ...formData, nombreRestaurante: e.target.value })}
                      disabled={isLoading}
                      className="h-11 rounded-field border-ink-300 bg-white text-base placeholder:text-ink-400 focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/20 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-100"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium text-ink-800 dark:text-ink-200">
                    Correo electrónico
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    inputMode="email"
                    placeholder="vos@turestaurante.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={isLoading}
                    className="h-11 rounded-field border-ink-300 bg-white text-base placeholder:text-ink-400 focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/20 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-100"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="block text-sm font-medium text-ink-800 dark:text-ink-200">
                      Contraseña
                    </label>
                    {isLoginView && (
                      <Link
                        to="/recuperar"
                        className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 underline-offset-4 hover:underline"
                      >
                        ¿La olvidaste?
                      </Link>
                    )}
                  </div>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    minLength={6}
                    autoComplete={isLoginView ? 'current-password' : 'new-password'}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    disabled={isLoading}
                    className="h-11 rounded-field border-ink-300 bg-white text-base placeholder:text-ink-400 focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/20 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-100"
                  />
                  {isRegisterView && (
                    <p className="text-xs text-ink-500 dark:text-ink-400">
                      Mínimo 6 caracteres.
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="group h-12 w-full rounded-field bg-brand-500 text-base font-semibold text-white shadow-brand transition hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 focus-visible:ring-offset-2 active:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
                      {isLoginView ? 'Ingresando...' : 'Creando tu tienda...'}
                    </>
                  ) : (
                    <>
                      {isLoginView ? 'Ingresar al panel' : 'Crear mi tienda'}
                      <ArrowRight size={18} className="ml-2 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                    </>
                  )}
                </Button>
              </form>
            )}

            {/* CTA secundario */}
            {!isCheckEmailView && (
              <div className="mt-8 rounded-card border border-ink-200 bg-white p-4 dark:border-ink-800 dark:bg-ink-900">
                <p className="text-sm font-medium text-ink-900 dark:text-ink-100">
                  {isLoginView ? '¿Todavía no tenés tu tienda?' : '¿Ya tenés una cuenta?'}
                </p>
                <p className="mt-1 text-sm text-ink-600 dark:text-ink-400">
                  {isLoginView
                    ? 'Creala gratis en menos de 1 minuto.'
                    : 'Entrá a tu panel y potenciá tu restaurante.'}
                </p>
                <button
                  type="button"
                  onClick={() => switchView(isLoginView ? 'register' : 'login')}
                  disabled={isLoading}
                  className="mt-3 inline-flex items-center gap-1.5 rounded text-sm font-medium text-brand-600 underline-offset-4 hover:text-brand-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30 focus-visible:ring-offset-2 disabled:opacity-60 dark:text-brand-400 dark:hover:text-brand-300"
                >
                  {isLoginView ? 'Crear mi tienda gratis' : 'Iniciar sesión'}
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
              </div>
            )}

            {isLoginView && (
              <ul className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-ink-500 dark:text-ink-400">
                {['Sin tarjeta de crédito', 'Soporte técnico', 'Cancelás cuando quieras'].map((item) => (
                  <li key={item} className="inline-flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}