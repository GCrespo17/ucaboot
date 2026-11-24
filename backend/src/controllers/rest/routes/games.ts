import { Router } from "express";
import type { Container } from "../../../container.js";
import { AppError } from "../../../services/errors.js";
import { toCsv } from "../../../views/csv.js";
import { toAvgSeconds, toGameDetail, toGameSummary } from "../../../views/historyViews.js";
import { requireHost } from "../../middlewares/requireHost.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function gamesRouter(container: Container) {
  const router = Router();
  router.use(requireHost);

  router.get("/", async (_req, res) => {
    const games = await container.gameHistoryService.list(hostId(res));
    res.json({ games: games.map(toGameSummary) });
  });

  router.get("/:gameId/export.csv", async (req, res) => {
    const game = await container.gameHistoryService.get(hostId(res), ownedGameId(req.params.gameId));
    const day = game.finishedAt.toISOString().slice(0, 10);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="ucaboot-${day}.csv"`);
    res.send(
      toCsv(
        game.players.map((player) => ({
          rank: player.rank,
          nickname: player.nickname,
          totalScore: player.totalScore,
          correctCount: player.correctCount,
          answeredCount: player.answeredCount,
          avgResponseSeconds: toAvgSeconds(player.avgResponseMs),
        })),
      ),
    );
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
