import { Router } from "express";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { ImageType } from "../../../domain/quiz/imageFile.js";

const NAME = /^[\da-f-]{36}\.(jpg|png|webp)$/i;

export function filesRouter(directory: string) {
  const router = Router();

  router.get("/:name", async (req, res) => {
    const name = one(req.params.name);
    if (!NAME.test(name)) {
      res.status(404).json({ error: "NOT_FOUND", "message": "File not found" });
      return;
    }
    try {
      const bytes = await readFile(path.join(directory, name));
      res.setHeader("Content-Type", contentType(name));
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      res.send(bytes);
    } catch {
      res.status(404).json({ error: "NOT_FOUND", message: "File not found" });
    }
  });

  return router;
}

function contentType(name: string): ImageType {
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

function one(value: string | string[]): string {
  return Array.isArray(value) ? value[0] ?? "" : value;
}
