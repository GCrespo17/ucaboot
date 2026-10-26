import { describe, expect, it } from "vitest";
import { joinRoom } from "../../src/domain/game/lobby.js";
import { makeLobby, makeRoom, makeStartedRoom, T0, withPlayer } from "./fixtures.js";

const input = (nickname: string, playerId = "p1") => ({ playerId, token: `t-${playerId}`, nickname, now: T0 });

describe("joinRoom", () => {
  it("une al jugador y asigna joinOrder creciente", () => {
    const first = joinRoom(makeRoom(), input("Ana", "p1"));
    if (!first.ok) throw new Error("expected ok");
    const second = joinRoom(first.room, input("Beto", "p2"));
    if (!second.ok) throw new Error("expected ok");
    expect(first.player.joinOrder).toBe(1);
    expect(second.player.joinOrder).toBe(2);
    expect(second.room.players.map((p) => p.nickname)).toEqual(["Ana", "Beto"]);
  });

  it("guarda el apodo normalizado y su clave", () => {
    const result = joinRoom(makeRoom(), input("  Ana "));
    if (!result.ok) throw new Error("expected ok");
    expect(result.player.nickname).toBe("Ana");
    expect(result.player.nicknameKey).toBe("ana");
  });

  it("rechaza un apodo inválido", () => {
    expect(joinRoom(makeRoom(), input("a"))).toEqual({ ok: false, code: "NICKNAME_INVALID" });
  });

  it("rechaza un apodo repetido sin distinguir mayúsculas (FA5)", () => {
    const room = withPlayer(makeRoom(), "p1", "Ana");
    expect(joinRoom(room, input("ANA ", "p2"))).toEqual({ ok: false, code: "NICKNAME_TAKEN" });
  });

  it("rechaza con la sala llena (FA6)", () => {
    const room = withPlayer(withPlayer(makeRoom({ maxPlayers: 2 }), "p1", "Ana"), "p2", "Beto");
    expect(joinRoom(room, input("Carla", "p3"))).toEqual({ ok: false, code: "ROOM_FULL" });
  });

  it("rechaza con la partida comenzada (FA2)", () => {
    expect(joinRoom(makeStartedRoom(1), input("Nuevo", "p9"))).toEqual({
      ok: false,
      code: "GAME_ALREADY_STARTED",
    });
  });

  it("valida la fase antes que el apodo", () => {
    expect(joinRoom(makeStartedRoom(1), input("a", "p9"))).toEqual({
      ok: false,
      code: "GAME_ALREADY_STARTED",
    });
  });

  it("no muta la sala original", () => {
    const room = makeLobby(1);
    const snapshot = structuredClone(room);
    joinRoom(room, input("Nuevo", "p9"));
    expect(room).toEqual(snapshot);
  });
});
