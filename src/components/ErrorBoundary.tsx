import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center min-h-screen bg-red-50">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Ups, ada yang salah!</h2>
          <p className="text-gray-700 mb-6">Materi ini sepertinya mengalami masalah (Mungkin format kartu tidak dikenali).</p>
          <pre className="text-xs text-left bg-red-100 p-4 rounded-lg overflow-auto max-w-full text-red-800 mb-6">
            {this.state.error?.message}
          </pre>
          <Link to="/" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-xl">
            Kembali ke Beranda
          </Link>
        </div>
      );
    }

    return this.props.children;
  }
}
