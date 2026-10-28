import type { Server as HttpServer } from "node:http";
import { Server, type Socket } from "socket.io";
import { verifyAccessToken } from "../../auth/supabase.js";
import { env } from "../../config/env.js";
import type { ClientToServerEvents, ServerToClientEvents, SocketData } from "../../views/events.js";
import { clientIp } from "./clientIp.js";

export type GameServer = Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;
export type GameSocket = Socket<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;

// Game events are a few hundred bytes; the default (1 MB) would let a client push big frames
const MAX_MESSAGE_BYTES = 16 * 1024;

export function createSocketServer(httpServer: HttpServer): GameServer {
  const io: GameServer = new Server(httpServer, {
    cors: env.CORS_ORIGINS.length > 0 ? { origin: env.CORS_ORIGINS } : undefined,
    maxHttpBufferSize: MAX_MESSAGE_BYTES,
  });

  // Identifies the host by their Supabase access token, sent in the handshake.
  // Participants connect without one (hostId = null).
  io.use(async (socket, next) => {
    try {
      const token: unknown = socket.handshake.auth.token;
      socket.data.player = null;
      socket.data.clientIp = clientIp(
        socket.handshake.address,
        socket.handshake.headers["x-forwarded-for"],
        env.TRUST_PROXY_HOPS,
      );
      socket.data.hostId = typeof token === "string" && token ? await verifyAccessToken(token) : null;
      next();
    } catch (error) {
      next(error as Error);
    }
  });

  return io;
}
