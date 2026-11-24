import { optionCounts } from "../game/roundSummary.js";
import type { Room } from "../game/model/room.js";
import { standings } from "../game/standings.js";
import type { PlayableQuestion } from "../quiz/playableQuiz.js";

export type EndReason = "completed" | "hostAbsent";

export interface RecordedOption {
  text: string;
  isCorrect: boolean;
  // null when the question was not presented: a zero would look like "nobody chose it"
  count: number | null;
}

export interface RecordedQuestion {
  position: number;
  text: string;
  presented: boolean;
  noAnswerCount: number | null;
  options: RecordedOption[];
}

export interface RecordedPlayer {
  nickname: string;
  rank: number;
  totalScore: number;
  correctCount: number;
  answeredCount: number;
  avgResponseMs: number | null;
  joinOrder: number;
}

// Immutable copy of a finished room. quizId is null when the live id is not a UUID
// (the in-memory seed), because the column references quizzes.id.
export interface GameRecord {
  roomKey: string;
  hostId: string;
  quizId: string | null;
  quizTitle: string;
  totalQuestions: number;
  presentedQuestions: number;
  playerCount: number;
  startedAt: Date;
  finishedAt: Date;
  endReason: EndReason;
  players: RecordedPlayer[];
  questions: RecordedQuestion[];
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function roomKeyOf(room: Room): string {
  return `${room.pin}:${room.createdAt}`;
}

// A question counts as presented only once its round is closed and scored.
// An open round (host left mid-question) is not presented: only what was already scored is kept.
export function buildGameRecord(room: Room, endReason: EndReason): GameRecord {
  if (!room.rosterIds) throw new Error("room has no roster");
  const questions = room.quiz.questions.map((question, index) => recordedQuestion(room, question, index));
  const presentedQuestions = questions.filter((question) => question.presented).length;
  return {
    roomKey: roomKeyOf(room),
    hostId: room.hostId,
    quizId: UUID.test(room.quiz.quizId) ? room.quiz.quizId.toLowerCase() : null,
    quizTitle: room.quiz.title,
    totalQuestions: room.quiz.questions.length,
    presentedQuestions,
    playerCount: room.rosterIds.length,
    startedAt: new Date(room.rounds[0]?.openedAt ?? room.createdAt),
    finishedAt: new Date(room.finishedAt ?? lastClosedAt(room) ?? room.createdAt),
    endReason,
    players: standings(room).map((player) => ({
      nickname: player.nickname,
      rank: player.rank,
      totalScore: player.totalScore,
      correctCount: player.correctCount,
      answeredCount: player.answeredCount,
      avgResponseMs: player.avgResponseMs === null ? null : Math.round(player.avgResponseMs),
      joinOrder: player.joinOrder,
    })),
    questions,
  };
}

function recordedQuestion(room: Room, question: PlayableQuestion, index: number): RecordedQuestion {
  const round = room.rounds[index];
  const presented = !!round && round.scores !== null;
  if (!presented || !round || !room.rosterIds) {
    return {
      position: index,
      text: question.text,
      presented: false,
      noAnswerCount: null,
      options: question.options.map((option) => ({
        text: option.text,
        isCorrect: option.isCorrect,
        count: null,
      })),
    };
  }
  const { counts, noAnswer } = optionCounts(round, question, room.rosterIds.length);
  return {
    position: index,
    text: question.text,
    presented: true,
    noAnswerCount: noAnswer,
    options: question.options.map((option) => ({
      text: option.text,
      isCorrect: option.isCorrect,
      count: counts[option.id] ?? 0,
    })),
  };
}

function lastClosedAt(room: Room): number | null {
  let latest: number | null = null;
  for (const round of room.rounds) {
    if (round.closedAt === null) continue;
    if (latest === null || round.closedAt > latest) latest = round.closedAt;
  }
  return latest;
}
