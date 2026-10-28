import { Router } from "express";
import { z } from "zod";
import type { Container } from "../../../container.js";
import { AppError } from "../../../services/errors.js";
import { toHostRoomSnapshot } from "../../../views/hostViews.js";
import { rateLimit } from "../../middlewares/rateLimit.js";
import { requireHost } from "../../middlewares/requireHost.js";

const createRoomBody = z.object({ quizId: z.string().min(1).max(100) });

export function roomsRouter(container: Container) {
  const router = Router();

  // The limit goes after requireHost: it counts per host id, not per IP
  const limitPerHost = rateLimit(container.limits.roomCreation, (_req, res) => String(res.locals.hostId));

  router.post("/", requireHost, limitPerHost, async (req, res) => {
    const body = createRoomBody.safeParse(req.body);
    if (!body.success) throw new AppError("VALIDATION_ERROR", "quizId is required");

    const { room, existing } = await container.roomService.createRoom(res.locals.hostId, body.data.quizId);
    res.status(existing ? 200 : 201).json({
      pin: room.pin,
      existing,
      room: toHostRoomSnapshot(room, container.clock.now()),
    });
  });

  return router;
}
