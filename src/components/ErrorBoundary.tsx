// src/components/ErrorBoundary.tsx
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log para debugging. En producción podrías enviarlo a Sentry/LogRocket.
    console.error('ErrorBoundary capturó un error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-card border border-red-200 bg-red-50 p-6 text-center dark:border-red-900/50 dark:bg-red-950/30">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400 mb-4">
              <AlertTriangle size={24} />
            </div>

            <h2 className="text-lg font-bold text-red-900 dark:text-red-100">
              Algo salió mal
            </h2>
            <p className="text-sm text-red-700 dark:text-red-300 mt-2 leading-relaxed">
              No pudimos mostrar esta sección. Puede ser un problema temporal
              o una extensión del navegador interfiriendo con la app.
            </p>
            <p className="text-xs text-red-600 dark:text-red-400 mt-2">
              Si el problema sigue, probá abrir la app en una ventana de incógnito.
            </p>

            {import.meta.env.DEV && this.state.error && (
              <pre className="mt-4 text-left text-xs bg-red-100 dark:bg-red-950/50 p-3 rounded overflow-auto max-h-40 whitespace-pre-wrap break-all">
                {this.state.error.message}
              </pre>
            )}

            <div className="mt-5 flex flex-col sm:flex-row gap-2 justify-center">
              <Button variant="outline" onClick={this.handleReset}>
                Reintentar
              </Button>
              <Button onClick={this.handleReload}>
                <RefreshCw size={16} className="mr-2" />
                Recargar página
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}