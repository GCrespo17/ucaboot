import { describe, expect, it } from "vitest";
import type { HostRoomSnapshot } from "../types/room";
import { applyLobbyUpdate, lostRoomMessage } from "./lobby";

const room: HostRoomSnapshot = {
  pin: "042137",
  phase: "lobby",
  quiz: { title: "Capitales", coverUrl: null, totalQuestions: 3 },
  maxPlayers: 50,
  players: [{ playerId: "p1", nickname: "Ana" }],
  serverNow: 0,
};

describe("applyLobbyUpdate", () => {
  it("reemplaza la lista con la que manda el servidor (HU-4.4)", () => {
    const players = [
      { playerId: "p1", nickname: "Ana" },
      { playerId: "p2", nickname: "Beto" },
    ];
    expect(applyLobbyUpdate(room, { players, count: 2, maxPlayers: 40 })).toEqual({
      ...room,
      players,
      maxPlayers: 40,
    });
  });

  it("no modifica la sala anterior", () => {
    applyLobbyUpdate(room, { players: [], count: 0, maxPlayers: 50 });
    expect(room.players).toHaveLength(1);
  });
});

describe("lostRoomMessage", () => {
  it("explica por qué ya no se puede mostrar la sala", () => {
    expect(lostRoomMessage("PIN_NOT_FOUND")).toBe("Esa sala ya no está abierta.");
    expect(lostRoomMessage("NOT_ROOM_HOST")).toBe("Esa sala es de otra cuenta.");
    expect(lostRoomMessage("UNAUTHORIZED")).toMatch(/sesión venció/);
  });

  it("no da por perdida la sala ante errores pasajeros", () => {
    expect(lostRoomMessage("RATE_LIMITED")).toBeNull();
    expect(lostRoomMessage("INTERNAL")).toBeNull();
  });
});
