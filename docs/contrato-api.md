# Contrato de API

Acuerdo entre backend y frontend sobre el CRUD de cuestionarios y preguntas del corte 1 (HU-2.1 a HU-2.5 y HU-3.1 a HU-3.3). Este documento es la **fuente de verdad** para mockear la biblioteca y el editor. Crear una sala (`POST /api/rooms`) no se redefine aquí: sigue en [`contrato-eventos.md`](contrato-eventos.md). Cuando los cuestionarios dejen el seed en memoria, el `quizId` de esa ruta será el `id` de este contrato.

Los tipos de TypeScript entran con las rutas, duplicados en `backend/src/views/` y `frontend/src/model/types/` (no hay carpeta `shared/`). Este documento no los agrega.

**Regla de cambios:** solo aditivos. No se renombra ni se cambia el tipo de un campo que alguien ya consume. Cualquier cambio de tipos se hace en el mismo PR que su cambio aquí.

## 1. Convenciones

- Todas las rutas exigen `Authorization: Bearer <token de Supabase>` y `Content-Type: application/json` cuando hay cuerpo. La sesión no viaja en cookies.
- El anfitrión es el usuario del token. `hostId` no aparece en el JSON.
- Un cuestionario de otra cuenta y uno inexistente responden igual: **404** `QUIZ_NOT_FOUND`. Estas rutas no responden 403.
- Si el cuestionario es de esta cuenta y la pregunta no está en él, **404** `QUESTION_NOT_FOUND`. Si el cuestionario no es de esta cuenta, manda `QUIZ_NOT_FOUND`: no se revela si la pregunta existe.
- Cuerpo de error, el mismo que ya usa el backend:

  ```json
  { "error": "QUIZ_NOT_FOUND", "message": "Quiz not found" }
  ```

  En validación se agrega `fields`. El cliente decide con `error` y `fields`. `message` es un texto corto en inglés para el log.

  ```json
  {
    "error": "VALIDATION_ERROR",
    "message": "Invalid request",
    "fields": {
      "title": "TOO_LONG",
      "options": "TOO_FEW",
      "options.1.text": "REQUIRED"
    }
  }
  ```

  Valores de `fields`: `REQUIRED`, `TOO_LONG`, `TOO_FEW`, `TOO_MANY`, `NONE_CORRECT`, `INVALID`. La clave es la ruta del campo (`options.1.text` es el texto de la segunda opción).
- Fechas en ISO-8601 UTC con milisegundos: `2026-10-25T22:15:00.000Z`.
- Los `id` son UUID en minúsculas, asignados por el servidor. El cliente no los envía al crear.
- El servidor recorta espacios de `title`, `description`, `text` de la pregunta y `text` de cada opción, y guarda el texto ya recortado. Los límites de abajo se miden después de recortar.
- Una `description` vacía tras recortar se guarda como `null`.
- Los campos que este documento no nombra se ignoran.
- `GET` sin resultados de lista responde **200** con `quizzes: []`. El **404** es solo de un `id` concreto.
- `DELETE` responde **204** sin cuerpo. Confirmar el borrado es de la pantalla: el API borra al recibir la petición.
- Un fallo no previsto es **500** `INTERNAL` con `{ "error": "INTERNAL", "message": "Unexpected error" }`. No incluye el error interno. Lo ya guardado no cambia.
- Sin token, o con un token inválido o vencido, cualquier ruta responde **401**:

  ```json
  { "error": "UNAUTHORIZED", "message": "Missing or invalid access token" }
  ```

- `coverUrl` e `imageUrl` viajan siempre y, en este corte, valen `null`. Subir imágenes es de corte 2.
- `position` de una opción fija el color y la forma, igual que en el contrato de eventos: `0 → red/triangle`, `1 → blue/diamond`, `2 → yellow/circle`, `3 → green/square`.
- En la partida, el contrato de eventos llama `timeLimit` a los segundos de la pregunta. Aquí el campo guardado se llama `timeLimitSeconds`.

