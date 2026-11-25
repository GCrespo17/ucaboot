import { describe, expect, it } from "vitest";
import { detectImageType } from "../../src/domain/quiz/imageFile.js";

describe("detectImageType", () => {
  it("recognizes JPEG, PNG and WebP from the file bytes", () => {
    expect(detectImageType(Buffer.from([0xff, 0xd8, 0xff, 0, 0, 0, 0, 0, 0, 0, 0, 0]))).toBe("image/jpeg");
    expect(detectImageType(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]))).toBe("image/png");
    const webp = Buffer.alloc(12);
    webp.write("RIFF", 0, "ascii");
    webp.write("WEBP", 8, "ascii");
    expect(detectImageType(webp)).toBe("image/webp");
  });

  it("rejects a text file and a short buffer", () => {
    expect(detectImageType(Buffer.from("not an image!!"))).toBeNull();
    expect(detectImageType(Buffer.from([0xff, 0xd8]))).toBeNull();
  });
});
