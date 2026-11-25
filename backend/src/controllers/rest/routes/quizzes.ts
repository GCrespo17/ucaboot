import express, { Router } from "express";
import type { Container } from "../../../container.js";
import { AppError } from "../../../services/errors.js";
import { toQuestion, toQuizDetail, toQuizSummary } from "../../../views/quizViews.js";
import { requireHost } from "../../middlewares/requireHost.js";
import { parseCreateQuiz, parsePatchQuiz, parseQuestion, parseQuestionOrder } from "../quizInput.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const imageBody = express.raw({ limit: "2mb", type: () => true });

export function quizzesRouter(container: Container) {
  const router = Router();
  router.use(requireHost);

  router.get("/", async (_req, res) => {
    const quizzes = await container.quizService.list(hostId(res));
    res.json({ quizzes: quizzes.map(toQuizSummary) });
  });

  router.post("/", async (req, res) => {
    const body = parseCreateQuiz(req.body);
    if (!body.ok) throw new AppError("VALIDATION_ERROR", "Invalid request", { fields: body.fields });
    const quiz = await container.quizService.create(hostId(res), body.value);
    res.status(201).json(toQuizDetail(quiz));
  });

  router.get("/:quizId", async (req, res) => {
    const quiz = await container.quizService.get(hostId(res), ownedQuizId(req.params.quizId));
    res.json(toQuizDetail(quiz));
  });

  router.patch("/:quizId", async (req, res) => {
    const body = parsePatchQuiz(req.body);
    if (!body.ok) throw new AppError("VALIDATION_ERROR", "Invalid request", { fields: body.fields });
    const quiz = await container.quizService.update(hostId(res), ownedQuizId(req.params.quizId), body.value);
    res.json(toQuizDetail(quiz));
  });

  router.put("/:quizId/cover", imageBody, async (req, res) => {
    const bytes = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
    const quiz = await container.quizService.setCover(hostId(res), ownedQuizId(req.params.quizId), bytes);
    res.json(toQuizDetail(quiz));
  });

  router.delete("/:quizId/cover", async (req, res) => {
    const quiz = await container.quizService.clearCover(hostId(res), ownedQuizId(req.params.quizId));
    res.json(toQuizDetail(quiz));
  });

  router.post("/:quizId/duplicate", async (req, res) => {
    const quiz = await container.quizService.duplicate(hostId(res), ownedQuizId(req.params.quizId));
    res.status(201).json(toQuizDetail(quiz));
  });

  router.delete("/:quizId", async (req, res) => {
    await container.quizService.delete(hostId(res), ownedQuizId(req.params.quizId));
    res.status(204).send();
  });

  router.put("/:quizId/questions/order", async (req, res) => {
    const body = parseQuestionOrder(req.body);
    if (!body.ok) throw new AppError("VALIDATION_ERROR", "Invalid request", { fields: body.fields });
    const quiz = await container.quizService.reorder(hostId(res), ownedQuizId(req.params.quizId), body.value.questionIds);
    res.json(toQuizDetail(quiz));
  });

  router.put("/:quizId/questions/:questionId/image", imageBody, async (req, res) => {
    const bytes = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
    const question = await container.quizService.setQuestionImage(
      hostId(res),
      ownedQuizId(req.params.quizId),
      await ownedQuestionId(container, hostId(res), req.params.quizId, req.params.questionId),
      bytes,
    );
    res.json(toQuestion(question));
  });

  router.delete("/:quizId/questions/:questionId/image", async (req, res) => {
    const question = await container.quizService.clearQuestionImage(
      hostId(res),
      ownedQuizId(req.params.quizId),
      await ownedQuestionId(container, hostId(res), req.params.quizId, req.params.questionId),
    );
    res.json(toQuestion(question));
  });

  router.post("/:quizId/questions", async (req, res) => {
    const body = parseQuestion(req.body);
    if (!body.ok) throw new AppError("VALIDATION_ERROR", "Invalid request", { fields: body.fields });
    const question = await container.quizService.addQuestion(hostId(res), ownedQuizId(req.params.quizId), body.value);
    res.status(201).json(toQuestion(question));
  });

  router.patch("/:quizId/questions/:questionId", async (req, res) => {
    const body = parseQuestion(req.body);
    if (!body.ok) throw new AppError("VALIDATION_ERROR", "Invalid request", { fields: body.fields });
    const question = await container.quizService.updateQuestion(
      hostId(res),
      ownedQuizId(req.params.quizId),
      await ownedQuestionId(container, hostId(res), req.params.quizId, req.params.questionId),
      body.value,
    );
    res.json(toQuestion(question));
  });

  router.delete("/:quizId/questions/:questionId", async (req, res) => {
    await container.quizService.deleteQuestion(
      hostId(res),
      ownedQuizId(req.params.quizId),
      await ownedQuestionId(container, hostId(res), req.params.quizId, req.params.questionId),
    );
    res.status(204).send();
  });

  return router;
}

function hostId(res: { locals: { hostId?: string } }): string {
  return res.locals.hostId ?? "";
}

function ownedQuizId(quizId: string | string[]): string {
  const id = one(quizId);
  if (!UUID.test(id)) throw new AppError("QUIZ_NOT_FOUND", "Quiz not found");
  return id;
}

async function ownedQuestionId(
  container: Container,
  hostId: string,
  quizId: string | string[],
  questionId: string | string[],
): Promise<string> {
  const quiz = ownedQuizId(quizId);
  const id = one(questionId);
  if (UUID.test(id)) return id;
  await container.quizService.get(hostId, quiz);
  throw new AppError("QUESTION_NOT_FOUND", "Question not found");
}

function one(value: string | string[]): string {
  return Array.isArray(value) ? value[0] ?? "" : value;
}
