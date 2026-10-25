import type { PlayableQuiz } from "../../domain/quiz/playableQuiz.js";
import { ANY_OWNER, type SeededQuiz } from "./inMemoryQuizRepository.js";

const demoQuiz: PlayableQuiz = {
  quizId: "demo-quiz",
  title: "Cuestionario de prueba",
  coverUrl: null,
  questions: [
    {
      id: "q1",
      text: "¿Cuál es la capital de Francia?",
      imageUrl: null,
      timeLimitSeconds: 20,
      basePoints: 1000,
      options: [
        { id: "q1-o1", text: "París", isCorrect: true },
        { id: "q1-o2", text: "Roma", isCorrect: false },
        { id: "q1-o3", text: "Madrid", isCorrect: false },
        { id: "q1-o4", text: "Lisboa", isCorrect: false },
      ],
    },
    {
      id: "q2",
      text: "El sol es una estrella.",
      imageUrl: null,
      timeLimitSeconds: 10,
      basePoints: 500,
      options: [
        { id: "q2-o1", text: "Verdadero", isCorrect: true },
        { id: "q2-o2", text: "Falso", isCorrect: false },
      ],
    },
    {
      id: "q3",
      text: "¿Cuáles son números primos?",
      imageUrl: null,
      timeLimitSeconds: 5,
      basePoints: 2000,
      options: [
        { id: "q3-o1", text: "2", isCorrect: true },
        { id: "q3-o2", text: "4", isCorrect: false },
        { id: "q3-o3", text: "7", isCorrect: true },
        { id: "q3-o4", text: "9", isCorrect: false },
      ],
    },
  ],
};

const emptyQuiz: PlayableQuiz = {
  quizId: "empty-quiz",
  title: "Cuestionario vacío",
  coverUrl: null,
  questions: [],
};

export const seedQuizzes: readonly SeededQuiz[] = [
  { ownerId: ANY_OWNER, quiz: demoQuiz },
  { ownerId: ANY_OWNER, quiz: emptyQuiz },
];
