import type { ImageType } from "../quiz/imageFile.js";

// Returns the URL that clients store on the quiz. remove and copy accept that same URL.
export interface FileStorage {
  put(bytes: Buffer, type: ImageType): Promise<string>;
  remove(url: string): Promise<void>;
  copy(url: string): Promise<string>;
}
