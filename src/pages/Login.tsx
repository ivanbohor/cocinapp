// src/pages/Login.tsx
import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/useAuthStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Loader2,
  ChefHat,
  QrCode,
  BarChart3,
  UtensilsCrossed,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

type ViewMode = 'login' | 'register';

interface FormState {
  email: string;
  password: string;
  nombreRestaurante: string;
}

const INITIAL_FORM: FormState = {
  email: '',
  password: '',
  nombreRestaurante: '',
};

const VALUE_PROPS = [
  {
    icon: QrCode,
    title: 'Menú QR con tu marca',
    description: 'Tus clientes escanean y ven tu carta siempre actualizada.',
  },
  {
    icon: BarChart3,
    title: 'Ventas y mesas bajo control',
    description: 'Cerrá el día sabiendo qué se vendió y qué falta.',
  },
  {
    icon: UtensilsCrossed,
    title: 'Catálogo sin complicaciones',
    description: 'Cargá platos, precios y categorías en minutos.',
  },
];

export default function Login() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const [view, setView] = useState<ViewMode>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormState>(INITIAL_FORM);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const isLoginView = view === 'login';
  const title = useMemo(
    () => (isLoginView ? 'Iniciá sesión' : 'Creá tu tienda'),
    [isLoginView]
  );
  const subtitle = useMemo(
    () =>
      isLoginView
        ? 'Entrá a tu panel para gestionar tu restaurante.'
        : 'Tu carta digital lista en menos de 5 minutos. Sin tarjeta.',
    [isLoginView]
  );

  const switchView = () => {
    setView(isLoginView ? 'register' : 'login');
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
      if (isLoginView) {
        // ==========================================
        // 1. FLUJO DE INICIAR SESIÓN
        // ==========================================
        const { data: authData, error: authError } =
          await supabase.auth.signInWithPassword({
            email: formData.email,
            password: formData.password,
          });
        if (authError) throw authError;

        // 🔧 CAMBIO CRÍTICO APLICADO: Usamos maybeSingle() para evitar el error PGRST116
        const { data: userData, error: userError } = await supabase
          .from('usuarios')
          .select('restaurante_id, rol')
          .eq('id', authData.user.id)
          .maybeSingle(); 

        if (userError) throw userError;

        // 🔧 NUEVA VALIDACIÓN: Manejo seguro del Usuario Fantasma
        if (!userData) {
          await supabase.auth.signOut(); // Limpiamos la sesión corrupta
          throw new Error('Tu registro anterior quedó incompleto por un error de red. Por favor, volvé a crear tu tienda.');
        }

        setAuth(authData.user, userData.restaurante_id, userData.rol);
        navigate('/admin/dashboard');
        return;
      }

      // ==========================================
      // 2. FLUJO DE CREAR TIENDA (REGISTRO)
      // ==========================================
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });
      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('No pudimos crear tu cuenta. Intentá de nuevo.');
      }

      const { data: restData, error: restError } = await supabase
        .from('restaurantes')
        .insert([{ nombre: formData.nombreRestaurante }])
        .select()
        .single();
      if (restError)
        throw new Error('No pudimos crear tu restaurante: ' + restError.message);

      const { error: profileError } = await supabase.from('usuarios').insert([
        {
          id: authData.user.id,
          restaurante_id: restData.id,
          rol: 'admin',
        },
      ]);
      if (profileError)
        throw new Error('No pudimos asignar permisos: ' + profileError.message);

      setSuccessMsg(
        '¡Tienda creada! Ya podés iniciar sesión con tu cuenta.'
      );
      setView('login');
      setFormData((prev) => ({ ...prev, password: '' }));
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Ocurrió un error. Verificá tus datos e intentá de nuevo.';
      
      // Traducciones amigables para errores comunes de Supabase
      const friendly = /Invalid login credentials/i.test(message)
        ? 'Correo o contraseña incorrectos.'
        : /Email not confirmed/i.test(message)
        ? 'Todavía no confirmaste tu correo. Revisá tu bandeja.'
        : /User already registered/i.test(message)
        ? 'Ese correo ya tiene una cuenta. Probá iniciar sesión.'
        : message;
      setErrorMsg(friendly);
      console.error('Error de autenticación:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-ink-50 text-ink-900 dark:bg-ink-950 dark:text-ink-100">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl grid-cols-1 lg:grid-cols-2">

        {/* Panel de marca — solo lg+ */}
        <section
          aria-label="Propuesta de valor de CocinApp"
          className="relative hidden overflow-hidden bg-ink-900 p-10 text-white lg:flex lg:flex-col lg:justify-between"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-brand-500/25 blur-3xl"
          />

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

            {/* Marca mobile */}
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

            {/* Banner de error */}
            {errorMsg && (
              <div
                role="alert"
                aria-live="assertive"
                className="mt-6 flex items-start gap-3 rounded-field border border-red-200 bg-red-50 p-3 text-sm text-red-800
                           dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
              >
                <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
                <p>{errorMsg}</p>
              </div>
            )}

            {/* Banner de éxito */}
            {successMsg && (
              <div
                role="status"
                aria-live="polite"
                className="mt-6 flex items-start gap-3 rounded-field border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800
                           dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200"
              >
                <CheckCircle2 size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
                <p>{successMsg}</p>
              </div>
            )}

            <form onSubmit={handleAuth} className="mt-6 space-y-5" noValidate>
              {!isLoginView && (
                <div className="space-y-2">
                  <label
                    htmlFor="nombreRestaurante"
                    className="block text-sm font-medium text-ink-800 dark:text-ink-200"
                  >
                    Nombre de tu local
                  </label>
                  <Input
                    id="nombreRestaurante"
                    name="nombreRestaurante"
                    required
                    autoComplete="organization"
                    placeholder="Ej: La Esquina Burger"
                    value={formData.nombreRestaurante}
                    onChange={(e) =>
                      setFormData({ ...formData, nombreRestaurante: e.target.value })
                    }
                    disabled={isLoading}
                    className="h-11 rounded-field border-ink-300 bg-white text-base placeholder:text-ink-400
                               focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/20
                               dark:border-ink-700 dark:bg-ink-900 dark:text-ink-100"
                  />
                </div>
              )}

              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-ink-800 dark:text-ink-200"
                >
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
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  disabled={isLoading}
                  className="h-11 rounded-field border-ink-300 bg-white text-base placeholder:text-ink-400
                             focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/20
                             dark:border-ink-700 dark:bg-ink-900 dark:text-ink-100"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-ink-800 dark:text-ink-200"
                >
                  Contraseña
                </label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  autoComplete={isLoginView ? 'current-password' : 'new-password'}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  disabled={isLoading}
                  className="h-11 rounded-field border-ink-300 bg-white text-base placeholder:text-ink-400
                             focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/20
                             dark:border-ink-700 dark:bg-ink-900 dark:text-ink-100"
                />
                {!isLoginView && (
                  <p className="text-xs text-ink-500 dark:text-ink-400">
                    Mínimo 6 caracteres.
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="group h-12 w-full rounded-field bg-brand-500 text-base font-semibold text-white shadow-brand
                           transition
                           hover:bg-brand-600
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 focus-visible:ring-offset-2
                           active:bg-brand-700
                           disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
                    {isLoginView ? 'Ingresando...' : 'Creando tu tienda...'}
                  </>
                ) : (
                  <>
                    {isLoginView ? 'Ingresar al panel' : 'Crear mi tienda'}
                    <ArrowRight
                      size={18}
                      className="ml-2 transition-transform group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </>
                )}
              </Button>
            </form>

            {/* CTA secundario con peso propio */}
            <div className="mt-8 rounded-card border border-ink-200 bg-white p-4 dark:border-ink-800 dark:bg-ink-900">
              <p className="text-sm font-medium text-ink-900 dark:text-ink-100">
                {isLoginView ? '¿Todavía no tenés tu tienda?' : '¿Ya tenés una cuenta?'}
              </p>
              <p className="mt-1 text-sm text-ink-600 dark:text-ink-400">
                {isLoginView
                  ? 'Creala gratis en menos de 5 minutos. Sin tarjeta.'
                  : 'Entrá a tu panel y seguí gestionando tu restaurante.'}
              </p>
              <button
                type="button"
                onClick={switchView}
                disabled={isLoading}
                className="mt-3 inline-flex items-center gap-1.5 rounded text-sm font-medium text-brand-600 underline-offset-4
                           hover:text-brand-700 hover:underline
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30 focus-visible:ring-offset-2
                           disabled:opacity-60
                           dark:text-brand-400 dark:hover:text-brand-300"
              >
                {isLoginView ? 'Crear mi tienda gratis' : 'Iniciar sesión'}
                <ArrowRight size={16} aria-hidden="true" />
              </button>
            </div>

            {/* Trust signals */}
            <ul className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-ink-500 dark:text-ink-400">
              {['Sin tarjeta de crédito', 'Soporte en español', 'Cancelás cuando quieras'].map(
                (item) => (
                  <li key={item} className="inline-flex items-center gap-1.5">
                    <CheckCircle2
                      size={14}
                      className="text-emerald-600 dark:text-emerald-400"
                      aria-hidden="true"
                    />
                    {item}
                  </li>
                )
              )}
            </ul>

            {isLoginView && (
              <p className="mt-6 text-center text-sm">
                <Link
                  to="/recuperar"
                  className="text-ink-600 underline-offset-4 hover:text-ink-900 hover:underline
                             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30 focus-visible:ring-offset-2 rounded
                             dark:text-ink-400 dark:hover:text-ink-100"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}