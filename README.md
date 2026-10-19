# Integrantes:
-Gabriel Crespo
-Emmanuel Santiago
-Ainhoa Hurtado
-Gabriel Castellano
-Jose Ojeda

# Ucaboot
### Plataforma de Cuestionarios Interactivos en Tiempo Real (Clon de Kahoot)

[![CI/CD Pipeline](https://img.shields.io/badge/CI%2FCD-GitHub_Actions-blue?logo=github-actions)](https://github.com)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## Datos Académicos

* **Institución:** Universidad Católica Andrés Bello (UCAB)
* **Facultad:** Facultad de Ingeniería
* **Escuela:** Escuela de Ingeniería Informática
* **Asignatura:** Computación en la Nube (INFO-02028)
* **Semestre:** Septiembre 2026 – Enero 2027
* **Profesor:** Jorge Rojas

---

## Descripción del Proyecto

**Ucaboot** es una aplicación web interactiva de preguntas y respuestas en tiempo real inspirada en la popular plataforma **Kahoot**. Está diseñada para que profesores, estudiantes y facilitadores puedan crear cuestionarios de evaluación o dinámicas de aprendizaje gamificadas, proyectar preguntas en vivo frente a una audiencia y permitir que decenas de participantes se unan simultáneamente desde sus propios dispositivos (celulares, tablets o laptops) mediante un código PIN único, sin necesidad de registro previo.

La experiencia de uso se divide en dos roles claramente diferenciados:

- **Anfitrión (Host):** Es quien crea el cuestionario, inicia la partida y proyecta las preguntas en una pantalla compartida (proyector, TV o monitor). Controla el flujo del juego: avanza entre preguntas, visualiza estadísticas en vivo y presenta el podio final.
- **Participante (Jugador):** Se une a la partida ingresando el PIN y un apodo. Desde su dispositivo personal ve las opciones de respuesta (representadas por colores y formas), selecciona su respuesta antes de que se agote el tiempo, y recibe retroalimentación inmediata sobre si acertó o falló, junto con su puntaje acumulado y posición en el ranking.

El sistema busca replicar la mecánica central de Kahoot: la combinación de presión de tiempo, competencia entre pares y retroalimentación instantánea que convierte una evaluación convencional en una experiencia de juego motivadora.

### Justificación desde la perspectiva de Computación en la Nube

Un sistema tipo Kahoot es un caso de estudio especialmente relevante para la asignatura porque expone de forma natural los desafíos fundamentales de los sistemas distribuidos en la nube:

1. **Comunicación en tiempo real y concurrencia:** El juego requiere comunicación bidireccional de baja latencia (WebSockets) entre el anfitrión y todos los participantes. Las respuestas deben llegar al servidor dentro de ventanas de tiempo estrictas (5-30 segundos por pregunta), y todos los clientes deben estar sincronizados en la misma pregunta al mismo tiempo.
2. **Gestión de estado efímero vs. persistente:** Una partida activa genera estado volátil (qué jugadores están conectados, qué pregunta se está mostrando, qué respuestas se han recibido, los puntajes parciales) que debe existir en memoria con acceso ultra-rápido pero que no necesita sobrevivir más allá del fin de la partida. Esto contrasta con los datos persistentes (cuestionarios creados, cuentas de usuario, historial de resultados) que requieren almacenamiento relacional duradero.
3. **Escalabilidad horizontal:** El servidor debe poder manejar múltiples salas de juego simultáneas, cada una con decenas de participantes enviando respuestas concurrentemente. La arquitectura debe permitir agregar instancias del backend sin perder consistencia en el estado de las partidas.
4. **Resiliencia ante desconexiones:** En un entorno donde los participantes usan redes móviles o Wi-Fi inestable, el sistema debe manejar desconexiones y reconexiones sin perder el progreso del jugador.


## Alcance Funcional

### 1. Autenticación y Gestión de Usuarios

El sistema contempla dos tipos de acceso:

- **Creadores / Anfitriones (con cuenta):** Se registran con correo electrónico y contraseña (el inicio de sesión con Google/GitHub queda fuera del alcance por ahora). Una vez autenticados, pueden crear, editar y eliminar cuestionarios, así como iniciar partidas y acceder al historial de resultados de sus juegos anteriores.
- **Participantes (sin cuenta):** No requieren registro. Para unirse a una partida solo necesitan el código PIN y elegir un apodo (nickname). Su identidad es efímera y existe únicamente durante la duración de la partida.

### 2. Gestión de Cuestionarios (CRUD)

Los usuarios autenticados (anfitriones) disponen de un panel para administrar sus cuestionarios:

- **Crear cuestionario:** Definir título, descripción opcional e imagen de portada opcional.
- **Agregar preguntas:** Cada pregunta incluye:
  - Texto de la pregunta (obligatorio).
  - Imagen o multimedia adjunta (opcional, para preguntas visuales).
  - Entre 2 y 4 opciones de respuesta, cada una con su texto.
  - Indicación de cuál(es) opción(es) es(son) la(s) correcta(s) (al menos una).
  - Tiempo límite de respuesta configurable por pregunta (ej: 5, 10, 15, 20, 30 segundos).
  - Puntaje base configurable (ej: 1000 puntos), con bonificación por velocidad de respuesta.
- **Editar y eliminar:** Modificar cualquier campo de un cuestionario existente o eliminarlo por completo. Un cuestionario no puede ser editado mientras una partida basada en él está activa.
- **Duplicar cuestionario:** Crear una copia de un cuestionario existente para modificarla sin afectar el original.
- **Vista previa:** El anfitrión puede previsualizar el cuestionario tal como lo verán los participantes antes de iniciar una partida.

### 3. Flujo de Juego en Tiempo Real

Este es el módulo central de la aplicación. El flujo completo de una partida sigue estas fases:

#### 3.1. Creación de Sala y Lobby
1. El anfitrión selecciona un cuestionario y presiona "Iniciar Partida".
2. El servidor genera un **código PIN numérico único** (ej: 6 dígitos) y crea una sala de juego asociada en el sistema de caché.
3. Se muestra la pantalla de lobby en el dispositivo del anfitrión, con el PIN destacado y un código QR para facilitar el acceso desde móviles.
4. A medida que los participantes se unen, sus apodos aparecen en la pantalla del lobby en tiempo real, con animaciones de entrada.
5. El anfitrión puede **expulsar** jugadores del lobby antes de iniciar (ej: apodos inapropiados).
6. Cuando el anfitrión considera que hay suficientes jugadores, presiona "Comenzar".

#### 3.2. Ronda de Preguntas
1. La pregunta se muestra simultáneamente en la pantalla del anfitrión (con texto completo, imagen y opciones) y en los dispositivos de los participantes (solo las opciones representadas por colores/formas).
2. Se inicia un **temporizador regresivo** visible para todos. Los participantes deben seleccionar su respuesta antes de que el tiempo se agote.
3. El puntaje otorgado a cada respuesta correcta depende de la **velocidad**: responder más rápido otorga más puntos (fórmula basada en el porcentaje de tiempo restante multiplicado por el puntaje base).
4. Una vez que todos han respondido o el tiempo se agota, se cierra la recepción de respuestas.

#### 3.3. Resultados por Pregunta
1. Se revela la **respuesta correcta** en la pantalla del anfitrión, junto con un gráfico de barras que muestra cuántos jugadores eligieron cada opción.
2. En el dispositivo del participante se muestra si acertó o falló, los puntos ganados en esa ronda y su puntaje total acumulado.
3. Se muestra un **leaderboard parcial** con los 5 mejores jugadores tras esa pregunta.
4. El anfitrión avanza manualmente a la siguiente pregunta cuando lo considere oportuno.

#### 3.4. Podio Final
1. Al completar todas las preguntas, se presenta un **podio animado** con los 3 primeros lugares.
2. Se muestra una tabla de resultados completa con todos los participantes, su puntaje final, número de respuestas correctas y tiempo promedio de respuesta.
3. Los resultados de la partida se persisten en la base de datos para que el anfitrión pueda consultarlos posteriormente.

### 4. Experiencia del Participante (Jugador)

El flujo del participante está optimizado para dispositivos móviles y busca ser lo más simple posible:

1. **Acceso:** El jugador abre la URL de la aplicación (o escanea el QR mostrado por el anfitrión).
2. **Unirse:** Ingresa el PIN de 6 dígitos y elige un apodo.
3. **Espera:** Ve una pantalla de espera indicando que el anfitrión aún no ha comenzado.
4. **Jugar:** En cada ronda, ve las opciones (colores/formas que corresponden a las respuestas mostradas en el proyector) y selecciona una antes del tiempo límite.
5. **Retroalimentación:** Tras cada pregunta, ve si acertó, los puntos ganados y su posición actualizada.
6. **Final:** Ve su puntaje final y posición en el ranking general.

### 5. Historial y Estadísticas

Los anfitriones pueden acceder a un historial de las partidas que han organizado:

- Lista de partidas pasadas con fecha, cuestionario usado y número de participantes.
- Detalle de cada partida: ranking final, distribución de respuestas por pregunta y porcentaje de acierto global.
- Exportación de resultados en formato CSV para análisis externo o registro de calificaciones.

---

## Stack Tecnológico

| Capa | Tecnología |
| --- | --- |
| Lenguaje | TypeScript en todo el proyecto |
| Frontend | React 19 + Vite, React Router, TanStack Query, Zustand |
| Backend | Node.js 22 + Express 5 |
| Tiempo real | Socket.IO |
| Autenticación | Supabase Auth (solo correo y contraseña) |
| Persistencia | PostgreSQL con Drizzle ORM (local: Postgres 17; en la nube: Supabase) |
| Estado efímero de salas | Redis 7 |
| Validación | zod |
| Correo en local | Mailpit (atrapa los correos de Supabase Auth) |
| Pruebas | Vitest |
| Infraestructura local | Docker Compose, con nginx como única entrada |

---

## Arquitectura

Las decisiones completas y su justificación están en [`docs/arquitectura_inicial.md`](docs/arquitectura_inicial.md). Este es el resumen.

### Vista general (local)

- **Un solo punto de entrada.** El navegador solo habla con nginx. nginx sirve el frontend (en producción, el build; en desarrollo, reenvía a Vite) y enruta `/api`, `/socket.io` y `/auth/v1` a su servicio, con las mismas rutas que usa Supabase en la nube. Así no hay CORS en local.
- **Autenticación con Supabase Auth.** El frontend registra e inicia sesión al anfitrión directamente con Supabase Auth, que entrega un JWT. El backend no maneja contraseñas: solo verifica ese JWT. En local, Supabase Auth corre como un contenedor sobre el mismo Postgres (esquema `auth`). En la nube lo provee Supabase.
- **Dos tipos de estado.** Lo persistente (cuestionarios, historial) va a PostgreSQL. Lo efímero de una partida en curso (lobby, respuestas, puntajes parciales) va a Redis.
- **El servidor es la autoridad del tiempo.** Al abrir una pregunta se guarda su hora de cierre (`closesAt`). El servidor la usa para aceptar o rechazar respuestas, y el cliente solo la usa para mostrar la cuenta regresiva.
- **Dos identidades.** El anfitrión tiene cuenta en Supabase Auth. El participante no tiene cuenta: se identifica con un token aleatorio que sirve para reconectarse.
- **Preparado para dominios separados.** El frontend puede apuntar a otro dominio con `VITE_API_URL` y `VITE_SUPABASE_URL`, y el backend permite ese origen con `CORS_ORIGINS`.

### Servicios locales

| Servicio | Qué hace | Entorno |
| --- | --- | --- |
| `nginx` | Única entrada pública. Sirve el frontend y enruta `/api`, `/socket.io` y `/auth/v1`. | Siempre |
| `frontend` | Servidor de Vite con *hot reload*. En producción no existe: nginx sirve el build. | Solo desarrollo |
| `backend` | API REST y Socket.IO. Verifica el JWT de Supabase y aplica las migraciones al arrancar. | Siempre |
| `auth` | Supabase Auth: registro, inicio de sesión, recuperación de contraseña y emisión de JWT. | Siempre (en la nube lo provee Supabase) |
| `db` | PostgreSQL: esquema `public` (dominio) y esquema `auth` (usuarios). | Siempre (en la nube, el Postgres de Supabase) |
| `redis` | Estado de las salas activas y tokens de participante. | Siempre |
| `mailpit` | Servidor de correo falso: atrapa los correos que envía `auth` (recuperación de contraseña, confirmaciones) para verlos en el navegador. | Solo local |

### Backend: arquitectura en capas basada en MVC

```
controllers  →  services  →  domain  ←  infra
(rest / sockets)                     (implementa domain/ports)
```

| Capa | Rol |
| --- | --- |
| `controllers/` | **C** de MVC. Recibe peticiones REST y eventos de Socket.IO, valida la entrada con zod, llama a un servicio y responde. |
| `views/` | **V** de MVC. Convierte objetos del dominio en el JSON que se envía al cliente (DTO). |
| `services/` | Casos de uso. Coordinan el dominio y los repositorios. No saben si la petición llegó por REST o por socket. |
| `domain/` | **M** de MVC. Reglas puras del juego (máquina de estados de la sala, puntaje, ranking, PIN, apodos). No importa Express ni la base de datos, y recibe la hora actual como parámetro para poder probarlo sin relojes reales. |
| `domain/ports/` | Interfaces que el dominio necesita (repositorios, almacén de estado de salas, archivos). |
| `infra/` | Implementaciones concretas de esos puertos: Drizzle/PostgreSQL, Redis y almacenamiento local. |

Las rutas del anfitrión usan el middleware `requireHost`, que verifica el JWT de Supabase y deja el id del usuario (`auth.users.id`) disponible para el controlador.

### Frontend: MVVM con hooks

| MVVM | En React |
| --- | --- |
| **View** | Componentes de presentación (`XView.tsx`), sin lógica. |
| **ViewModel** | Un *custom hook* por pantalla (`useXViewModel.ts`) que expone estado derivado y acciones. |
| **Model** | Clientes de la API, de Socket.IO y de Supabase, y stores. |

- Una View solo importa su ViewModel y componentes de `ui/`. Un ViewModel importa de `model/`. `model/` nunca importa componentes.
- **TanStack Query** maneja los datos del CRUD (cuestionarios, historial).
- **Zustand** maneja el estado de la partida, alimentado por los eventos del socket.

---

## Estructura del Repositorio

```
ucaboot/
├─ backend/                     # API: Express + Socket.IO
├─ frontend/                    # Aplicación React + Vite
├─ nginx/
│  ├─ Dockerfile                # Imagen de producción: build del frontend + nginx
│  ├─ templates/
│  │  ├─ default.conf.template  # Producción: sirve el build y enruta
│  │  └─ routes/api.conf.template # Rutas comunes: /api, /socket.io, /auth/v1
│  └─ dev/
│     └─ default.conf.template  # Desarrollo: reenvía / a Vite
├─ docker/
│  └─ postgres/init/            # Prepara el Postgres local para Supabase Auth (rol y esquema auth)
├─ docs/
│  ├─ arquitectura_inicial.md   # Decisiones de arquitectura
│  └─ project-setup-plan.md     # Cómo se armó el proyecto desde cero
├─ docker-compose.yml           # Servicios: db, redis, mailpit, auth, backend, nginx
├─ docker-compose.override.yml  # Desarrollo: agrega el frontend (Vite) y hot reload; Compose lo carga automáticamente
├─ Makefile                     # Atajos: make up, make down, make logs, make db
├─ .env.example                 # Plantilla de variables de entorno
└─ README.md
```

### Backend

```
backend/
├─ src/
│  ├─ server.ts                 # Arranque: aplica migraciones, levanta HTTP + Socket.IO
│  ├─ app.ts                    # Express: middlewares y rutas
│  ├─ config/
│  │  └─ env.ts                 # Variables de entorno validadas con zod
│  ├─ auth/
│  │  └─ supabase.ts            # Verificación del JWT de Supabase Auth
│  ├─ controllers/
│  │  ├─ rest/routes/           # Rutas HTTP del CRUD
│  │  ├─ sockets/
│  │  │  └─ socket.ts           # Crea Socket.IO e identifica al anfitrión en el handshake
│  │  └─ middlewares/
│  │     ├─ cors.ts             # Permite los orígenes de CORS_ORIGINS (frontend en otro dominio)
│  │     └─ requireHost.ts      # Exige un JWT válido de anfitrión
│  ├─ views/                    # DTO / mappers de dominio a JSON
│  ├─ services/                 # Casos de uso
│  ├─ domain/
│  │  ├─ quiz/                  # Cuestionario, pregunta, copia jugable
│  │  ├─ game/                  # Sala, puntaje, ranking, PIN, apodos
│  │  └─ ports/                 # Interfaces que implementa infra/
│  └─ infra/
│     ├─ db/
│     │  ├─ client.ts           # Cliente de Drizzle (node-postgres)
│     │  └─ schema.ts           # Tablas del dominio (esquema public)
│     ├─ repositories/          # Repositorios sobre PostgreSQL
│     ├─ state/                 # Estado de salas (memoria / Redis)
│     └─ storage/               # Archivos subidos (volumen local)
├─ drizzle/                     # Migraciones SQL (GENERADO con make db; se versiona)
├─ tests/domain/                # Pruebas del dominio con Vitest
├─ drizzle.config.ts
├─ Dockerfile                   # Etapas: deps → dev | build → runtime
├─ package.json
└─ tsconfig.json
```

### Frontend

```
frontend/
├─ src/
│  ├─ main.tsx                  # Punto de entrada
│  ├─ App.tsx                   # Componente raíz (todavía la plantilla de Vite)
│  ├─ vite-env.d.ts             # Tipos de las variables VITE_*
│  ├─ app/                      # Router, providers, guardia de sesión del anfitrión
│  ├─ model/                    # La "M" de MVVM
│  │  ├─ api/
│  │  │  └─ config.ts           # URLs del backend y de Supabase
│  │  ├─ auth/
│  │  │  └─ supabase.ts         # Cliente de Supabase Auth y token de acceso
│  │  ├─ realtime/
│  │  │  └─ socket.ts           # Cliente de Socket.IO (envía el token del anfitrión)
│  │  ├─ stores/                # Stores de Zustand de la partida
│  │  └─ types/                 # Tipos del frontend
│  ├─ features/                 # Una carpeta por área; cada pantalla = XView.tsx + useXViewModel.ts
│  │  ├─ auth/                  # Inicio de sesión, registro, recuperar contraseña
│  │  ├─ quizzes/               # Lista y editor de cuestionarios
│  │  ├─ host-game/             # Lobby, pregunta, revelación y podio del anfitrión
│  │  ├─ player-game/           # Unirse, espera, responder y resultado del participante
│  │  └─ history/               # Historial de partidas
│  ├─ ui/                       # Componentes reutilizables (botones, temporizador, opciones)
│  ├─ lib/                      # Utilidades (reloj del servidor, estilos de respuesta)
│  └─ assets/
├─ public/
├─ index.html
├─ vite.config.ts
├─ eslint.config.js
└─ package.json
```

---

## Manual de Uso: Cómo Ejecutar el Proyecto

Todo corre en contenedores: no necesitas instalar PostgreSQL, Redis, Supabase ni Mailpit en tu máquina.

### Requisitos

- **Docker** con Docker Compose v2.24 o superior (Docker Desktop en Windows y macOS).
- **Git**.
- **make**: viene en Linux y macOS. En Windows es opcional; abajo están los comandos equivalentes.
- **Node.js 22**: solo si vas a agregar dependencias con `npm install`. Para ejecutar el proyecto no hace falta.

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio> ucaboot
cd ucaboot
git switch develop
```

### 2. Crear el archivo `.env`

`.env` no se versiona; cada integrante tiene el suyo. Todos los puertos se definen ahí. Solo hay que copiar la plantilla:

```bash
cp .env.example .env              # Linux, macOS, WSL
Copy-Item .env.example .env       # Windows (PowerShell)
```

> La plantilla trae valores de desarrollo para Supabase Auth (`AUTH_JWT_SECRET`, `SUPABASE_ANON_KEY`…). En local no necesitan ser secretos. En la nube, Supabase entrega los suyos.

### 3. Levantar los servicios

```bash
make up                         # o: docker compose up --build -d
```

La primera vez tarda unos minutos mientras se descargan las imágenes e instalan las dependencias. Al crear la base de datos por primera vez, un script prepara el esquema `auth` para Supabase Auth, y el contenedor `auth` crea sus tablas solo.

### 4. Abrir la aplicación

Con los valores por defecto de `.env.example`:

| Servicio | URL |
| --- | --- |
| Aplicación | http://localhost:8080 |
| Salud de la API | http://localhost:8080/api/health → `{"ok":true}` |
| Salud de Supabase Auth | http://localhost:8080/auth/v1/health |
| Mailpit (correos de prueba) | http://localhost:8025 |
| PostgreSQL (DBeaver, pgAdmin…) | `localhost:5432`, usuario, clave y base `ucaboot` |

Si cambiaste algún puerto en `.env`, usa el tuyo.

### 5. Probar la autenticación

Con los servicios arriba, puedes probar Supabase Auth sin frontend:

```bash
# Registro: devuelve el usuario y un access_token
curl -s -X POST localhost:8080/auth/v1/signup -H 'Content-Type: application/json' \
  -d '{"email":"ana@test.com","password":"clave1234"}'

# Regla de la épica 1: sin número debe fallar con "weak_password"
curl -s -X POST localhost:8080/auth/v1/signup -H 'Content-Type: application/json' \
  -d '{"email":"beto@test.com","password":"solotexto"}'

# Recuperar contraseña: el correo aparece en Mailpit (http://localhost:8025)
curl -s -X POST localhost:8080/auth/v1/recover -H 'Content-Type: application/json' \
  -d '{"email":"ana@test.com"}'
```

> En Windows (PowerShell), usa `curl.exe` y escribe cada comando en una sola línea, sin las `\` del final.

### Comandos del día a día

| Acción | Con `make` (Linux, macOS, WSL) | Sin `make` (Windows: PowerShell o CMD) |
| --- | --- | --- |
| Levantar todo | `make up` | `docker compose up --build -d` |
| Detener todo | `make down` | `docker compose down` |
| Ver logs | `make logs` | `docker compose logs -f` |
| Generar migración del dominio | `make db` | Los dos comandos de abajo |
| Reiniciar solo el backend | `docker compose restart backend` | `docker compose restart backend` |
| Correr las pruebas del backend | `docker compose exec backend npm test` | `docker compose exec backend npm test` |
| Abrir una consola de PostgreSQL | `docker compose exec db psql -U ucaboot -d ucaboot` | igual |
| Borrar la base de datos local y empezar de cero | `docker compose down -v` | `docker compose down -v` |

**Generar la migración sin `make`** (Windows con Docker Desktop):

```powershell
docker compose run --rm --no-deps backend npm run db:generate
docker compose restart backend
```

> Si en Windows trabajas **dentro de WSL** (con el repositorio en el sistema de archivos de Linux), usa `make` o los comandos de Linux: así los archivos generados quedan a tu nombre y no a nombre de `root`.

### Hot reload

En desarrollo, `backend/` y `frontend/` están montados dentro de los contenedores:

- Al guardar un archivo `.ts` del backend, `tsx watch` reinicia el servidor.
- Al guardar un archivo del frontend, Vite actualiza el navegador (a través de nginx).

No hace falta reconstruir nada para cambios de código.

### Cambios en la base de datos

Ejecuta `make db` después de agregar o modificar tablas o columnas del dominio (en `backend/src/infra/db/schema.ts`). Genera la migración en `backend/drizzle/` y reinicia el backend, que **aplica las migraciones pendientes automáticamente al arrancar**.

- **Usuarios.** Las tablas de usuarios las maneja Supabase Auth en el esquema `auth`; Drizzle solo genera el esquema `public`. Para referenciar al anfitrión, usa `authUsers` de `drizzle-orm/supabase`.
- **Renombres.** Si renombras una columna o tabla, Drizzle te pregunta si es un renombre o un borrado y creación. Responde con cuidado: borrar y crear pierde los datos.
- **Commit.** Versiona los archivos nuevos de `backend/drizzle/`, incluido `meta/`.
- **Resto del equipo.** No genera nada: hace `git pull`, reinicia el backend y las migraciones se aplican solas.

### Agregar dependencias

```bash
cd backend      # o frontend
npm install <paquete>
cd ..
```

Después:

- **Backend:** `docker compose build backend` y luego `docker compose up -d -V backend`. `-V` recrea el volumen de `node_modules`.
- **Frontend:** `docker compose restart frontend`. El contenedor ejecuta `npm ci` cada vez que arranca.

### Modo producción local

Para probar las imágenes finales (nginx sirve el build del frontend; no hay contenedor de Vite ni hot reload):

```bash
docker compose down
docker compose -f docker-compose.yml up --build -d
```

La aplicación queda en la misma URL, http://localhost:8080. Para volver a desarrollo: `docker compose -f docker-compose.yml down` y luego `make up`.

### Variables de entorno

| Variable | Uso | Por defecto |
| --- | --- | --- |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | Credenciales y nombre de la base | `ucaboot` |
| `POSTGRES_PORT` | Puerto de PostgreSQL | `5432` |
| `REDIS_PORT` | Puerto de Redis | `6379` |
| `APP_PORT` | Puerto de nginx: la única entrada pública | `8080` |
| `BACKEND_PORT`, `AUTH_PORT` | Puertos internos del backend y de Supabase Auth (no se publican) | `3000`, `9999` |
| `FRONTEND_PORT` | Puerto interno del servidor de Vite (solo en desarrollo) | `5173` |
| `AUTH_DB_PASSWORD` | Clave del rol `supabase_auth_admin` en el Postgres local | Valor de desarrollo |
| `AUTH_JWT_SECRET` | Clave con la que Supabase Auth local firma los JWT (32 caracteres o más) | Valor de desarrollo |
| `SUPABASE_ANON_KEY` | Clave pública del proyecto de Supabase. En local cualquier valor sirve | Valor de desarrollo |
| `SMTP_PORT` | Puerto SMTP de Mailpit | `1025` |
| `MAILPIT_UI_PORT` | Interfaz web de Mailpit | `8025` |

Si `.env.example` cambia (por ejemplo, tras un `git pull` que agrega variables), vuelve a copiarlo a `.env` **antes** de cualquier comando de `docker compose`, incluido `down`.

Las cadenas de conexión (`DATABASE_URL`, `REDIS_URL`, `SUPABASE_URL`) no van en `.env`: `docker-compose.yml` las arma a partir de estas variables.

`CORS_ORIGINS` (backend), `VITE_API_URL` y `VITE_SUPABASE_URL` (frontend) son opcionales: solo hacen falta si el frontend, el backend y Supabase quedan en dominios distintos. En local no se usan.

### Solución de problemas

| Síntoma | Causa y solución |
| --- | --- |
| El contenedor `auth` falla con errores de permisos o de rol | La base de datos se creó antes de que existiera el script de inicialización (`docker/postgres/init/`), que solo corre la primera vez. Bórrala y vuelve a crearla: `docker compose down -v` y luego `make up`. |
| `WARN The "APP_PORT" variable is not set` y `no port specified` | Tu `.env` es de una versión anterior. Copia de nuevo `.env.example` a `.env` y repite el comando. |
| `curl` a `/api/health` responde vacío o con error 502 | El backend no arrancó. Revisa `docker compose logs backend`. Aunque el contenedor aparezca como *running*, `tsx watch` lo mantiene vivo tras un error. |
| El inicio de sesión responde 401 en el backend | El token no llegó o expiró. Revisa que el frontend envíe `Authorization: Bearer <token>`, y los logs de `auth`. |
| Error de Supabase Auth: la contraseña no cumple los requisitos | Debe tener 8 caracteres o más, con al menos una letra y un número (épica 1). |
| El correo de recuperación no aparece en Mailpit | Revisa `docker compose logs auth`: debe poder conectarse a `mailpit` en `SMTP_PORT`. |
| `Drizzle schema mismatch` o el esquema `auth` aparece en una migración | `drizzle.config.ts` debe tener `schemaFilter: ["public"]`: Drizzle no debe tocar el esquema de Supabase Auth. |
| `port is already allocated` | Otro programa usa ese puerto. Cambia el puerto correspondiente en `.env`. |
| El backend no encuentra un paquete recién instalado | Reconstruye: `docker compose build backend && docker compose up -d -V backend`. |

---

## Documentación

- [`docs/arquitectura_inicial.md`](docs/arquitectura_inicial.md): decisiones de arquitectura y su justificación.
- [`docs/contrato-api.md`](docs/contrato-api.md): contrato REST del CRUD de cuestionarios y preguntas.
- `docs/specs/` 

---

## Licencia

Este proyecto se distribuye bajo la licencia **MIT**. Consulte el archivo `LICENSE` para más información.
