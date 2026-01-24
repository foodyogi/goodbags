// CRITICAL: Prevent mobile redirect to phantom.app BEFORE any other code runs
// This MUST be the very first thing that executes
// The issue: Solana wallet adapter stores "walletName" in localStorage
// On iOS, Phantom adapter sets readyState to "Loadable" and redirects when connect() is called
(function preventMobileWalletRedirectImmediate() {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
  
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  console.log('[polyfills] Running redirect prevention, isMobile:', isMobile);
  
  if (!isMobile) return;
  
  // Check if Phantom is actually installed
  const hasPhantom = !!(window as any).phantom?.solana || !!(window as any).solana?.isPhantom;
  
  // Check if we have URL evidence of a deep link (intentional)
  const urlParams = new URLSearchParams(window.location.search);
  const hasLaunchReady = urlParams.get('launch_ready') === '1';
  
  console.log('[polyfills] Mobile check - hasPhantom:', hasPhantom, 'hasLaunchReady:', hasLaunchReady);
  console.log('[polyfills] Current walletName in localStorage:', localStorage.getItem('walletName'));
  
  // If Phantom is NOT installed and we don't have deep link evidence,
  // clear ALL wallet-related localStorage to prevent redirect
  if (!hasPhantom && !hasLaunchReady) {
    console.log('[polyfills] Activating redirect protection...');
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
    
    // AGGRESSIVE FIX: Intercept any redirect to phantom.app
    // This catches redirects that might happen from the wallet adapter
    // even after we've cleared localStorage
    const originalLocationDescriptor = Object.getOwnPropertyDescriptor(window, 'location');
    let blockingRedirects = true;
    
    // Monitor location.href changes for phantom.app redirects
    const originalHref = window.location.href;
    Object.defineProperty(window, '__phantomRedirectBlocked', { value: false, writable: true });
    
    // Create a proxy to intercept location.href assignments
    const locationProxy = new Proxy(window.location, {
      set(target, prop, value) {
        if (prop === 'href' && typeof value === 'string' && blockingRedirects) {
          // Block redirects to phantom.app unless user-initiated
          if (value.includes('phantom.app') || value.includes('phantom://')) {
            console.log('[polyfills] BLOCKED automatic redirect to:', value);
            (window as any).__phantomRedirectBlocked = true;
            return true; // Pretend we set it, but don't actually redirect
          }
        }
        // Allow other redirects
        (target as any)[prop] = value;
        return true;
      },
      get(target, prop) {
        const value = (target as any)[prop];
        if (typeof value === 'function') {
          return value.bind(target);
        }
        return value;
      }
    });
    
    // We can't fully replace window.location, but we can intercept href assignments
    // by patching the original location object
    try {
      const originalHrefDescriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(window.location), 'href');
      if (originalHrefDescriptor && originalHrefDescriptor.set) {
        const originalSet = originalHrefDescriptor.set;
        Object.defineProperty(window.location, 'href', {
          get: originalHrefDescriptor.get,
          set: function(value) {
            if (typeof value === 'string' && blockingRedirects) {
              if (value.includes('phantom.app') || value.includes('phantom://')) {
                console.log('[polyfills] BLOCKED redirect to:', value);
                (window as any).__phantomRedirectBlocked = true;
                return; // Don't redirect
              }
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
