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
| `VITE_SUPABASE_ANON_KEY` | Clave pública (*anon*) del proyecto de Supabase | Obligatoria |

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
