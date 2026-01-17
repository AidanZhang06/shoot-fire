import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#1a1a1a',
          color: '#ffffff',
          padding: '20px',
          fontFamily: 'monospace'
        }}>
          <h1 style={{ color: '#ff4444', marginBottom: '20px' }}>⚠️ Application Error</h1>
          <div style={{
            backgroundColor: '#2a2a2a',
            padding: '20px',
            borderRadius: '8px',
            maxWidth: '800px',
            overflow: 'auto'
          }}>
            <h2 style={{ color: '#ff6666' }}>Error Details:</h2>
            <pre style={{ color: '#ffaaaa', whiteSpace: 'pre-wrap' }}>
              {this.state.error?.toString()}
            </pre>
            {this.state.errorInfo && (
              <>
                <h3 style={{ color: '#ff8888', marginTop: '20px' }}>Component Stack:</h3>
                <pre style={{ color: '#ffaaaa', whiteSpace: 'pre-wrap', fontSize: '12px' }}>
                  {this.state.errorInfo.componentStack}
                </pre>
              </>
            )}
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              backgroundColor: '#00ffff',
              color: '#000',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

