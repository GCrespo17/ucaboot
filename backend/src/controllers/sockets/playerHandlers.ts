import type { Container } from "../../container.js";
import { toPlayerRoomSnapshot } from "../../views/playerViews.js";
import { handle } from "./ack.js";
import { playerRoomName, playersRoomName } from "./roomNames.js";
import { playerJoinPayload } from "./schemas.js";
import type { GameSocket } from "./socket.js";

export function registerPlayerHandlers(socket: GameSocket, container: Container): void {
  socket.on(
    "player:join",
    handle(container.logger, playerJoinPayload, async (payload) => {
      const ip = socket.data.clientIp;
      container.joinAttempts.assertAllowed(ip);

      let joined;
      try {
        joined = await container.playerService.join(payload);
      } catch (error) {
        container.joinAttempts.recordFailure(ip, error);
        throw error;
      }
      const { room, player } = joined;

      await leavePreviousRooms(socket);
      socket.data.player = { pin: room.pin, playerId: player.id };
      await socket.join([playersRoomName(room.pin), playerRoomName(player.id)]);

      return {
        token: player.token,
        playerId: player.id,
        nickname: player.nickname,
        room: toPlayerRoomSnapshot(room, player, container.clock.now()),
      };
    }),
  );
}

async function leavePreviousRooms(socket: GameSocket): Promise<void> {
  const previous = socket.data.player;
  if (!previous) return;
  await socket.leave(playersRoomName(previous.pin));
  await socket.leave(playerRoomName(previous.playerId));
}
