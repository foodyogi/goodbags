/**
 * Limits for user uploads (coin images). The presigned upload URL can't enforce type or
 * size, so they are checked when the URL is requested and again when the file is served:
 * anything outside the allowlist is never served from our domain. SVG is excluded
 * because it can carry scripts.
 */
export const ALLOWED_UPLOAD_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"] as const;
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // Matches the launch form's 10MB limit

export function uploadRequestError(body: { name?: unknown; size?: unknown; contentType?: unknown }): string | null {
  if (typeof body.name !== "string" || body.name.length === 0 || body.name.length > 255) {
    return "Missing or invalid file name";
  }
  if (typeof body.contentType !== "string" || !(ALLOWED_UPLOAD_TYPES as readonly string[]).includes(body.contentType)) {
    return "Only PNG, JPG, GIF or WebP images can be uploaded";
  }
  if (typeof body.size !== "number" || !Number.isFinite(body.size) || body.size <= 0 || body.size > MAX_UPLOAD_BYTES) {
    return "Images must be under 10MB";
  }
  return null;
}

export function isServableUpload(metadata: { contentType?: string; size?: string | number }): boolean {
  const size = Number(metadata.size);
  return (
    typeof metadata.contentType === "string" &&
    (ALLOWED_UPLOAD_TYPES as readonly string[]).includes(metadata.contentType) &&
    Number.isFinite(size) &&
    size > 0 &&
    size <= MAX_UPLOAD_BYTES
  );
}
