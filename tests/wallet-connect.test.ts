import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// The component module imports React UI; read the pure helper's behaviour through a transpiled import
const { connectClickAction } = await import("../client/src/components/wallet-connect-button");
const SOURCE = readFileSync(new URL("../client/src/components/wallet-connect-button.tsx", import.meta.url), "utf8");

test("desktop with a detected wallet opens the wallet modal", () => {
  assert.equal(connectClickAction({ isMobile: false, isInPhantom: false, hasInstalledWallet: true }), "wallet-modal");
  // Brave with "Extensions (no fallback)": Phantom only at window.phantom.solana
  assert.equal(connectClickAction({ isMobile: false, isInPhantom: true, hasInstalledWallet: true }), "wallet-modal");
});

test("desktop with no wallet shows the message instead of doing nothing", () => {
  assert.equal(connectClickAction({ isMobile: false, isInPhantom: false, hasInstalledWallet: false }), "no-wallet-message");
});

test("mobile behaviour is unchanged", () => {
  assert.equal(connectClickAction({ isMobile: true, isInPhantom: false, hasInstalledWallet: false }), "mobile-wallet-picker");
  assert.equal(connectClickAction({ isMobile: true, isInPhantom: true, hasInstalledWallet: true }), "wallet-modal");
});

test("a selected wallet is connected with the current connect(), never a stale one", () => {
  // The old auto-connect called connect() from a setTimeout after select(), which threw WalletNotSelectedError
  assert.ok(!/setTimeout\(\(\) => \{[\s\S]{0,200}connect\(\)/.test(SOURCE));
  assert.match(SOURCE, /if \(!pendingConnect \|\| !wallet \|\| connected \|\| connecting\) return;/);
  assert.match(SOURCE, /select\(null\);\s*setPendingConnect\(true\);\s*setVisible\(true\);/);
});

test("no per-render debug logs in the wallet button", () => {
  assert.ok(!SOURCE.includes("isInsidePhantomBrowser check"));
  assert.ok(!SOURCE.includes("'[WalletConnectButton] State:'"));
  assert.ok(!SOURCE.includes("Provider check #"));
});

test("the no-wallet message links to phantom.com", () => {
  assert.ok(SOURCE.includes('href="https://phantom.com/download"'));
});
