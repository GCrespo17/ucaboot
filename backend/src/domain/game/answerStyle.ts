export const ANSWER_STYLES = [
  { color: "red", shape: "triangle" },
  { color: "blue", shape: "diamond" },
  { color: "yellow", shape: "circle" },
  { color: "green", shape: "square" },
] as const;

export type AnswerStyle = (typeof ANSWER_STYLES)[number];

export function answerStyle(optionIndex: number): AnswerStyle {
  const style = ANSWER_STYLES[optionIndex];
  if (!style) throw new RangeError(`No answer style for option index ${optionIndex}`);
  return style;
}
