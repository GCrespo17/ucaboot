import { Router } from "express";
import type { Container } from "../../../container.js";
import { AppError } from "../../../services/errors.js";
import { toGameDetail, toGameSummary } from "../../../views/historyViews.js";
import { requireHost } from "../../middlewares/requireHost.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function gamesRouter(container: Container) {
  const router = Router();
  router.use(requireHost);

  router.get("/", async (_req, res) => {
    const games = await container.gameHistoryService.list(hostId(res));
    res.json({ games: games.map(toGameSummary) });
  });

  router.get("/:gameId", async (req, res) => {
    const game = await container.gameHistoryService.get(hostId(res), ownedGameId(req.params.gameId));
    res.json(toGameDetail(game));
  });

  return router;
}

function hostId(res: { locals: { hostId?: string } }): string {
  return res.locals.hostId ?? "";
}

function ownedGameId(gameId: string | string[]): string {
  const id = Array.isArray(gameId) ? gameId[0] ?? "" : gameId;
  if (!UUID.test(id)) throw new AppError("GAME_NOT_FOUND", "Game not found");
  return id.toLowerCase();
}
