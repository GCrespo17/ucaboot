// Dirección de unión del participante (HU-4.3): /jugar con el PIN ya puesto.
// El QR solo completa el PIN; el participante igual elige su apodo y confirma (HU-5.1).

const PIN_PATTERN = /^\d{6}$/;

export function joinUrl(origin: string, pin: string): string {
  return `${origin}/jugar?pin=${encodeURIComponent(pin)}`;
}

// PIN que trae la dirección (?pin=042137). Cualquier otra cosa se ignora y el campo queda vacío.
export function pinFromSearch(search: string): string {
  const pin = new URLSearchParams(search).get("pin")?.trim() ?? "";
  return PIN_PATTERN.test(pin) ? pin : "";
}
