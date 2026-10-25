export interface Player {
  id: string;
  // Join secret; views never expose it
  token: string;
  // Already normalized
  nickname: string;
  nicknameKey: string;
  // Increasing counter of the room, not the array index
  joinOrder: number;
  joinedAt: number;
}
