import type { Server as HttpServer } from "node:http";
import { Server, type Socket } from "socket.io";
import { verifyAccessToken } from "../../auth/supabase.js";
import { env } from "../../config/env.js";
import type { ClientToServerEvents, ServerToClientEvents, SocketData } from "../../views/events.js";

export type GameServer = Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;
export type GameSocket = Socket<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;

export function createSocketServer(httpServer: HttpServer): GameServer {
  const io: GameServer = new Server(httpServer, {
    cors: env.CORS_ORIGINS.length > 0 ? { origin: env.CORS_ORIGINS } : undefined,
  });

  // Identifies the host by their Supabase access token, sent in the handshake.
  // Participants connect without one (hostId = null).
  io.use(async (socket, next) => {
    try {
      const token: unknown = socket.handshake.auth.token;
      socket.data.player = null;
      socket.data.hostId = typeof token === "string" && token ? await verifyAccessToken(token) : null;
      next();
    } catch (error) {
      next(error as Error);
    }
  });

  return io;
}
