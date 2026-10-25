import type { Container } from "../../container.js";
import { registerHostHandlers } from "./hostHandlers.js";
import type { GameServer } from "./socket.js";

export function registerSocketHandlers(io: GameServer, container: Container): void {
  io.on("connection", (socket) => {
    container.logger.info("socket connected", { socketId: socket.id });
    registerHostHandlers(socket, container);
  });
}
