import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { verifyAccessToken } from "../../auth/supabase.js";
import { env } from "../../config/env.js";

export function createSocketServer(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: env.CORS_ORIGINS.length > 0 ? { origin: env.CORS_ORIGINS } : undefined,
  });

  // Identifies the host by their Supabase access token, sent in the handshake.
  // Participants connect without one (hostId = null).
  io.use(async (socket, next) => {
    try {
      const token: unknown = socket.handshake.auth.token;
      socket.data.hostId = typeof token === "string" && token ? await verifyAccessToken(token) : null;
      next();
    } catch (error) {
      next(error as Error);
    }
  });

  return io;
}
