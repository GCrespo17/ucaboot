# Ucaboot · Arquitectura de software

Decisiones de arquitectura del proyecto y su justificación breve. La estructura completa de carpetas y cómo ejecutar el proyecto están en el [README](../README.md).

---

## 1. Stack

| Capa | Tecnología | Por qué |
| --- | --- | --- |
| Lenguaje | TypeScript en todo el proyecto | Un solo lenguaje para el equipo y tipos compartidos entre capas. |
| Frontend | React + Vite | Ecosistema conocido y servidor de desarrollo rápido. |
| Backend | Express | Simple y sin estructura impuesta, así la arquitectura en capas es nuestra. |
| Tiempo real | Socket.IO | Salas por PIN, reconexión automática, *acks* (confirmar "respuesta aceptada") y adaptador de Redis para escalar horizontalmente. `ws` puro obligaría a construir todo eso. |
| Autenticación | Supabase Auth (correo y contraseña) | Registro, sesiones, recuperación de contraseña y reglas de contraseña resueltas como servicio. En la nube viene con el Postgres de Supabase; en local corre como contenedor. |
| Persistencia | PostgreSQL + Drizzle ORM | Postgres local en desarrollo y el de Supabase en la nube. Con Drizzle, el esquema se escribe en TypeScript y se generan las migraciones SQL. Es liviano, sin binarios extra en la imagen de Docker. |
| Estado efímero | Redis | Estado de las salas activas con acceso rápido y operaciones atómicas. |
| Validación | zod | Un mismo esquema valida la entrada y define el tipo. |
| Estado del frontend | TanStack Query + Zustand | Query para datos del servidor; Zustand para el estado de la partida (ver sección 5). |

## 2. Estructura del repositorio

Dos proyectos independientes, `backend/` y `frontend/`, cada uno con su `package.json`.

- **Sin carpeta `shared/`.** Se descartó para que cada proyecto se construya por separado y los Dockerfiles queden simples. La contraparte es que los tipos de los eventos de Socket.IO se duplican en `backend/src/views/` y `frontend/src/model/types/`, y hay que mantenerlos sincronizados a mano.

## 3. Backend: arquitectura en capas basada en MVC

En una API que devuelve JSON, la "V" de MVC es la serialización. El modelo está desacoplado de la base de datos, y el núcleo es un **dominio puro para la partida**.

```
controllers  →  services  →  domain  ←  infra
(rest / sockets)                     (implementa domain/ports)
```

| Capa | Rol |
| --- | --- |
| `controllers/` (**C**) | Delgados: validan la entrada, llaman a un servicio y responden o emiten. `rest/` para el CRUD, `sockets/` para el juego. |
| `views/` (**V**) | DTO y *mappers* de dominio a JSON. |
| `services/` | Casos de uso. No saben si la petición llegó por REST o por socket. |
| `domain/` (**M**) | Reglas puras (sala, puntaje, ranking, PIN, apodos). No importa Express ni la base de datos. |
| `domain/ports/` | Interfaces que el dominio necesita. |
| `infra/` | Implementaciones de esos puertos. |

**Por qué así:** la parte difícil del proyecto no es el CRUD sino la partida en tiempo real, y aislarla en un dominio puro permite probar todos sus flujos alternos con Vitest, sin base de datos ni sockets.

### Dónde sí desacoplar

Solo se definen interfaces donde hay un cambio de implementación real:

| Puerto | Implementación inicial | Evolución |
| --- | --- | --- |
| `QuizRepository`, `MatchHistoryRepository` | PostgreSQL local | PostgreSQL de Supabase |
| `RoomStateStore` | En memoria (corte 1) | Redis |
| `FileStorage` | Volumen local | Almacenamiento de objetos |

`container.ts` es el único lugar que conoce las implementaciones concretas: pasar de memoria a Redis es cambiar una línea ahí. No se hace DDD completo ni arquitectura hexagonal con ceremonia, para que todo el equipo pueda defender la arquitectura.

### Motor de juego

- **Se guarda el *deadline*, no la cuenta regresiva.** Al abrir una pregunta se guarda `closesAt` (hora del servidor). Una respuesta vale si `now < closesAt`. Si el proceso se reinicia, el cierre se reconstruye desde `closesAt`.
- **El servidor es la autoridad del tiempo.** La pregunta se cierra sola aunque el anfitrión esté desconectado.
- **El dominio recibe `now` como parámetro**, para probarlo sin relojes reales.
- **"Exactamente una vez."** Una respuesta por participante y pregunta, un solo cierre por pregunta, y comenzar o avanzar se aplica una vez aunque haya dos pestañas del anfitrión.
  - Con un solo proceso: se serializan las acciones por sala (cola o *mutex* por PIN).
  - Con Redis: `HSETNX` por jugador y pregunta, y `SET … NX` sobre una llave de "cerrada".
- **Copia jugable.** Al iniciar la sala se toma un *snapshot* del cuestionario; editar el original no afecta la partida en curso.

## 4. Autenticación

- **Supabase Auth es un servicio aparte**, no una librería del backend.
  - El **frontend** registra, inicia sesión y recupera la contraseña directamente contra Supabase Auth (`@supabase/supabase-js`), que entrega un JWT y lo renueva solo.
  - El **backend** no guarda contraseñas ni sesiones: **solo verifica el JWT** que llega en `Authorization: Bearer …` (middleware `requireHost`) o en el *handshake* de Socket.IO.
