import type { CreatedRoom } from "../types/room";
import { apiFetch } from "./http";

// POST /api/rooms de docs/contrato-eventos.md (sección 2)
export function createRoom(quizId: string): Promise<CreatedRoom> {
  return apiFetch<CreatedRoom>("/api/rooms", { method: "POST", body: { quizId } });
}
