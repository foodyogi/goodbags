/**
 * Safe diagnostics for the X login flow. Logs the step, HTTP status, X's error fields
 * (title, detail, type, errors, and OAuth error / error_description) and the
 * x-rate-limit-* headers. Never logs response bodies wholesale, so access tokens,
 * refresh tokens, token secrets, codes and verifiers can't end up in the logs.
 */

const ERROR_FIELDS = ["title", "detail", "type", "status", "reason", "client_id", "required_enrollment", "registration_url", "error", "error_description"] as const;
const ERROR_ITEM_FIELDS = ["code", "message", "title", "detail", "type", "parameter", "value"] as const;
const RATE_LIMIT_HEADERS = ["x-rate-limit-limit", "x-rate-limit-remaining", "x-rate-limit-reset"] as const;

function pickStrings(source: Record<string, unknown>, fields: readonly string[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const field of fields) {
    const value = source[field];
    if (typeof value === "string" || typeof value === "number") out[field] = value;
  }
  return out;
}

/** The safe parts of an X error body (JSON), or a size note for anything else. */
export function summarizeXErrorBody(bodyText: string): Record<string, unknown> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(bodyText);
  } catch {
    return { nonJsonBodyBytes: bodyText.length };
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { nonObjectBody: true };
  }
  const body = parsed as Record<string, unknown>;
  const summary = pickStrings(body, ERROR_FIELDS);
  if (Array.isArray(body.errors)) {
    summary.errors = body.errors
      .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
      .map((item) => pickStrings(item, ERROR_ITEM_FIELDS));
  }
  return summary;
}

export function rateLimitHeaders(headers: Headers): Record<string, string> {
  const out: Record<string, string> = {};
  for (const name of RATE_LIMIT_HEADERS) {
    const value = headers.get(name);
    if (value !== null) out[name] = value;
  }
  return out;
}

/** Log a failed X API response for one step of the login flow. Never throws. */
export async function logXFailure(step: string, response: Response): Promise<void> {
  let body: Record<string, unknown> = {};
  try {
    body = summarizeXErrorBody(await response.text());
  } catch {
    body = { unreadableBody: true };
  }
  console.error(
    `[X Login] ${step} failed: ${JSON.stringify({
      status: response.status,
      statusText: response.statusText,
      ...body,
      ...rateLimitHeaders(response.headers),
    })}`
  );
}

/** Log a failure that has no HTTP response (missing data, session problems, exceptions). */
export function logXStep(step: string, detail: string): void {
  console.error(`[X Login] ${step}: ${detail}`);
}
