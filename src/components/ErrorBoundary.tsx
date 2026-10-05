import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  resetKey?: string;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) console.error('[ErrorBoundary]', error, info);
    // Stale code after a new deploy → reload once to get fresh files.
    if (/Loading chunk|dynamically imported module|ChunkLoadError/i.test(error.message)) {
      const key = 'krt_chunk_reload';
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, '1');
        window.location.reload();
      }
    }
  }

  componentDidUpdate(prev: Props) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 p-8 text-center">
        <h2 className="font-serif text-2xl text-foreground">Something went wrong</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          This page couldn't load properly. Please try again.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => this.setState({ error: null })}
            className="rounded-md border border-border px-4 py-2 text-sm hover:bg-secondary"
          >
            Try again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
          >
            Reload page
          </button>
        </div>
      </div>
    );
  }
}
