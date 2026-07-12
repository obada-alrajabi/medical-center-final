
import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import { ErrorBoundary } from "./app/ErrorBoundary.tsx";
import "./styles/index.css";

window.addEventListener("unhandledrejection", (e) => {
  console.warn("[UnhandledRejection]", e.reason);
  e.preventDefault();
});

window.addEventListener("error", (e) => {
  if (e.message && e.message.includes("ResizeObserver")) {
    e.preventDefault();
    return;
  }
  console.error("[GlobalError]", e.message, e.filename, e.lineno);
});

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
