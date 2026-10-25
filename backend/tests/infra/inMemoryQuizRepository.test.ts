import { describe, expect, it } from "vitest";
import { InMemoryQuizRepository } from "../../src/infra/repositories/inMemoryQuizRepository.js";
import { seedQuizzes } from "../../src/infra/repositories/seedQuizzes.js";
import { isPlayableQuiz } from "../../src/domain/quiz/playableQuiz.js";
import { makeQuiz } from "../domain/fixtures.js";

describe("InMemoryQuizRepository", () => {
  it("debe devolver el cuestionario de su dueño", async () => {
    const repository = new InMemoryQuizRepository([{ ownerId: "host1", quiz: makeQuiz() }]);
    expect((await repository.findPlayableQuiz("quiz1", "host1"))?.quizId).toBe("quiz1");
  });

  it("debe devolver null si pertenece a otro anfitrión", async () => {
    const repository = new InMemoryQuizRepository([{ ownerId: "host1", quiz: makeQuiz() }]);
    expect(await repository.findPlayableQuiz("quiz1", "host2")).toBeNull();
  });

  it("debe devolver null si no existe", async () => {
    expect(await new InMemoryQuizRepository([]).findPlayableQuiz("x", "host1")).toBeNull();
  });

  it("debe devolver una copia que no altera la semilla", async () => {
    const repository = new InMemoryQuizRepository([{ ownerId: "*", quiz: makeQuiz() }]);
    const copy = await repository.findPlayableQuiz("quiz1", "anyone");
    if (!copy) throw new Error("quiz missing");
    copy.title = "changed";

    expect((await repository.findPlayableQuiz("quiz1", "anyone"))?.title).toBe("Geography");
  });

  it("debe ofrecer una semilla jugable y otra vacía", async () => {
    const repository = new InMemoryQuizRepository(seedQuizzes);
    const demo = await repository.findPlayableQuiz("demo-quiz", "any");
    const empty = await repository.findPlayableQuiz("empty-quiz", "any");

    expect(demo && isPlayableQuiz(demo)).toBe(true);
    expect(demo?.questions[2]?.options.filter((option) => option.isCorrect)).toHaveLength(2);
    expect(empty?.questions).toHaveLength(0);
  });
});
