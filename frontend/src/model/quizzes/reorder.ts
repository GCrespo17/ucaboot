// HU-3.4: reglas para ordenar las preguntas antes de guardar. Funciones puras sobre los ids.

// Mueve el elemento de la posición from a la posición to. Fuera de rango, la lista queda igual.
export function moveItem<T>(list: readonly T[], from: number, to: number): T[] {
  if (from < 0 || from >= list.length || to < 0 || to >= list.length || from === to) return [...list];
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

// FA2: si el orden nuevo es el mismo que el guardado, no hay nada que escribir
export function sameOrder(a: readonly string[], b: readonly string[]) {
  return a.length === b.length && a.every((id, index) => id === b[index]);
}

// FA1: con menos de dos preguntas no se ofrece reordenar
export function canReorder(questionCount: number) {
  return questionCount >= 2;
}
