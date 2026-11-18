import type { Express, RequestHandler } from "express";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { isServableUpload, uploadRequestError } from "../../upload-policy";

type UploadService = Pick<
  ObjectStorageService,
  "getObjectEntityUploadURL" | "normalizeObjectEntityPath" | "getObjectEntityFile" | "downloadObject"
>;

interface ObjectStorageRouteOptions {
  // Rate limit for upload URL requests
  rateLimit: RequestHandler;
  // Injectable for tests
  service?: UploadService;
}

/**
 * Object storage routes for coin image uploads (presigned URL flow):
 * 1. POST /api/uploads/request-url - signed-in users get a presigned URL for one image
 * 2. The client uploads the file directly to that URL
 * 3. GET /objects/... serves the image, only if it is an allowed image type and size
 */
export function registerObjectStorageRoutes(app: Express, options: ObjectStorageRouteOptions): void {
  const objectStorageService = options.service ?? new ObjectStorageService();

  /**
   * Request a presigned URL for file upload.
   *
   * Request body (JSON): { "name": "filename.jpg", "size": 12345, "contentType": "image/jpeg" }
   * Response: { "uploadURL": "https://storage.googleapis.com/...", "objectPath": "/objects/uploads/uuid" }
   *
   * Only the launch form uploads, and launching requires login, so a signed-in session is required.
   */
  app.post("/api/uploads/request-url", options.rateLimit, async (req, res) => {
    if (!req.isAuthenticated?.() || !req.user) {
      return res.status(401).json({ error: "Log in with X to upload an image" });
    }

    const error = uploadRequestError(req.body ?? {});
    if (error) {
      return res.status(400).json({ error });
    }

    try {
      const { name, size, contentType } = req.body;
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();

      // Extract object path from the presigned URL for later reference
      const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);

      res.json({
        uploadURL,
        objectPath,
        // Echo back the metadata for client convenience
        metadata: { name, size, contentType },
      });
    } catch (error) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  /**
   * Serve uploaded objects.
   *
   * The uploader chooses the stored content type, so only allowed image types within the
   * size limit are served; anything else (for example HTML) is treated as not found.
   */
  app.get("/objects/:objectPath(*)", async (req, res) => {
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      const [metadata] = await objectFile.getMetadata();
      if (!isServableUpload({ contentType: metadata.contentType, size: metadata.size })) {
        console.warn(`Refusing to serve ${req.path}: type ${metadata.contentType}, size ${metadata.size}`);
        return res.status(404).json({ error: "Object not found" });
      }
      res.set({
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; img-src 'self'; sandbox",
      });
      await objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error serving object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ error: "Object not found" });
      }
      return res.status(500).json({ error: "Failed to serve object" });
    }
  });
}
