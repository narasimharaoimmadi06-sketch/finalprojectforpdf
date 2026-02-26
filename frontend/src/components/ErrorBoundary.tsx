import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      // If a custom fallback is provided, use it
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }

      // Default fallback UI
      return (
        <div
          style={{
            padding: '2rem',
            margin: '1rem',
            borderRadius: '12px',
            background: 'rgba(220, 38, 38, 0.1)',
            border: '1px solid rgba(220, 38, 38, 0.3)',
            color: 'rgba(255, 200, 200, 0.9)',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <h2 style={{ marginBottom: '0.5rem', fontSize: '1.1rem', fontWeight: 600 }}>
            Something went wrong
          </h2>
          {this.state.error && (
            <pre
              style={{
                fontSize: '0.75rem',
                opacity: 0.7,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                marginBottom: '1rem',
              }}
            >
              {this.state.error.message}
            </pre>
          )}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={this.handleReset}
              style={{
                padding: '0.4rem 1rem',
                borderRadius: '6px',
                background: 'rgba(139, 92, 246, 0.3)',
                border: '1px solid rgba(139, 92, 246, 0.5)',
                color: 'white',
                cursor: 'pointer',
                fontSize: '0.85rem',
              }}
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '0.4rem 1rem',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: 'rgba(200, 180, 255, 0.8)',
                cursor: 'pointer',
                fontSize: '0.85rem',
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return <>{this.props.children}</>;
  }
}
