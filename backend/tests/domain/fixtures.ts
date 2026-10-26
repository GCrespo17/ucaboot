import type { PlayableQuestion, PlayableQuiz } from "../../src/domain/quiz/playableQuiz.js";
import type { Player } from "../../src/domain/game/model/player.js";
import type { Room } from "../../src/domain/game/model/room.js";
import { createRoom } from "../../src/domain/game/createRoom.js";
import { joinRoom } from "../../src/domain/game/lobby.js";
import { startGame } from "../../src/domain/game/gameFlow.js";

export const T0 = 1_000_000;

export function makeQuestion(overrides: Partial<PlayableQuestion> = {}): PlayableQuestion {
  return {
    id: "q1",
    text: "Capital of France?",
    imageUrl: null,
    timeLimitSeconds: 10,
    basePoints: 1000,
    options: [
      { id: "a", text: "Paris", isCorrect: true },
      { id: "b", text: "Rome", isCorrect: false },
      { id: "c", text: "Madrid", isCorrect: false },
    ],
    ...overrides,
  };
}

export function makeQuiz(questionCount = 2): PlayableQuiz {
  return {
    quizId: "quiz1",
    title: "Geography",
    coverUrl: null,
    questions: Array.from({ length: questionCount }, (_, i) => makeQuestion({ id: `q${i + 1}` })),
  };
}

export function makeRoom(overrides: { quiz?: PlayableQuiz; maxPlayers?: number } = {}): Room {
  const result = createRoom({
    pin: "123456",
    hostId: "host1",
    quiz: overrides.quiz ?? makeQuiz(),
    now: T0,
    maxPlayers: overrides.maxPlayers,
  });
  if (!result.ok) throw new Error(`fixture room failed: ${result.code}`);
  return result.room;
}

export function withPlayer(room: Room, playerId: string, nickname: string, now = T0): Room {
  const result = joinRoom(room, { playerId, token: `token-${playerId}`, nickname, now });
  if (!result.ok) throw new Error(`fixture join failed: ${result.code}`);
  return result.room;
}

// Lobby with players "p1".."pN" (nicknames "Player1".."PlayerN")
export function makeLobby(playerCount: number, quiz?: PlayableQuiz): Room {
  let room = makeRoom({ quiz });
  for (let i = 1; i <= playerCount; i++) room = withPlayer(room, `p${i}`, `Player${i}`);
  return room;
}

// Game started at T0 with players "p1".."pN"; question 0 is open
export function makeStartedRoom(playerCount = 2, quiz?: PlayableQuiz): Room {
  const result = startGame(makeLobby(playerCount, quiz), T0);
  if (!result.ok) throw new Error(`fixture start failed: ${result.code}`);
  return result.room;
}

export function playerOf(room: Room, playerId: string): Player {
  const player = room.players.find((candidate) => candidate.id === playerId);
  if (!player) throw new Error(`no player ${playerId}`);
  return player;
}
