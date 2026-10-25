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
      const { room, player } = await container.playerService.join(payload);

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
