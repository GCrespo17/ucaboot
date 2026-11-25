import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import type { FileStorage } from "../../domain/ports/FileStorage.js";
import { extensionFor, type ImageType } from "../../domain/quiz/imageFile.js";

const PUBLIC_PREFIX = "/api/files/";

export class LocalFileStorage implements FileStorage {
  constructor(private readonly directory: string) {}

  async put(bytes: Buffer, type: ImageType): Promise<string> {
    await mkdir(this.directory, { recursive: true });
    const name = `${randomUUID()}.${extensionFor(type)}`;
    await writeFile(path.join(this.directory, name), bytes);
    return `${PUBLIC_PREFIX}${name}`;
  }

  async remove(url: string): Promise<void> {
    const file = this.resolve(url);
    if (!file) return;
    await unlink(file).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== "ENOENT") throw error;
    });
  }

  async copy(url: string): Promise<string> {
    const file = this.resolve(url);
    if (!file) throw new Error("file url is not local");
    const bytes = await readFile(file);
    const type = typeFromName(file);
    return this.put(bytes, type);
  }

  private resolve(url: string): string | null {
    if (!url.startsWith(PUBLIC_PREFIX)) return null;
    const name = url.slice(PUBLIC_PREFIX.length);
    if (!/^[\da-f-]{36}\.(jpg|png|webp)$/i.test(name)) return null;
    return path.join(this.directory, name);
  }
}

function typeFromName(file: string): ImageType {
  if (file.endsWith(".png")) return "image/png";
  if (file.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}
