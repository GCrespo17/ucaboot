import { describe, expect, it } from "vitest";
import type { Container } from "../../src/container.js";
import { registerHostHandlers } from "../../src/controllers/sockets/hostHandlers.js";
import { registerPlayerHandlers } from "../../src/controllers/sockets/playerHandlers.js";
import { JoinAttempts } from "../../src/controllers/sockets/joinAttempts.js";
import type { GameSocket } from "../../src/controllers/sockets/socket.js";
import { FixedWindowLimiter } from "../../src/infra/rateLimit/fixedWindowLimiter.js";
import { InMemoryQuizRepository } from "../../src/infra/repositories/inMemoryQuizRepository.js";
import { InMemoryRoomLock } from "../../src/infra/state/inMemoryRoomLock.js";
import { InMemoryRoomStateStore } from "../../src/infra/state/inMemoryRoomStateStore.js";
import { GameService } from "../../src/services/gameService.js";
import { PlayerService } from "../../src/services/playerService.js";
import { RoomService } from "../../src/services/roomService.js";
import type { Ack, HostRoomSnapshot, PlayerAnswerAck, SocketData } from "../../src/views/events.js";
import { T0, makeLobby, makeStartedRoom } from "../domain/fixtures.js";
import { FakeClock, ManualScheduler, RecordingNotifier, SequenceIdGenerator, SilentLogger } from "../services/fakes.js";

type Handler = (payload: unknown, ack?: (response: Ack<unknown>) => void) => Promise<void> | void;

function createFakeSocket(data: Partial<SocketData> = {}) {
  const handlers = new Map<string, Handler>();
  const joinedRooms: string[] = [];
  const socketData: SocketData = {
    hostId: data.hostId ?? null,
    player: data.player ?? null,
    clientIp: data.clientIp ?? "127.0.0.1",
  };
  const socket = {
    data: socketData,
    on(event: string, handler: Handler) {
      handlers.set(event, handler);
    },
    async join(room: string | string[]) {
      joinedRooms.push(...(Array.isArray(room) ? room : [room]));
    },
    async leave() {
      // no-op
    },
  } as unknown as GameSocket;

  async function invoke<T>(event: string, payload: unknown): Promise<Ack<T>> {
    const handler = handlers.get(event);
    if (!handler) throw new Error(`No handler registered for ${event}`);
    let response: Ack<T> | undefined;
    await handler(payload, (ack) => {
      response = ack as Ack<T>;
    });
    if (!response) throw new Error(`Handler for ${event} did not call ack`);
    return response;
  }

  return { socket, joinedRooms, invoke };
}

function buildTestContainer() {
  const clock = new FakeClock(T0);
  const logger = new SilentLogger();
  const ids = new SequenceIdGenerator();
  const lock = new InMemoryRoomLock();
  const scheduler = new ManualScheduler();
  const rooms = new InMemoryRoomStateStore();
  const notifier = new RecordingNotifier();
  const quizzes = new InMemoryQuizRepository([]);
  const roomService = new RoomService({ quizzes, rooms, lock, clock, ids });
  const playerService = new PlayerService({ rooms, lock, clock, ids, notifier });
  const gameService = new GameService({ rooms, lock, clock, scheduler, notifier });
  const joinAttempts = new JoinAttempts(new FixedWindowLimiter({ limit: 30, windowMs: 60_000, clock }));

  const container = {
    clock,
    logger,
    ids,
    lock,
    scheduler,
    quizzes,
    rooms,
    roomService,
    playerService,
    gameService,
    joinAttempts,
  } as unknown as Container;

  return { container, clock, rooms, notifier };
}

describe("socket handlers (HU-6.1 FA4 & HU-6.2)", () => {
  it("mantiene la ronda activa sin anfitrión conectado y permite retomar la proyección con host:watch (HU-6.1 FA4)", async () => {
    const { container, clock, rooms } = buildTestContainer();
    await rooms.insertIfAbsent(makeStartedRoom(2));

    // Player answers while no host socket is connected
    const playerSocket = createFakeSocket({ player: { pin: "123456", playerId: "p1" } });
    registerPlayerHandlers(playerSocket.socket, container);
    clock.set(T0 + 3_000);
    const answerAck = await playerSocket.invoke<PlayerAnswerAck>("player:answer", {
      questionIndex: 0,
      optionId: "a",
    });
    expect(answerAck).toEqual({ ok: true, data: { questionIndex: 0, optionId: "a" } });

    // Host reconnects on a new socket and resumes with host:watch
    const hostSocket = createFakeSocket({ hostId: "host1" });
    registerHostHandlers(hostSocket.socket, container);
    clock.set(T0 + 5_000);
    const watchAck = await hostSocket.invoke<HostRoomSnapshot>("host:watch", { pin: "123456" });

    expect(hostSocket.joinedRooms).toEqual(["pin:123456:host"]);
    expect(watchAck.ok).toBe(true);
    if (!watchAck.ok) throw new Error("expected ok");
    expect(watchAck.data.phase).toBe("question");
    expect(watchAck.data.question).toMatchObject({
      questionIndex: 0,
      closesAt: T0 + 10_000,
      serverNow: T0 + 5_000,
      answeredCount: 1,
      rosterSize: 2,
    });
  });

  it("rechaza host:start sin autenticación en el handshake con UNAUTHORIZED", async () => {
    const { container, rooms } = buildTestContainer();
    await rooms.insertIfAbsent(makeLobby(1));

    const socket = createFakeSocket({ hostId: null });
    registerHostHandlers(socket.socket, container);

    const ack = await socket.invoke<HostRoomSnapshot>("host:start", { pin: "123456" });
    expect(ack).toMatchObject({ ok: false, error: { code: "UNAUTHORIZED" } });
  });

  it("rechaza player:answer desde un socket que no se unió con NOT_JOINED (HU-6.2 FA4)", async () => {
    const { container, rooms } = buildTestContainer();
    await rooms.insertIfAbsent(makeStartedRoom(2));

    const socket = createFakeSocket({ player: null });
    registerPlayerHandlers(socket.socket, container);

    const ack = await socket.invoke<PlayerAnswerAck>("player:answer", {
      questionIndex: 0,
      optionId: "a",
    });
    expect(ack).toMatchObject({ ok: false, error: { code: "NOT_JOINED" } });
  });
});
