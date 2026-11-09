import QRCode from "qrcode";
import { useEffect, useState } from "react";

export type JoinQr =
  | { status: "generando" }
  | { status: "listo"; src: string }
  | { status: "error" }; // HU-4.3 FA1: el PIN sigue visible y se puede reintentar

// Genera en el navegador la imagen del QR de una dirección (no se envía a ningún servicio)
export function useJoinQr(url: string): JoinQr & { retry: () => void } {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ key: string; src: string | null } | null>(null);
  // Cada dirección o reintento es una generación nueva; mientras no termine, se muestra "generando"
  const key = `${attempt}:${url}`;

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(url, { errorCorrectionLevel: "M", margin: 1, width: 480 }).then(
      (src) => active && setResult({ key, src }),
      () => active && setResult({ key, src: null }),
    );
    return () => {
      active = false;
    };
  }, [url, key]);

  const retry = () => setAttempt((current) => current + 1);
  if (result?.key !== key) return { status: "generando", retry };
  return result.src ? { status: "listo", src: result.src, retry } : { status: "error", retry };
}
