import type { Container } from "../../container.js";
import { AppError } from "../../services/errors.js";
import { toHostRoomSnapshot } from "../../views/hostViews.js";
import { handle } from "./ack.js";
import { hostWatchPayload } from "./schemas.js";
import type { GameSocket } from "./socket.js";

export const hostRoomName = (pin: string) => `pin:${pin}:host`;

export function registerHostHandlers(socket: GameSocket, container: Container): void {
  socket.on(
    "host:watch",
    handle(container.logger, hostWatchPayload, async ({ pin }) => {
      // The host id comes from the handshake, never from the payload
      const hostId = socket.data.hostId;
      if (!hostId) throw new AppError("UNAUTHORIZED");

      const room = await container.roomService.getHostRoom(hostId, pin);
      await socket.join(hostRoomName(pin));
      return toHostRoomSnapshot(room, container.clock.now());
    }),
  );
}
