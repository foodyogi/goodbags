// CRITICAL: Prevent unwanted wallet redirects BEFORE any other code runs
// This MUST be the very first thing that executes
// Issues addressed:
// 1. On iOS, Phantom adapter sets readyState to "Loadable" and redirects to phantom.app
// 2. Brave browser auto-opens brave://wallet/crypto/unlock when it detects Solana code
(function preventWalletRedirectImmediate() {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
  
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const isBrave = !!(navigator as any).brave;
  console.log('[polyfills] Running redirect prevention, isMobile:', isMobile, 'isBrave:', isBrave);
  
  // Check if Phantom is actually installed
  const hasPhantom = !!(window as any).phantom?.solana || !!(window as any).solana?.isPhantom;
  
  // Check if we have URL evidence of a deep link (intentional)
  const urlParams = new URLSearchParams(window.location.search);
  const hasLaunchReady = urlParams.get('launch_ready') === '1';
  
  console.log('[polyfills] Wallet check - hasPhantom:', hasPhantom, 'hasLaunchReady:', hasLaunchReady);
  console.log('[polyfills] Current walletName in localStorage:', localStorage.getItem('walletName'));
  
  // Determine if we need redirect protection
  // - On mobile without Phantom installed (prevents phantom.app redirects)
  // - On Brave browser (prevents brave://wallet redirects)
  const needsProtection = (isMobile && !hasPhantom && !hasLaunchReady) || isBrave;
  
  if (needsProtection) {
    console.log('[polyfills] Activating redirect protection (mobile:', isMobile, 'brave:', isBrave, ')...');
    const storedWallet = localStorage.getItem('walletName');
    if (storedWallet) {
      console.log('[polyfills] EARLY: Clearing stale wallet localStorage:', storedWallet);
      localStorage.removeItem('walletName');
    }
    // Also clear any other wallet-related keys that might trigger behavior
    const walletKeys = ['wallet-adapter-phantom-mobile', 'walletAdapter', 'phantomMobileVersion'];
    walletKeys.forEach(key => {
      if (localStorage.getItem(key)) {
        console.log('[polyfills] EARLY: Clearing wallet key:', key);
        localStorage.removeItem(key);
      }
    });
    
    // AGGRESSIVE FIX: Intercept any redirect to wallet URLs
    // This catches redirects that might happen from wallet adapters
    // even after we've cleared localStorage
    let blockingRedirects = true;
    
    // Helper to check if URL should be blocked
    const shouldBlockUrl = (url: string): boolean => {
      const blockedPatterns = [
        'phantom.app',
        'phantom://',
        'brave://wallet',
        'brave://crypto',
      ];
      return blockedPatterns.some(pattern => url.includes(pattern));
    };
    
    Object.defineProperty(window, '__walletRedirectBlocked', { value: false, writable: true });
    
    // We can't fully replace window.location, but we can intercept href assignments
    // by patching the original location object
    try {
      const originalHrefDescriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(window.location), 'href');
      if (originalHrefDescriptor && originalHrefDescriptor.set) {
        const originalSet = originalHrefDescriptor.set;
        Object.defineProperty(window.location, 'href', {
          get: originalHrefDescriptor.get,
          set: function(value) {
            if (typeof value === 'string' && blockingRedirects && shouldBlockUrl(value)) {
              console.log('[polyfills] BLOCKED redirect to:', value);
              (window as any).__walletRedirectBlocked = true;
              return; // Don't redirect
            }
            originalSet.call(this, value);
          },
          enumerable: true,
          configurable: true
        });
      }
    } catch (e) {
      console.log('[polyfills] Could not intercept location.href:', e);
    }
    
    // Also intercept window.open for new tab redirects (like Brave does)
    const originalWindowOpen = window.open;
    window.open = function(url?: string | URL, target?: string, features?: string) {
      if (url && typeof url === 'string' && blockingRedirects && shouldBlockUrl(url)) {
        console.log('[polyfills] BLOCKED window.open to:', url);
        (window as any).__walletRedirectBlocked = true;
        return null; // Don't open the new window
      }
      return originalWindowOpen.call(this, url, target, features);
    };
    
    // Allow user-initiated redirects after a short delay
    setTimeout(() => {
      blockingRedirects = false;
    }, 3000);
  }
})();

import { Buffer } from "buffer";

declare global {
  interface Window {
    Buffer: typeof Buffer;
  }
}

if (typeof window !== "undefined") {
  window.Buffer = Buffer;
}

export {};
