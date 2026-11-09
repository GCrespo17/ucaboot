import QRCode from "qrcode";
import { describe, expect, it } from "vitest";
import { joinUrl, pinFromSearch } from "./joinUrl";

describe("joinUrl (HU-4.3)", () => {
  it("apunta a /jugar con el PIN de la sala", () => {
    expect(joinUrl("https://ucaboot.vercel.app", "042137")).toBe("https://ucaboot.vercel.app/jugar?pin=042137");
  });

  it("el mismo PIN da la misma dirección, y por eso el mismo QR", async () => {
    const url = joinUrl("http://localhost:8080", "042137");
    expect(url).toBe(joinUrl("http://localhost:8080", "042137"));
    const [a, b] = await Promise.all([QRCode.toString(url), QRCode.toString(url)]);
    expect(a).toBe(b);
  });
});

describe("pinFromSearch", () => {
  it("toma el PIN de la dirección", () => {
    expect(pinFromSearch("?pin=042137")).toBe("042137");
    expect(pinFromSearch("?pin=%20042137%20")).toBe("042137");
  });

  it("ignora lo que no sea un PIN de 6 dígitos", () => {
    expect(pinFromSearch("")).toBe("");
    expect(pinFromSearch("?pin=12345")).toBe("");
    expect(pinFromSearch("?pin=abcdef")).toBe("");
    expect(pinFromSearch("?pin=<script>")).toBe("");
  });
});