- **Verificación con `getClaims`.** Con las claves asimétricas de un proyecto de Supabase, la firma se verifica localmente con sus claves públicas (JWKS). Con la clave simétrica del Auth local, se consulta al propio servicio. El mismo código funciona en ambos casos.
- **Los usuarios viven en `auth.users`** (esquema `auth`, de Supabase). Las tablas del dominio guardan el id del anfitrión y lo referencian con `authUsers` de `drizzle-orm/supabase`.
- **En local**, Supabase Auth corre como contenedor sobre el mismo Postgres. Un script de inicialización crea su rol (`supabase_auth_admin`) y el esquema `auth`, como lo trae el Postgres de Supabase. Los correos de recuperación van a Mailpit.
- **Solo correo y contraseña.** El inicio de sesión social queda fuera del alcance por ahora; en Supabase agregarlo es solo configuración.
- **Dos identidades:**
  - El **anfitrión** tiene cuenta en Supabase Auth.
  - El **participante** no tiene cuenta: se identifica con un token aleatorio guardado en Redis y en el `localStorage` de su dispositivo. Ese mismo token le sirve para reconectarse.
- **Reglas de la épica 1 como configuración de Supabase Auth, no como código:**
  - contraseña de 8 caracteres como mínimo, con al menos una letra y un número;
  - enlace de recuperación válido por 30 minutos.

  En local se configuran en `docker-compose.yml`; en la nube, en el panel de Supabase.

## 5. Frontend: MVVM con hooks

| MVVM | En React |
| --- | --- |
| View | Componentes de presentación (`XView.tsx`), sin lógica. |
| ViewModel | Un *custom hook* por pantalla (`useXViewModel.ts`) que expone estado derivado y acciones. |
| Model | Clientes de la API, de Socket.IO y de Supabase, stores y tipos (`model/`). |

- **Regla de dependencias:** una View solo importa su ViewModel y componentes de `ui/`. Un ViewModel importa de `model/`. `model/` nunca importa componentes.
- **TanStack Query** para el CRUD (cuestionarios, historial): maneja caché, carga y errores.
- **Zustand** para la partida. Los eventos del socket llegan fuera de React, y Zustand permite actualizar el store desde ahí sin *providers*. Además, cada ViewModel se suscribe solo a lo que usa, y el estado sobrevive al cambiar de pantalla. Las transiciones de estado se escriben como un *reducer* puro para poder probarlas.
- **Temporizador:** se calcula con el `closesAt` del servidor más el desfase de reloj medido al conectar, nunca como un contador local independiente.

## 6. Comunicación entre servicios

- **nginx como única entrada**, en un solo servicio:
  - `/`: el frontend. En producción sirve el build; en desarrollo reenvía al servidor de Vite.
  - `/api` y `/socket.io`: el backend.
  - `/auth/v1`: Supabase Auth, con el mismo prefijo que usa Supabase en la nube.

  **Por qué un solo servicio:** el frontend compilado son solo archivos estáticos, así que no necesita su propio servidor. nginx los sirve y enruta lo demás, y las rutas quedan en un único lugar, iguales en desarrollo y en producción.

  **Contraparte:** la imagen de producción de nginx compila el frontend, así que un cambio en el frontend obliga a reconstruirla. Separarlos se decidirá junto con el despliegue, porque la forma correcta depende de dónde se despliegue: con un hosting estático, el frontend ni siquiera sería un contenedor.
- **No hace falta un API *gateway* dedicado** (Kong, el de un proveedor de nube…). Hay un solo backend, la autenticación ya la verifica el backend y Supabase trae su propio *gateway* en la nube. Funciones como *rate limiting* o claves de API no están en el alcance; si se necesitan, nginx o el backend las cubren.
- **Mailpit solo existe en local.** Es un servidor de correo falso que atrapa los correos de Supabase Auth (recuperación de contraseña y confirmaciones), para probar esos flujos sin enviar correos reales. El backend no envía correos.
- **Mismo origen por defecto.** El frontend usa rutas relativas, así que en local no hay CORS. Incluso el cliente de Supabase apunta al propio origen, y nginx lo enruta.
- **Dominios separados como opción, sin cambiar código:**
  - en el frontend, `VITE_API_URL` y `VITE_SUPABASE_URL` apuntan al backend y al proyecto de Supabase;
  - en el backend, `CORS_ORIGINS` lista los orígenes permitidos.

  La sesión ya viaja como token, así que no depende de cookies de terceros.

## 7. Base de datos y migraciones

- **El esquema es código.** Las tablas del dominio van en `infra/db/schema.ts`, en el esquema `public`. Drizzle solo administra `public` (`schemaFilter`); el esquema `auth` es de Supabase Auth, que aplica sus propias migraciones.
- **Migraciones generadas, no escritas a mano.** `make db` genera el SQL en `backend/drizzle/`, que se versiona.
- **Se aplican solas al arrancar** el backend (`migrate()` en `server.ts`). Nadie del equipo aplica migraciones a mano, y la imagen de producción no necesita herramientas de desarrollo.
- **Generar es manual, a propósito.** Así nunca aparecen migraciones sin que alguien lo note, y los renombres (donde Drizzle pregunta si es renombre o borrado) se responden conscientemente.

## 8. Pendientes

- Pantallas de registro, inicio de sesión y recuperación de contraseña con `@supabase/supabase-js` (épica 1).
- Revocar las demás sesiones al cambiar la contraseña: `supabase.auth.signOut({ scope: "others" })` después de actualizarla.
- Confirmación de correo al registrarse: en local está desactivada (`GOTRUE_MAILER_AUTOCONFIRM`). Hay que decidir si la épica 1 la pide.
