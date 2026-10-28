# Contrato de eventos

Acuerdo entre backend y frontend sobre los mensajes de la partida: REST para crear la sala y Socket.IO con *acks* para todo lo demás. Este documento es la **fuente de verdad**. Los tipos están duplicados en `backend/src/views/events.ts` (no hay carpeta `shared/`); la copia del frontend va en `frontend/src/model/types/`.

**Regla de cambios:** solo aditivos. No se renombra ni se cambia el tipo de un campo que alguien ya consume. Cualquier cambio en `events.ts` se hace en el mismo PR que su cambio aquí.

## 1. Convenciones

- Nombres `ámbito:acción` en camelCase. `host:*` y `player:*` los emite el cliente; el resto, el servidor.
- Todo evento entrante usa *ack* (`socket.emit(evento, payload, callback)`). La respuesta siempre tiene esta forma:

  ```ts
  type Ack<T> =
    | { ok: true; data: T }
    | { ok: false; error: { code: ErrorCode; message: string; details?: Record<string, unknown> } };
  ```

  `details` solo aparece donde la tabla de errores lo dice (por ejemplo, `pin` en `ALREADY_IN_OTHER_ROOM`).

- **Tiempos:** epoch en milisegundos del servidor. Cada payload con temporizador incluye `serverNow` para que el cliente mida el desfase (`offset = serverNow - Date.now()` al recibir) y calcule `restante = closesAt - (Date.now() + offset)`. El servidor es quien decide si una respuesta llegó a tiempo.
- `questionIndex` es la posición de la pregunta en el orden de la copia jugable, contando desde 0. `totalQuestions` es el largo de ese orden.
- **Colores y formas** por índice de opción: `0 → red/triangle`, `1 → blue/diamond`, `2 → yellow/circle`, `3 → green/square`.
- El **token** del participante nunca viaja en eventos de difusión, solo en el *ack* de su propio `player:join`.
- **Salas de Socket.IO** (internas, el cliente no las ve):
  - `pin:<pin>:host`: sockets del anfitrión dueño.
  - `pin:<pin>:players`: sockets de participantes de esa sala.
  - `player:<playerId>`: sockets de un participante (para su resultado personal).
- El **handshake** del anfitrión lleva `auth: { token: <token de Supabase> }`. El participante se conecta sin token.

## 2. REST

### `POST /api/rooms` (HU-4.1)

Requiere `Authorization: Bearer <token de Supabase>`.

```jsonc
// petición
{ "quizId": "demo-quiz" }

// 201: sala creada
{ "pin": "042137", "existing": false, "room": HostRoomSnapshot }

// 200: ya había una sala abierta de ESE cuestionario
{ "pin": "042137", "existing": true, "room": HostRoomSnapshot }
```

| Estado | `error` | Cuándo |
| --- | --- | --- |
| 400 | `VALIDATION_ERROR` | Falta `quizId` o no es string |
| 401 | `UNAUTHORIZED` | Sin token o token inválido |
| 404 | `QUIZ_NOT_FOUND` | No existe o es de otra cuenta (no se distingue) |
| 409 | `HOST_HAS_OPEN_ROOM` | Hay sala abierta de **otro** cuestionario. Incluye `{ pin, quizId, phase }` |
| 422 | `NO_VALID_QUESTIONS` | El cuestionario no tiene preguntas jugables |
| 503 | `PIN_UNAVAILABLE` | No se encontró PIN libre tras los reintentos |
| 500 | `INTERNAL` | Fallo al crear. No se publica PIN |

Cuerpo de error REST: `{ "error": "<código>", "message": "...", ...extra }`.

## 3. Eventos del cliente al servidor

| Evento | Quién | Payload | `data` del *ack* | HU |
| --- | --- | --- | --- | --- |
| `host:watch` | Anfitrión | `{ pin }` | `HostRoomSnapshot` | 4.2, 4.4 FA3, 6.1 FA2, 7.1 FA3 |
| `host:start` | Anfitrión | `{ pin }` | `HostRoomSnapshot` | 4.6 |
| `host:next` | Anfitrión | `{ pin, questionIndex }` (índice de la revelación que se cierra) | `HostRoomSnapshot` | 7.4 |
| `player:join` | Participante | `{ pin, nickname, token? }` | `{ token, playerId, nickname, room: PlayerRoomSnapshot }` | 5.1, 5.2 |
| `player:answer` | Participante | `{ questionIndex, optionId }` | `{ questionIndex, optionId }` | 6.2 |

Notas:

