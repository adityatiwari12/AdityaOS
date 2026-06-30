import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  appTitle: string;
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export default class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[AdityaOS] "${this.props.appTitle}" crashed:`, error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-2 p-6 text-center text-gray-300">
          <p className="text-sm font-semibold">{this.props.appTitle} ran into a problem</p>
          <p className="text-xs text-gray-500 max-w-sm break-words">{this.state.message}</p>
          <button
            onClick={() => this.setState({ hasError: false, message: '' })}
            className="mt-2 text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
