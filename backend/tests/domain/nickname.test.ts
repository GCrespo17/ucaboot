import { describe, expect, it } from "vitest";
import {
  isValidNickname,
  nicknameKey,
  normalizeNickname,
  visibleLength,
} from "../../src/domain/game/nickname.js";

describe("nickname", () => {
  it("recorta espacios al normalizar", () => {
    expect(normalizeNickname("  Ana  ")).toBe("Ana");
  });

  it("normaliza a NFC", () => {
    expect(normalizeNickname("é")).toBe("é");
  });

  it("1 carácter es inválido", () => {
    expect(isValidNickname("a")).toBe(false);
  });

  it("2 caracteres es válido", () => {
    expect(isValidNickname("ab")).toBe(true);
  });

  it("20 caracteres es válido", () => {
    expect(isValidNickname("a".repeat(20))).toBe(true);
  });

  it("21 caracteres es inválido", () => {
    expect(isValidNickname("a".repeat(21))).toBe(false);
  });

  it("solo espacios es inválido una vez normalizado", () => {
    expect(isValidNickname(normalizeNickname("     "))).toBe(false);
  });

  it("un emoji compuesto cuenta como un carácter visible", () => {
    const family = "👨‍👩‍👧‍👦";
    expect(visibleLength(family)).toBe(1);
    expect(isValidNickname(`${family}${family}`)).toBe(true);
    expect(isValidNickname(family)).toBe(false);
  });

  it("'Ana' y 'ana ' tienen la misma clave", () => {
    expect(nicknameKey("Ana")).toBe(nicknameKey("ana "));
  });
});
