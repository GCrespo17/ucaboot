# Ucaboot · Contenedores

Cómo está contenerizado Ucaboot: qué imágenes hay, cómo se construyen, qué contenedores corren, en qué puertos, con qué variables y cómo se ejecutan en local y en la nube. Las decisiones de arquitectura están en [`arquitectura_inicial.md`](arquitectura_inicial.md).

---

## 1. Conceptos en este proyecto

| Concepto | En Ucaboot |
| --- | --- |
| **Dockerfile** | Receta para construir una imagen. Hay dos propias: `backend/Dockerfile` y `nginx/Dockerfile`. |
| **Imagen** | Plantilla inmutable con el sistema base, las dependencias y el código. Ej.: la imagen `runtime` del backend. |
| **Contenedor** | Una imagen en ejecución, con su propia red, variables y procesos. Ej.: el contenedor `backend` de Compose. |
| **Etapa (*multi-stage*)** | Un Dockerfile con varios `FROM`. Cada etapa puede copiar archivos de otra, y la imagen final solo contiene la última etapa elegida. |
| **Volumen** | Almacenamiento que sobrevive al contenedor. Ej.: `pgdata` guarda los datos de Postgres en local. |
| **Docker Compose** | Define y levanta varios contenedores juntos, con su red interna. Lo usamos solo para el entorno local. |

---

## 2. Imagen del backend (`backend/Dockerfile`)

Un solo Dockerfile con cuatro etapas. Según el `target`, se obtiene la imagen de desarrollo o la de producción.

```
node:22-alpine
   └─ deps      npm ci (todas las dependencias, incluidas las de desarrollo)
        ├─ dev      + código fuente → npm run dev (tsx watch, hot reload)
        └─ build    + código fuente → npm run build (TypeScript → dist/)
node:22-alpine
   └─ runtime   npm ci --omit=dev + dist/ (de build) + drizzle/ → node dist/server.js
```

| Etapa | Para qué | Qué contiene |
| --- | --- | --- |
| `deps` | Instalar dependencias una vez y reutilizarlas | `node_modules` completo |
| `dev` | Desarrollo local (`docker-compose.override.yml`) | Dependencias + código fuente. El código real se monta como volumen. |
| `build` | Compilar TypeScript | `dist/` con JavaScript |
| `runtime` | **Producción** (Render, CI y modo producción local) | Solo dependencias de producción, `dist/` y las migraciones |

**Decisiones:**

- **Multi-stage.** La imagen final no lleva TypeScript, `tsx`, Vitest, `drizzle-kit` ni el código fuente: es más pequeña y expone menos superficie de ataque.
- **`node:22-alpine`.** Imagen base mínima, con la misma versión de Node que usa el CI.
- **Cache de capas.** Se copian `package*.json` y se ejecuta `npm ci` **antes** de copiar el código. Si solo cambia el código, Docker reutiliza la capa de dependencias y el build es mucho más rápido.
- **`npm ci`, no `npm install`.** Instala exactamente lo que dice `package-lock.json`: builds reproducibles.
- **`NODE_ENV=production`** en `runtime`: Express y las librerías activan su modo de producción.
- **Migraciones dentro de la imagen.** Se copia `drizzle/` y el backend aplica las migraciones pendientes al arrancar (`migrate()` en `server.ts`). Nadie las aplica a mano y la imagen no necesita `drizzle-kit`.
- **`.dockerignore`.** Excluye `node_modules`, `dist` y `.env`: no se copian dependencias del host, ni builds viejos, ni **secretos** a la imagen.

**Puerto:** el proceso escucha en `PORT` (variable de entorno). No hay `EXPOSE` fijo porque en Render la plataforma asigna `PORT`, y en Compose lo fija `BACKEND_PORT`.

---

## 3. Imagen de nginx (`nginx/Dockerfile`)

Se usa **solo en local** (modo producción). En la nube, el frontend se publica en Vercel y el backend en Render, así que no hace falta nginx.

| Etapa | Qué hace |
| --- | --- |
| `frontend` (`node:22-alpine`) | `npm ci` y `npm run build` del frontend: genera los archivos estáticos en `dist/` |
| final (`nginx:alpine`) | Copia el build a `/usr/share/nginx/html` y las plantillas de configuración |

- El **contexto de build es la raíz del repo** (necesita `frontend/` y `nginx/`), por eso existe un `.dockerignore` en la raíz que además excluye `.git`.
- Las variables `VITE_*` son **argumentos de build** (`ARG`): Vite las incrusta en el JavaScript al compilar. Por eso son públicas y **nunca deben llevar secretos**.
- Las plantillas (`*.conf.template`) usan `${APP_PORT}`, `${BACKEND_PORT}`, etc. La imagen oficial de nginx las rellena con las variables de entorno al arrancar.

**Rutas** (`nginx/templates/routes/api.conf.template`, iguales en desarrollo y producción):

| Ruta | Destino |
| --- | --- |
| `/` | Frontend: el build estático (producción) o el servidor de Vite (desarrollo) |
| `/api/` | `backend:${BACKEND_PORT}` (REST) |
| `/socket.io/` | `backend:${BACKEND_PORT}` (WebSocket; reenvía `Upgrade` y `Connection`) |
| `/auth/v1/` | `auth:${AUTH_PORT}` (Supabase Auth, con el mismo prefijo que en la nube) |

---

## 4. Contenedores locales (`docker-compose.yml`)

Todos los contenedores comparten una red interna de Compose y se encuentran por **nombre de servicio** (`db`, `redis`, `backend`…). Solo se publican al host los puertos marcados.

