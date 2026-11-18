/**
 * Where to send the user after login: only a relative path on this site, without an
 * "error" query parameter (so a failed login isn't carried into the next attempt).
 */
export function safeReturnTo(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) return "/";
  const url = new URL(value, "http://local");
  // Backslashes are read as slashes ("/\\evil.com" becomes "//evil.com"), so check the parsed result too
  if (url.origin !== "http://local" || url.pathname.startsWith("//")) return "/";
  url.searchParams.delete("error");
  return `${url.pathname}${url.search}${url.hash}` || "/";
}