- `host:*` exige que el *handshake* traiga el token de Supabase y que su usuario sea el dueño de la sala. Si no, `UNAUTHORIZED` o `NOT_ROOM_HOST`.
- `host:watch` se llama después de `POST /api/rooms` y cada vez que la pantalla del anfitrión se monta o reconecta. Une el socket a `pin:<pin>:host`.
- `player:join` con `token` de una unión vigente devuelve al mismo jugador, aunque cambie el apodo escrito.
- Si el token pertenece a otra sala **ya comenzada**, el *ack* devuelve esa sala (su `room.pin` difiere del escrito) y el frontend redirige.
- `player:answer` usa la sala del socket (fijada en `player:join`); no lleva PIN. `questionIndex` evita que una pulsación vieja caiga en otra pregunta.
- `host:start` y `host:next` son idempotentes: si la sala ya comenzó, o ya no está en la revelación de `questionIndex`, responden `ok: true` con el estado vigente y no hacen nada más.

## 4. Eventos del servidor al cliente

| Evento | Destino | Payload | HU |
| --- | --- | --- | --- |
| `lobby:updated` | `pin:<pin>:host` | `{ players: PlayerSummary[], count, maxPlayers }` | 4.4 |
| `question:opened` | `pin:<pin>:host` | `HostQuestionView` | 6.1 |
| `question:opened` | `pin:<pin>:players` | `PlayerQuestionView` | 6.2 |
| `question:answerCount` | `pin:<pin>:host` | `{ questionIndex, answeredCount, rosterSize }` | 6.1 |
| `question:revealed` | `pin:<pin>:host` | `RevealView` | 6.3, 7.1 |
| `round:result` | `player:<playerId>` | `PlayerRoundResult` | 7.2 |
| `game:finished` | `pin:<pin>:host` | `FinalView` | 7.4 FA1 |
| `game:over` | `player:<playerId>` | `PlayerFinalResult` | 8.3 |
| `room:closed` | `pin:<pin>:players` | `{ reason: 'hostClosed' \| 'hostAbsent' }` | **Corte 2** (4.7, 10.2). Nombre reservado |
| `player:kicked` | `player:<playerId>` | `{}` | **Corte 2** (4.5, 5.4). Nombre reservado |

No hay `game:started`: `question:opened` de la primera pregunta es la señal de que la partida comenzó.

## 5. Tipos

```ts
type Phase = "lobby" | "question" | "reveal" | "final";
type AnswerColor = "red" | "blue" | "yellow" | "green";
type AnswerShape = "triangle" | "diamond" | "circle" | "square";

interface PlayerSummary { playerId: string; nickname: string }

interface HostQuestionView {
  questionIndex: number;
  totalQuestions: number;
  text: string;
  imageUrl: string | null;
  options: { id: string; text: string; color: AnswerColor; shape: AnswerShape }[];
  timeLimit: number;              // segundos
  closesAt: number;
  serverNow: number;
  answeredCount: number;
  rosterSize: number;
}

interface PlayerQuestionView {     // sin textos ni correctas
  questionIndex: number;
  totalQuestions: number;
  options: { id: string; color: AnswerColor; shape: AnswerShape }[];
  timeLimit: number;
  closesAt: number;
  serverNow: number;
  answered: boolean;              // true si ya tiene respuesta aceptada (recarga)
}

interface RevealView {
  questionIndex: number;
  totalQuestions: number;
  text: string;
  imageUrl: string | null;
  options: { id: string; text: string; color: AnswerColor; shape: AnswerShape; isCorrect: boolean; count: number }[];
  noAnswerCount: number;          // sum(count) + noAnswerCount === rosterSize
  rosterSize: number;
  isLastQuestion: boolean;
}

interface PlayerRoundResult {
  questionIndex: number;
  outcome: "correct" | "incorrect" | "noAnswer";
  isCorrect: boolean;             // false si no respondió
  scoreGained: number;
  totalScore: number;
  rank: number;
}

interface Standing { rank: number; playerId: string; nickname: string; totalScore: number }

interface FinalView { standings: Standing[]; totalPlayers: number }

interface PlayerFinalResult { nickname: string; totalScore: number; finalRank: number; totalPlayers: number }

interface HostRoomSnapshot {
  pin: string;
  phase: Phase;
  quiz: { title: string; coverUrl: string | null; totalQuestions: number };
  maxPlayers: number;
  players: PlayerSummary[];       // orden de entrada aceptada
  question: HostQuestionView | null;   // phase === "question"
  reveal: RevealView | null;           // phase === "reveal"
  final: FinalView | null;             // phase === "final"
  serverNow: number;
}

interface PlayerRoomSnapshot {
  pin: string;
  nickname: string;               // el apodo aceptado (normalizado), no el escrito
  phase: Phase;
  question: PlayerQuestionView | null;
  result: PlayerRoundResult | null;    // phase === "reveal"
  final: PlayerFinalResult | null;     // phase === "final"
  serverNow: number;
}
```

