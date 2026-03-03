import React, { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(_error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '20px', 
          textAlign: 'center', 
          color: '#fff',
          background: 'var(--bg-panel)',
          borderRadius: '8px',
          margin: '10px'
        }}>
          <h2 style={{ color: '#e74c3c' }}>Algo correu mal</h2>
          <p>{this.state.error?.message || 'Erro ao renderizar componente'}</p>
          <button 
            onClick={this.handleRetry}
            style={{
              padding: '10px 20px',
              background: 'var(--accent-primary)',
              border: 'none',
              borderRadius: '4px',
              color: '#fff',
              cursor: 'pointer',
              marginTop: '10px'
            }}
          >
            Tentar novamente
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