## 2. Formas

```ts
interface QuizSummary {
  id: string;
  title: string;
  description: string | null;
  coverUrl: string | null; // null en este corte
  questionCount: number;
  updatedAt: string;
}

interface QuizDetail {
  id: string;
  title: string;
  description: string | null;
  coverUrl: string | null; // null en este corte
  questionCount: number;
  createdAt: string;
  updatedAt: string;
  questions: Question[]; // orden de juego: position 0, 1, 2…
}

interface Question {
  id: string;
  text: string;
  imageUrl: string | null; // null en este corte
  timeLimitSeconds: 5 | 10 | 15 | 20 | 30;
  basePoints: number;
  position: number; // 0 = primera de la partida
  options: Option[];
}

interface Option {
  id: string;
  text: string;
  isCorrect: boolean;
  position: number; // 0..3, color y forma
}
```

`questionCount` es `questions.length`. Crear, editar o borrar una pregunta mueve `updatedAt` del cuestionario. Un `PATCH` que no cambia nada no lo mueve.

## 3. Cuestionarios

### `GET /api/quizzes` (HU-2.2)

Lista solo los cuestionarios de esta cuenta, por `updatedAt` descendente.

```jsonc
// petición: sin cuerpo

// 200
{
  "quizzes": [
    {
      "id": "3f1c2a40-7b1e-4d0a-9c2e-1a6b0e4d8f21",
      "title": "Capitales",
      "description": "Preguntas de geografía",
      "coverUrl": null,
      "questionCount": 2,
      "updatedAt": "2026-10-25T22:15:00.000Z"
    }
  ]
}
```

| Estado | `error` | Cuándo |
| --- | --- | --- |
| 200 | — | Hay cuestionarios, o la cuenta no tiene ninguno (`quizzes: []`) |
| 401 | `UNAUTHORIZED` | Sin token o token inválido |
| 500 | `INTERNAL` | La lista no pudo leerse |

```json
{ "error": "UNAUTHORIZED", "message": "Missing or invalid access token" }
```

### `POST /api/quizzes` (HU-2.1)

Crea un cuestionario vacío, sin preguntas y sin portada.

```jsonc
// petición
{ "title": "  Capitales  ", "description": "Preguntas de geografía" }

// 201: el título guardado ya está recortado. questions queda vacío.
{
  "id": "3f1c2a40-7b1e-4d0a-9c2e-1a6b0e4d8f21",
  "title": "Capitales",
  "description": "Preguntas de geografía",
  "coverUrl": null,
  "questionCount": 0,
  "createdAt": "2026-10-25T22:15:00.000Z",
  "updatedAt": "2026-10-25T22:15:00.000Z",
  "questions": []
}
```

`description` puede omitirse o ir en `null`. Título de 1 a 80 caracteres. Descripción, si queda texto, hasta 500.

| Estado | `error` | Cuándo |
| --- | --- | --- |
| 201 | — | Cuestionario creado |
| 400 | `VALIDATION_ERROR` | Título vacío o textos fuera de límite |
| 401 | `UNAUTHORIZED` | Sin token o token inválido |
| 500 | `INTERNAL` | No se pudo guardar. No queda un cuestionario a medias |

```json
{
  "error": "VALIDATION_ERROR",
  "message": "Invalid request",
  "fields": { "title": "REQUIRED" }
}
```

`title` demasiado largo: `fields.title` es `TOO_LONG`. `description` de más de 500: `fields.description` es `TOO_LONG`.

### `GET /api/quizzes/:quizId` (HU-2.3)

Devuelve el cuestionario guardado, con las preguntas en orden de juego y las opciones completas de cada una.

