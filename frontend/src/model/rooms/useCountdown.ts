import { useEffect, useState } from "react";
import { secondsLeft } from "./game";

// Cuenta regresiva hasta closesAt (hora del servidor). Se recalcula con el reloj local más la
// diferencia con el servidor, así una pestaña dormida o recargada muestra el tiempo real (HU-6.1 FA2).
// limitSeconds es el tiempo de la pregunta: al abrirse una nueva, el primer cálculo usa la hora del
// último tic (puede ser de hace rato) y sin ese tope mostraría de más hasta el siguiente tic.
export function useCountdown(closesAt: number | null, offset: number, limitSeconds: number) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (closesAt === null) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [closesAt]);

  return closesAt === null ? 0 : Math.min(secondsLeft(closesAt, offset, now), limitSeconds);
}
