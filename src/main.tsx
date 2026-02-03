import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Ensure installed PWA doesn't get stuck on a stale cached version.
// If a new service worker is available, we force a one-time reload.
import { registerSW } from 'virtual:pwa-register';

// Auto-recover from Vite preload/dynamic chunk errors (common after deployments)
window.addEventListener('vite:preloadError', () => {
  window.location.reload();
});

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    // Avoid infinite reload loops
    const key = 'krt_pwa_refreshed';
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
    updateSW(true);
  },
});

createRoot(document.getElementById("root")!).render(<App />);