## 6. Códigos de error

| Código | Dónde | HU / FA |
| --- | --- | --- |
| `VALIDATION_ERROR` | Cualquier payload que no pasa la validación | — |
| `UNAUTHORIZED` | `host:*` sin anfitrión en el *handshake*; REST sin token | 4.1 FA5 |
| `NOT_ROOM_HOST` | `host:*` sobre una sala ajena | 4.1, 4.2 FA3 |
| `QUIZ_NOT_FOUND` | REST | 4.1 FA5 |
| `NO_VALID_QUESTIONS` | REST | 4.1 FA1 |
| `HOST_HAS_OPEN_ROOM` | REST | 4.1 FA3 |
| `PIN_UNAVAILABLE` | REST | 4.1 FA4 |
| `PIN_INVALID` | `player:join` sin 6 dígitos | 5.1 FA7 |
| `PIN_NOT_FOUND` | Sala inexistente, cerrada o terminada; también `host:watch` | 5.1 FA1, FA3; 4.2 FA2 |
| `GAME_ALREADY_STARTED` | `player:join` a sala ya comenzada | 5.1 FA2 |
| `NICKNAME_INVALID` | Apodo vacío o fuera de 2–20 caracteres visibles | 5.1 FA4 |
| `NICKNAME_TAKEN` | Duplicado sin distinguir mayúsculas | 5.1 FA5 |
| `ROOM_FULL` | Cupo alcanzado | 5.1 FA6 |
| `ALREADY_IN_OTHER_ROOM` | Token vigente de otra sala en lobby. Incluye `pin` | 5.1 FA9 |
| `NOT_JOINED` | `player:answer` desde un socket sin unión | 6.2 FA4 |
| `NO_PLAYERS` | `host:start` sin participantes | 4.6 FA1 |
| `TOO_LATE` | Respuesta con la recepción cerrada o de otra pregunta | 6.2 FA2 |
| `ALREADY_ANSWERED` | Segunda respuesta | 6.2 FA1, FA6 |
| `INVALID_OPTION` | `optionId` que no es de la pregunta | 6.2 FA3 |
| `NOT_IN_ROSTER` | Participante fuera de la lista fijada | 6.2 FA4 |
| `QUESTION_STILL_OPEN` | `host:next` con la recepción abierta | 7.4 FA3 |
| `RATE_LIMITED` | `player:join` desde una IP con 30 PIN fallidos (`PIN_INVALID` o `PIN_NOT_FOUND`) en 10 min. Incluye `retryAfterSeconds`. En REST, más de 300 peticiones/min por IP o 10 salas/min por anfitrión | — (seguridad) |
| `INTERNAL` | Excepción no prevista. El estado no cambia | FA de «fallo al…» |

## 7. Flujo de ejemplo

```
Anfitrión                         Servidor                          Participante
POST /api/rooms {quizId}   ─────▶ crea sala, PIN 042137
host:watch {pin}           ─────▶ ack HostRoomSnapshot(lobby)
                                  ◀───── player:join {pin, nickname}
                           ◀───── lobby:updated                ack {token, playerId, room}
host:start {pin}           ─────▶ fija lista, abre pregunta 0
                           ◀───── question:opened (host)       question:opened (player) ─────▶
                                  ◀───── player:answer {0, optionId}
                           ◀───── question:answerCount         ack ok
                                  todos respondieron o closesAt
                           ◀───── question:revealed            round:result ─────▶
host:next {pin, 0}         ─────▶ abre pregunta 1 … (repite)
host:next {pin, última}    ─────▶ final
                           ◀───── game:finished                game:over ─────▶
```

## 8. Compatibilidad con el frontend actual

`frontend/src/model/participant/participantReducer.ts` ya consume estos campos; mantienen nombre y significado:

| Acción del reducer | Evento | Campos |
| --- | --- | --- |
| `JOIN_ROOM { pin, nickname }` | *ack* de `player:join` | `room.pin`, `nickname` |
| `QUESTION_OPEN` | `question:opened` (participante) | `questionIndex`, `totalQuestions`, `timeLimit`, `closesAt` |
| `SUBMIT_ANSWER { optionId }` | `player:answer` | `optionId` (string) |
| `ROUND_RESULT` | `round:result` | `isCorrect`, `scoreGained`, `totalScore`, `rank` |
| `GAME_OVER` | `game:over` | `totalScore`, `finalRank`, `totalPlayers` |

Los campos adicionales (`options`, `serverNow`, `answered`, `outcome`, `nickname`, `token`…) son aditivos: el reducer los ignora hoy.
