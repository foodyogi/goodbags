import "./polyfills";

// CRITICAL: Prevent mobile redirect to phantom.app BEFORE any React code runs
// This must happen synchronously before wallet adapters are initialized
// The issue: Solana wallet adapter stores "walletName" in localStorage
// On page load, if Phantom is stored but not installed, it redirects to phantom.app
(function preventMobileWalletRedirectEarly() {
  if (typeof window === 'undefined') return;
  
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  if (!isMobile) return;
  
  // Check if Phantom is actually available (installed)
  const hasPhantom = !!(window as any).phantom?.solana || !!(window as any).solana?.isPhantom;
  
  // Check if we have URL evidence that we came from a deep link (intentional)
  const urlParams = new URLSearchParams(window.location.search);
  const hasLaunchReady = urlParams.get('launch_ready') === '1';
  
  // If we're on mobile, Phantom is NOT installed, and we don't have deep link evidence,
  // clear the wallet localStorage to prevent any auto-connection attempts
  if (!hasPhantom && !hasLaunchReady) {
    const storedWallet = localStorage.getItem('walletName');
    if (storedWallet) {
      console.log('[main.tsx] Clearing stale wallet localStorage to prevent redirect:', storedWallet);
      localStorage.removeItem('walletName');
    }
  }
})();

import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
