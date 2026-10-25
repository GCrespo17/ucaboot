import { randomBytes, randomInt, randomUUID } from "node:crypto";
import type { IdGenerator } from "../../domain/ports/IdGenerator.js";
import { pinFromRandom } from "../../domain/game/pin.js";

const PLAYER_TOKEN_BYTES = 24;

export class CryptoIdGenerator implements IdGenerator {
  playerId(): string {
    return randomUUID();
  }

  playerToken(): string {
    return randomBytes(PLAYER_TOKEN_BYTES).toString("base64url");
  }

  pin(): string {
    return pinFromRandom(randomInt);
  }
}