| Servicio | Imagen | Puerto | Publicado al host | Persistencia | Depende de |
| --- | --- | --- | --- | --- | --- |
| `nginx` | Propia (`nginx/Dockerfile`) | `APP_PORT` (8080) | **Sí**: única entrada | — | backend, auth |
| `backend` | Propia (`backend/Dockerfile`, `runtime`) | `BACKEND_PORT` (3000) | No | — (stateless) | db (sano), redis |
| `auth` | `supabase/auth:v2.197.0` | `AUTH_PORT` (9999) | No | En `db` (esquema `auth`) | db (sano), mailpit |
| `db` | `postgres:17` | `POSTGRES_PORT` (5432) | Sí (opcional, para DBeaver/pgAdmin) | Volumen `pgdata` | — |
| `redis` | `redis:7` | `REDIS_PORT` (6379) | No | En memoria | — |
| `mailpit` | `axllent/mailpit` | `SMTP_PORT` (1025), `MAILPIT_UI_PORT` (8025) | Solo la UI | — | — |

- **Healthcheck de `db`.** `pg_isready` cada 5 s. El backend y `auth` esperan a que la base esté **sana**, no solo encendida, para no fallar al aplicar migraciones.
- **Inicialización de `db`.** `docker/postgres/init/01-supabase-auth.sh` corre una sola vez, cuando se crea el volumen: crea el rol `supabase_auth_admin` y el esquema `auth`, como los trae el Postgres de Supabase en la nube.
- **Stateful vs. stateless.** `db` y `redis` guardan estado. `backend` y `nginx` no: se pueden destruir y recrear sin perder nada, lo que permite escalarlos horizontalmente.

### Desarrollo vs. modo producción local

Compose carga automáticamente `docker-compose.override.yml`, que convierte el entorno en uno de desarrollo:

| | Desarrollo (`docker compose up`) | Producción local (`-f docker-compose.yml`) |
| --- | --- | --- |
| backend | Etapa `dev`, código montado como volumen, `tsx watch` | Etapa `runtime`, código compilado dentro de la imagen |
| frontend | Contenedor extra con Vite (`node:22-alpine`) y hot reload | No existe: nginx sirve el build |
| nginx | `nginx:alpine` sin build, con la plantilla de `nginx/dev/` | Imagen propia con el build del frontend |

El volumen anónimo `/app/node_modules` evita que el `node_modules` del host (otro sistema operativo) pise el del contenedor.

---

## 5. Variables de entorno

**En local** se leen del archivo `.env` de la raíz (copia de `.env.example`, que sí se versiona; `.env` está en `.gitignore`). Compose las sustituye en `docker-compose.yml` y las pasa a cada contenedor.

**Variables que recibe el backend** (validadas con zod en `backend/src/config/env.ts`; si falta una, el proceso no arranca):

| Variable | Uso | Local | Nube |
| --- | --- | --- | --- |
| `PORT` | Puerto HTTP y de Socket.IO | `BACKEND_PORT` | La asigna Render |
| `DATABASE_URL` | Conexión a Postgres | `postgres://…@db:5432/…` | Cadena de conexión de Supabase |
| `REDIS_URL` | Conexión a Redis | `redis://redis:6379` | Redis administrado (Upstash) |
| `SUPABASE_URL` | Verificar los JWT de Supabase Auth | `http://nginx:8080` | URL del proyecto de Supabase |
| `SUPABASE_ANON_KEY` | Cliente de Supabase | Cualquier valor | Clave *anon* del proyecto |
| `CORS_ORIGINS` | Orígenes permitidos | Vacío (mismo origen) | Dominio del frontend en Vercel |

**Variables del frontend** (`VITE_API_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`): se fijan **al compilar**, en el panel de Vercel. Son públicas por diseño.

**Secretos:** ninguno se versiona ni se copia a una imagen. En la nube viven en los paneles de Render y Vercel y, para el CI, en GitHub Secrets. Los valores de `.env.example` son solo de desarrollo.

---

## 6. Ejecución

### Local

```bash
cp .env.example .env
docker compose up --build -d     # o: make up
# App: http://localhost:8080 · Correos: http://localhost:8025
docker compose logs -f backend   # logs del backend
docker compose down              # detener (añadir -v borra la base local)
```

Modo producción local (las imágenes finales):

```bash
docker compose -f docker-compose.yml up --build -d
```

### Una imagen suelta

```bash
docker build --target runtime -t ucaboot-backend ./backend
docker run --rm -p 3000:3000 --env-file backend.env ucaboot-backend
```

### CI

El job `Docker images (build only)` de `.github/workflows/ci.yml` construye en cada PR la imagen `runtime` del backend y la de nginx, sin publicarlas. Si un Dockerfile se rompe, el check falla en el PR (y bloquea el merge cuando está marcado como obligatorio en la protección de la rama).

### Nube

- **Backend → Render**, a partir de `backend/Dockerfile`. Render construye la última etapa (`runtime`), inyecta `PORT` y las variables configuradas en su panel, y expone el servicio por HTTPS.
- **Frontend → Vercel**, sin contenedor: compila `frontend/` y publica los archivos estáticos en su CDN (ver `frontend/README.md`).
- **Postgres y Auth → Supabase** y **Redis → Upstash**: servicios administrados, no contenedores nuestros.

---

## 7. Mejoras previstas

- Ejecutar el backend con un **usuario sin privilegios** (`USER node`) en la etapa `runtime`; hoy corre como `root` dentro del contenedor.
- Agregar un **`HEALTHCHECK`** sobre `/api/health`, cuando ese endpoint verifique la base de datos.
- Publicar la imagen del backend en un registro (p. ej. GHCR) desde el CI y desplegar esa misma imagen, para que lo probado sea exactamente lo que corre en producción.
