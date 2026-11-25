import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { FileStorage } from "../../domain/ports/FileStorage.js";
import { extensionFor, type ImageType } from "../../domain/quiz/imageFile.js";

export class SupabaseFileStorage implements FileStorage {
  private readonly client: SupabaseClient;

  constructor(
    supabaseUrl: string,
    serviceRoleKey: string,
    private readonly bucket: string,
  ) {
    this.client = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  async put(bytes: Buffer, type: ImageType): Promise<string> {
    const name = `${randomUUID()}.${extensionFor(type)}`;
    const uploaded = await this.client.storage.from(this.bucket).upload(name, bytes, {
      contentType: type,
      upsert: false,
    });
    if (uploaded.error) throw uploaded.error;
    return this.client.storage.from(this.bucket).getPublicUrl(name).data.publicUrl;
  }

  async remove(url: string): Promise<void> {
    const name = this.objectName(url);
    if (!name) return;
    const removed = await this.client.storage.from(this.bucket).remove([name]);
    if (removed.error) throw removed.error;
  }

  async copy(url: string): Promise<string> {
    const name = this.objectName(url);
    if (!name) throw new Error("file url is not in the storage bucket");
    const downloaded = await this.client.storage.from(this.bucket).download(name);
    if (downloaded.error || !downloaded.data) throw downloaded.error ?? new Error("empty file");
    const bytes = Buffer.from(await downloaded.data.arrayBuffer());
    const type = typeFromName(name);
    return this.put(bytes, type);
  }

  private objectName(url: string): string | null {
    const marker = `/object/public/${this.bucket}/`;
    const index = url.indexOf(marker);
    if (index < 0) return null;
    return decodeURIComponent(url.slice(index + marker.length));
  }
}

function typeFromName(name: string): ImageType {
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}
