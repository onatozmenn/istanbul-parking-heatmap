import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
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

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  handleReload = () => {
    window.location.hash = "";
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-screen flex items-center justify-center bg-gray-950">
          <div className="text-center max-w-md px-6">
            <h1 className="text-xl font-semibold text-white mb-2">Bir hata oluştu</h1>
            <p className="text-gray-400 text-sm mb-4">
              Uygulama beklenmedik bir hatayla karşılaştı.
            </p>
            {this.state.error && (
              <pre className="text-xs text-red-400 bg-gray-900 rounded-[9px] p-3 mb-4 text-left overflow-auto max-h-40">
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={this.handleReload}
              className="px-4 py-2 rounded-[9px] bg-blue-500 hover:bg-blue-400 text-white text-sm font-medium transition-colors"
            >
              Sayfayı Yenile
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}




