import React from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("KrishiSetu ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[380px] w-full flex-col items-center justify-center rounded-3xl border border-red-200/80 bg-gradient-to-b from-white to-red-50/40 p-8 text-center shadow-lg">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600">
            <AlertCircle size={28} />
          </div>
          <h2 className="mt-4 text-xl font-black text-[#10291d]">
            {this.props.fallbackTitle || "कुछ समस्या आई (Something went wrong)"}
          </h2>
          <p className="mt-2 max-w-md text-xs font-medium leading-5 text-[#5e7368]">
            {this.state.error?.message || "पेज लोड करने में अस्थायी त्रुटि हुई। कृपया दोबारा प्रयास करें।"}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 rounded-xl bg-[#176b3e] px-5 py-2.5 text-xs font-black text-white shadow-md transition hover:bg-[#125832] active:scale-95"
            >
              <RefreshCw size={14} />
              <span>Retry (पुनः प्रयास करें)</span>
            </button>
            {this.props.onGoBack && (
              <button
                type="button"
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  this.props.onGoBack();
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-[#cce1d2] bg-white px-5 py-2.5 text-xs font-bold text-[#234533] shadow-sm transition hover:bg-[#f3f9f4] active:scale-95"
              >
                <Home size={14} />
                <span>Dashboard पर लौटें</span>
              </button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

