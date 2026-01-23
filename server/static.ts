import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // Serve static assets with appropriate cache headers
  // Assets in /assets/ folder have content hashes, so can be cached for a long time
  // Other files should not be cached aggressively
  app.use('/assets', express.static(path.join(distPath, 'assets'), {
    maxAge: '1y', // Cache hashed assets for 1 year
    immutable: true,
  }));

  // Serve other static files with short cache time
  app.use(express.static(distPath, {
    maxAge: '1m', // Cache for only 1 minute
    etag: true,
  }));

  // fall through to index.html if the file doesn't exist
  // Always serve fresh HTML with no-cache to ensure latest app version
  app.use("*", (_req, res) => {
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
