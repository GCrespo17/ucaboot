// Internal Socket.IO rooms; clients never see these names
export const hostRoomName = (pin: string) => `pin:${pin}:host`;
export const playersRoomName = (pin: string) => `pin:${pin}:players`;
export const playerRoomName = (playerId: string) => `player:${playerId}`;