```jsonc
// petición: sin cuerpo

// 200
{
  "id": "3f1c2a40-7b1e-4d0a-9c2e-1a6b0e4d8f21",
  "title": "Capitales",
  "description": "Preguntas de geografía",
  "coverUrl": null,
  "questionCount": 1,
  "createdAt": "2026-10-25T22:15:00.000Z",
  "updatedAt": "2026-10-25T22:20:00.000Z",
  "questions": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "text": "¿Cuál es la capital de Francia?",
      "imageUrl": null,
      "timeLimitSeconds": 20,
      "basePoints": 1000,
      "position": 0,
      "options": [
        { "id": "b1b2c3d4-e5f6-7890-abcd-ef1234567890", "text": "París", "isCorrect": true, "position": 0 },
        { "id": "c1b2c3d4-e5f6-7890-abcd-ef1234567890", "text": "Roma", "isCorrect": false, "position": 1 }
      ]
    }
  ]
}
```

| Estado | `error` | Cuándo |
| --- | --- | --- |
| 200 | — | El cuestionario es de esta cuenta |
| 401 | `UNAUTHORIZED` | Sin token o token inválido |
| 404 | `QUIZ_NOT_FOUND` | No existe o es de otra cuenta |
| 500 | `INTERNAL` | El detalle no pudo leerse |

```json
{ "error": "QUIZ_NOT_FOUND", "message": "Quiz not found" }
```

### `PATCH /api/quizzes/:quizId` (HU-2.4)

Cambia título y descripción. No toca preguntas, portada ni orden. Hay que enviar los dos campos; `description` puede ser `null`.

```jsonc
// petición
{ "title": "Capitales de Europa", "description": null }

// 200: el mismo QuizDetail de GET, con title nuevo y questions intacto
{
  "id": "3f1c2a40-7b1e-4d0a-9c2e-1a6b0e4d8f21",
  "title": "Capitales de Europa",
  "description": null,
  "coverUrl": null,
  "questionCount": 0,
  "createdAt": "2026-10-25T22:15:00.000Z",
  "updatedAt": "2026-10-25T22:30:00.000Z",
  "questions": []
}
```

Si el título y la descripción, ya recortados, son iguales a los guardados, la respuesta es **200** con el `QuizDetail` actual y el mismo `updatedAt`. No se vuelve a escribir.

| Estado | `error` | Cuándo |
| --- | --- | --- |
| 200 | — | Guardado, o no había cambio |
| 400 | `VALIDATION_ERROR` | Título vacío o textos fuera de límite. Sigue la versión anterior |
| 401 | `UNAUTHORIZED` | Sin token o token inválido |
| 404 | `QUIZ_NOT_FOUND` | No existe o es de otra cuenta |
| 500 | `INTERNAL` | No se pudo guardar. Sigue la versión anterior |

```json
{
  "error": "VALIDATION_ERROR",
  "message": "Invalid request",
  "fields": { "title": "TOO_LONG" }
}
```

Si falta la clave `description`, `fields.description` es `REQUIRED`. Un tipo que no sea string ni `null` es `INVALID`.

### `DELETE /api/quizzes/:quizId` (HU-2.5)

Elimina el cuestionario, sus preguntas y sus opciones.

```jsonc
// petición: sin cuerpo

// 204: sin cuerpo
```

| Estado | `error` | Cuándo |
| --- | --- | --- |
| 204 | — | Eliminado |
| 401 | `UNAUTHORIZED` | Sin token o token inválido |
| 404 | `QUIZ_NOT_FOUND` | No existe o es de otra cuenta. No se borra nada |
| 500 | `INTERNAL` | No se pudo eliminar. El cuestionario sigue completo |

```json
{ "error": "QUIZ_NOT_FOUND", "message": "Quiz not found" }
```

El historial de partidas ya guardadas es de corte 2 y no forma parte de esta respuesta.

## 4. Preguntas

El cuerpo de alta y el de edición son el mismo. No lleva `id` ni `position`. Las filas que el formulario dejó vacías no se envían: un `text` vacío es un error, el servidor no descarta la opción.

Puede haber más de una opción correcta, incluidas todas. El participante, en la partida, elige una sola.

