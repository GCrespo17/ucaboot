export interface IdGenerator {
  playerId(): string;
  // Secret, not guessable
  playerToken(): string;
  // 6-digit candidate; uniqueness is enforced by RoomStateStore.insertIfAbsent
  pin(): string;
}
