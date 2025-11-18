import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
          <h2 style={{ color: '#ef4444', marginBottom: '1rem' }}>⚠️ Something went wrong</h2>
          <p style={{ marginBottom: '1rem', color: 'var(--color-text)', opacity: 0.7 }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            className="primary-button"
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            type="button"
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

