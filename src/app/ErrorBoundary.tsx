import React from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface EBState { hasError: boolean; error: Error | null }

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  EBState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error): EBState {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }
  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (this.state.hasError) {
      return (
        <div
          dir="rtl"
          style={{ fontFamily: "'Tajawal', sans-serif", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F5F5F5" }}
        >
          <div style={{ background: "#fff", borderRadius: 16, padding: 40, boxShadow: "0 4px 24px rgba(0,0,0,0.12)", maxWidth: 440, width: "100%", margin: "0 16px", textAlign: "center" }}>
            <AlertTriangle size={48} color="#FF8F00" style={{ margin: "0 auto 16px" }} />
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1B3A6B", marginBottom: 8 }}>حدث خطأ غير متوقع</h2>
            <p style={{ color: "#555", fontSize: 14, marginBottom: 20, lineHeight: 1.7 }}>
              حدث خطأ أثناء تحميل التطبيق. يرجى الضغط على "إعادة المحاولة" للمتابعة.
            </p>
            {this.state.error && (
              <details style={{ fontSize: 12, textAlign: "right", color: "#999", background: "#F5F5F5", borderRadius: 8, padding: 12, marginBottom: 16 }}>
                <summary style={{ cursor: "pointer", color: "#D32F2F", marginBottom: 4 }}>تفاصيل الخطأ</summary>
                <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-all", margin: 0 }}>{this.state.error.message}</pre>
              </details>
            )}
            <button
              onClick={this.reset}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 24px", borderRadius: 12, background: "#1B3A6B", color: "#fff", fontWeight: 700, fontSize: 15, border: "none", cursor: "pointer" }}
            >
              <RefreshCw size={16} /> إعادة المحاولة
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export class ScreenErrorBoundary extends React.Component<
  { children: React.ReactNode; onBack?: () => void },
  EBState
> {
  constructor(props: { children: React.ReactNode; onBack?: () => void }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error): EBState {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ScreenErrorBoundary]", error, info.componentStack);
  }
  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (this.state.hasError) {
      return (
        <div
          dir="rtl"
          style={{ fontFamily: "'Tajawal', sans-serif", flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 32 }}
        >
          <div style={{ background: "#fff", borderRadius: 16, padding: 32, boxShadow: "0 2px 12px rgba(0,0,0,0.08)", maxWidth: 420, width: "100%", textAlign: "center" }}>
            <AlertTriangle size={40} color="#FF8F00" style={{ margin: "0 auto 12px" }} />
            <h3 style={{ fontSize: 17, fontWeight: 700, color: "#1B3A6B", marginBottom: 8 }}>خطأ في تحميل الشاشة</h3>
            <p style={{ color: "#555", fontSize: 13, marginBottom: 16, lineHeight: 1.7 }}>
              حدث خطأ أثناء معالجة الطلب. يرجى التحقق من البيانات المُدخلة والمحاولة مجدداً.
            </p>
            {this.state.error && (
              <details style={{ fontSize: 11, textAlign: "right", color: "#999", background: "#F5F5F5", borderRadius: 8, padding: 10, marginBottom: 14 }}>
                <summary style={{ cursor: "pointer", color: "#D32F2F", marginBottom: 4 }}>تفاصيل الخطأ</summary>
                <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-all", margin: 0 }}>{this.state.error.message}</pre>
              </details>
            )}
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              <button
                onClick={this.reset}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 10, background: "#1B3A6B", color: "#fff", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer" }}
              >
                <RefreshCw size={14} /> إعادة المحاولة
              </button>
              {this.props.onBack && (
                <button
                  onClick={() => { this.reset(); this.props.onBack!(); }}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 10, background: "#fff", color: "#1B3A6B", fontWeight: 700, fontSize: 13, border: "1.5px solid #1B3A6B", cursor: "pointer" }}
                >
                  <Home size={14} /> لوحة التحكم
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
