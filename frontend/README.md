# Ucaboot · Frontend

Aplicación React + Vite en TypeScript. Las decisiones de arquitectura están en [`docs/arquitectura_inicial.md`](../docs/arquitectura_inicial.md) (sección 5) y la estructura de carpetas en el [README](../README.md#frontend).

## Arquitectura: MVVM con hooks

| Capa | En el código |
| --- | --- |
| View | `features/<área>/XView.tsx`: solo presentación |
| ViewModel | `features/<área>/useXViewModel.ts`: estado derivado y acciones de la pantalla |
| Model | `model/`: clientes de API, Socket.IO y Supabase, stores y tipos |

Una View importa su ViewModel y componentes de `ui/`. Un ViewModel importa de `model/`. `model/` nunca importa componentes. Una pantalla sin estado ni acciones (como el inicio) no necesita ViewModel.

`app/` contiene lo que une la aplicación: router, providers y layouts.

## Rutas

| Ruta | Pantalla | Sesión |
| --- | --- | --- |
| `/` | Inicio: unirse a una partida o entrar como anfitrión | Pública |
| `/login`, `/registro` | Inicio de sesión y registro del anfitrión | Pública |
| `/jugar` | Unirse a una partida con PIN y apodo | Pública |
| `/anfitrion/cuestionarios` | Biblioteca de cuestionarios | Anfitrión |
| `/anfitrion/cuestionarios/:quizId` | Editor de un cuestionario | Anfitrión |
| `/anfitrion/sala/:pin` | Lobby y partida proyectada | Anfitrión |

## Autenticación del anfitrión

El anfitrión se registra e inicia sesión con Supabase Auth desde el navegador (HU-1.1 a HU-1.3). El backend no maneja contraseñas: solo verifica el token que el frontend le envía en `Authorization: Bearer …` y en el handshake del socket.

| Pieza | Dónde | Qué hace |
| --- | --- | --- |
| Cliente | `model/auth/supabase.ts` | Cliente de Supabase y `getAccessToken()`. Es `null` si falta `VITE_SUPABASE_ANON_KEY` |
| Sesión | `model/auth/session.ts` | `useSession()`: `cargando`, `activa` o `cerrada`. Se entera de cambios en otras pestañas |
| Operaciones | `model/auth/authService.ts` | `signIn`, `signUp` y `signOut`, con errores traducidos (`authErrors.ts`) |
| Reglas | `model/auth/credentials.ts` | Esquemas zod con la política de correo y contraseña de las specs |
| Guardias | `app/guards.tsx` | `RequireHost` protege `/anfitrion/*` y `RedirectIfHost` saca de `/login` y `/registro` a quien ya tiene sesión |

Sin sesión, `/anfitrion/*` lleva al login y, al entrar, vuelve a la pantalla pedida. Si la sesión se cierra estando adentro (botón Salir, otra pestaña o sesión vencida), lleva al inicio público.

El Auth local de Docker Compose crea la cuenta sin confirmar el correo. En el proyecto de Supabase en la nube hay que desactivar **Confirm email** (Authentication → Sign In / Providers → Email) para que el registro entre directo, como pide la HU-1.1. Si queda activo, el registro avisa que se envió un correo de confirmación.

## Acceso al API

Toda llamada al backend pasa por `apiFetch()` (`model/api/http.ts`): agrega `VITE_API_URL` y el token del anfitrión, y convierte el cuerpo de error del contrato (`{ error, message, fields }`) en un `ApiError` con `status`, `code` y `fields`. Un fallo de red llega como `status: 0`.

| Capa | Dónde | Qué hace |
| --- | --- | --- |
| Tipos | `model/types/quiz.ts` | Formas de [`docs/contrato-api.md`](../docs/contrato-api.md), copiadas del contrato |
| Rutas | `model/api/quizzes.ts` | Una función por ruta: `listQuizzes`, `getQuiz`, `createQuiz`, `updateQuiz`, `deleteQuiz` |
| Caché | `model/quizzes/quizQueries.ts` | Hooks de TanStack Query (`useQuizzes`, `useQuiz` y mutaciones) que actualizan la lista y el detalle al guardar |

Reglas comunes, en `app/AppProviders.tsx`:

- Un **401** cierra la sesión local y `RequireHost` saca al anfitrión de sus pantallas.
- Un error **4xx** no se reintenta; la red caída o un **5xx** se reintenta una vez.
- Al cerrar sesión se vacía la caché, así otra cuenta en el mismo navegador no ve datos de la anterior.

## Biblioteca de cuestionarios

`features/library/` cubre HU-2.1 a HU-2.5: la lista en `/anfitrion/cuestionarios` (crear y eliminar) y el detalle en `/anfitrion/cuestionarios/:quizId` (ver preguntas, editar título y descripción, eliminar). Un cuestionario inexistente o de otra cuenta vuelve a la lista con un aviso. Crear, editar y borrar preguntas (HU-3.1 a HU-3.3) llega con el editor.

## Scripts

```bash
npm ci          # instala dependencias exactas del lock
npm run dev     # servidor de Vite (lo levanta docker compose; necesita FRONTEND_PORT)
npm run lint    # ESLint
npm run build   # tsc -b (chequeo de tipos) + build de producción en dist/
npm test        # Vitest
```

En local lo normal es levantar todo con `docker compose up --build -d` desde la raíz y abrir http://localhost:8080.

## Variables de entorno

Vite **incrusta** las variables `VITE_*` en el build: son públicas y nunca deben contener secretos. Cambiarlas exige volver a construir.

| Variable | Qué es | Si no se define |
| --- | --- | --- |
| `VITE_API_URL` | URL pública del backend (REST y Socket.IO) | Mismo origen (`/api`, `/socket.io` vía nginx) |
| `VITE_SUPABASE_URL` | URL del proyecto de Supabase | Mismo origen (`/auth/v1` vía nginx) |
| `VITE_SUPABASE_ANON_KEY` | Clave pública (*anon*) del proyecto de Supabase | La app carga, pero el inicio de sesión queda deshabilitado |

En local las pasa Docker Compose desde el `.env` de la raíz. Para un despliegue fuera de Compose, la plantilla es [`.env.example`](.env.example).

## Despliegue en Vercel

El frontend compilado son archivos estáticos, así que se publica en Vercel (hosting estático + CDN, modelo PaaS) y el backend va aparte, en Render. Con dominios distintos, el frontend apunta al backend con `VITE_API_URL` y el backend permite ese origen con `CORS_ORIGINS`. nginx queda para el entorno local.

Configuración del proyecto en Vercel:

| Opción | Valor |
| --- | --- |
| Root Directory | `frontend` |
| Framework | Vite (lo fija `vercel.json`) |
| Install / Build | `npm ci` / `npm run build` |
| Output | `dist` |
| Variables | `VITE_API_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (Production y Preview) |

`vercel.json` reescribe toda ruta a `index.html`: el router corre en el navegador, y sin esa regla recargar `/anfitrion/cuestionarios` daría 404. Los archivos que sí existen en `dist/` (JS, CSS, imágenes) se sirven antes de aplicar la regla.

Con el repositorio conectado, Vercel construye cada push: la rama de producción publica en el dominio principal y cada PR recibe una URL de vista previa.