```jsonc
// petición de POST y de PATCH
{
  "text": "¿Cuál es la capital de Francia?",
  "timeLimitSeconds": 20,
  "basePoints": 1000,
  "options": [
    { "text": "París", "isCorrect": true },
    { "text": "Roma", "isCorrect": false }
  ]
}
```

| Campo | Regla |
| --- | --- |
| `text` | Obligatorio, de 1 a 200 caracteres tras recortar |
| `timeLimitSeconds` | `5`, `10`, `15`, `20` o `30`. Si la clave no viene, el servidor usa 20. `null` u otro valor es `INVALID` |
| `basePoints` | Entero de 100 a 2000. Si la clave no viene, el servidor usa 1000. Un decimal o un valor fuera de rango es `INVALID` |
| `options` | De 2 a 4 elementos. Menos es `TOO_FEW`, más es `TOO_MANY` |
| `options.N.text` | Obligatorio, de 1 a 80 caracteres tras recortar |
| `options.N.isCorrect` | Boolean. Si ninguna opción viene en `true`, `fields.options` es `NONE_CORRECT` |

Si faltan `text` u `options`, el campo correspondiente es `REQUIRED`.

### `POST /api/quizzes/:quizId/questions` (HU-3.1)

Agrega la pregunta al final del orden. O se guarda completa, con sus opciones, o no se crea.

```jsonc
// 201
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "text": "¿Cuál es la capital de Francia?",
  "imageUrl": null,
  "timeLimitSeconds": 20,
  "basePoints": 1000,
  "position": 0,
  "options": [
    { "id": "b1b2c3d4-e5f6-7890-abcd-ef1234567890", "text": "París", "isCorrect": true, "position": 0 },
    { "id": "c1b2c3d4-e5f6-7890-abcd-ef1234567890", "text": "Roma", "isCorrect": false, "position": 1 }
  ]
}
```

`position` de la pregunta nueva es el `questionCount` que el cuestionario tenía antes de esta alta. `updatedAt` del cuestionario avanza.

| Estado | `error` | Cuándo |
| --- | --- | --- |
| 201 | — | Pregunta creada al final |
| 400 | `VALIDATION_ERROR` | Algún campo no cumple la tabla. No queda una pregunta parcial |
| 401 | `UNAUTHORIZED` | Sin token o token inválido |
| 404 | `QUIZ_NOT_FOUND` | El cuestionario no existe o es de otra cuenta |
| 500 | `INTERNAL` | No se pudo guardar. El cuestionario queda como estaba |

```json
{
  "error": "VALIDATION_ERROR",
  "message": "Invalid request",
  "fields": { "options": "NONE_CORRECT" }
}
```

### `PATCH /api/quizzes/:quizId/questions/:questionId` (HU-3.2)

Reemplaza el contenido de esa pregunta y conserva su `position`. El conjunto de opciones se sustituye entero: los `id` de las opciones de la respuesta son nuevos. El `id` de la pregunta no cambia. `imageUrl` sigue en `null` en este corte.

```jsonc
// 200: la misma forma que el 201 del alta, con el position que ya tenía
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "text": "¿Cuál es la capital de Francia?",
  "imageUrl": null,
  "timeLimitSeconds": 30,
  "basePoints": 500,
  "position": 0,
  "options": [
    { "id": "d1b2c3d4-e5f6-7890-abcd-ef1234567890", "text": "París", "isCorrect": true, "position": 0 },
    { "id": "e1b2c3d4-e5f6-7890-abcd-ef1234567890", "text": "Lyon", "isCorrect": false, "position": 1 }
  ]
}
```

Si el texto, el tiempo, el puntaje y las opciones (texto, marca y orden) coinciden con lo guardado, la respuesta es **200** con la pregunta actual, los mismos `id` de opciones y sin mover `updatedAt` del cuestionario.

| Estado | `error` | Cuándo |
| --- | --- | --- |
| 200 | — | Pregunta reemplazada, o no había cambio |
| 400 | `VALIDATION_ERROR` | Algún campo no cumple la tabla. Sigue la versión anterior |
| 401 | `UNAUTHORIZED` | Sin token o token inválido |
| 404 | `QUIZ_NOT_FOUND` | El cuestionario no existe o es de otra cuenta |
| 404 | `QUESTION_NOT_FOUND` | El cuestionario es de esta cuenta y la pregunta no está en él |
| 500 | `INTERNAL` | No se pudo guardar. Sigue la versión anterior |

```json
{ "error": "QUESTION_NOT_FOUND", "message": "Question not found" }
```

### `DELETE /api/quizzes/:quizId/questions/:questionId` (HU-3.3)

Elimina la pregunta y sus opciones. Las preguntas que iban después bajan una posición: el orden restante queda en `0..n-1`, sin huecos. Si era la única, el cuestionario queda con `questionCount: 0`.

```jsonc
// petición: sin cuerpo

// 204: sin cuerpo
```

El cliente vuelve a pedir `GET /api/quizzes/:quizId` para ver las posiciones nuevas, o quita esa pregunta y renumerá las siguientes desde 0.

| Estado | `error` | Cuándo |
| --- | --- | --- |
| 204 | — | Pregunta eliminada y orden compactado |
| 401 | `UNAUTHORIZED` | Sin token o token inválido |
| 404 | `QUIZ_NOT_FOUND` | El cuestionario no existe o es de otra cuenta. No se borra nada |
| 404 | `QUESTION_NOT_FOUND` | El cuestionario es de esta cuenta y la pregunta no está en él. No se borra nada |
| 500 | `INTERNAL` | No se pudo eliminar. La pregunta y el orden siguen igual |

```json
{ "error": "QUESTION_NOT_FOUND", "message": "Question not found" }
```

## 5. Códigos de error

| Código | Estado | Dónde |
| --- | --- | --- |
| `VALIDATION_ERROR` | 400 | Cuerpo que no cumple las reglas de esta página. Incluye `fields` |
| `UNAUTHORIZED` | 401 | Sin token, token inválido o token vencido |
| `QUIZ_NOT_FOUND` | 404 | El cuestionario no existe o es de otra cuenta |
| `QUESTION_NOT_FOUND` | 404 | La pregunta no pertenece a un cuestionario de esta cuenta |
| `INTERNAL` | 500 | Fallo no previsto. Los datos guardados no cambian |

`QUESTION_NOT_FOUND` todavía no está en `backend/src/services/errors.ts`. Se agrega en el PR de las rutas.

## 6. Fuera de este contrato (corte 2)

Estas historias no tienen ruta aquí. El editor de corte 1 no las llama.

- HU-2.6, portada. `coverUrl` llega en `null`.
- HU-2.7, duplicar un cuestionario.
- HU-2.8, vista previa. No crea sala ni puntaje.
- HU-2.9, rechazar edición o borrado mientras hay una partida abierta de ese cuestionario.
- HU-3.4, reordenar preguntas. En este corte el orden lo fijan el alta (al final) y el borrado (compacta).
- HU-3.5, imagen de la pregunta. `imageUrl` llega en `null`.

## 7. De la biblioteca a la sala

```
Anfitrión                                      API
POST /api/quizzes {title}               ─────▶ 201 QuizDetail (questions: [])
GET  /api/quizzes                       ─────▶ 200 { quizzes }
POST /api/quizzes/:id/questions {…}     ─────▶ 201 Question al final
GET  /api/quizzes/:id                   ─────▶ 200 QuizDetail
PATCH …/questions/:questionId {…}       ─────▶ 200 Question en la misma position
DELETE …/questions/:questionId          ─────▶ 204 y el orden se compacta
POST /api/rooms {quizId}                ─────▶ contrato de eventos (HU-4.1)
DELETE /api/quizzes/:id                 ─────▶ 204
```

`POST /api/rooms` con un cuestionario sin preguntas jugables sigue respondiendo **422** `NO_VALID_QUESTIONS`, como ya dice el contrato de eventos. Un cuestionario recién creado todavía no puede abrir sala.
