# Ucaboot · Modelos de servicio cloud

Qué es cada modelo de servicio y qué pieza de Ucaboot cae en él. Las decisiones de arquitectura están en [arquitectura_inicial.md](arquitectura_inicial.md). El despliegue real está en el README: https://ucaboot.vercel.app/.

En local todo corre con Docker Compose y nginx es la única entrada. En la nube el frontend y el backend quedan en dominios distintos. El scaffold ya lo permite con `VITE_API_URL`, `VITE_SUPABASE_URL` y `CORS_ORIGINS`.

---

## 1. Qué significa cada modelo

| Modelo | Significado |
| --- | --- |
| **IaaS** | Infraestructura como servicio. Se alquila la máquina virtual y el equipo administra el sistema operativo, la red y lo que instale encima. |
| **PaaS** | Plataforma como servicio. Se entrega la aplicación y la plataforma la ejecuta, con HTTPS, despliegue y escalado básico. El equipo no administra la máquina. |
| **SaaS** | Software como servicio. Se usa un producto ya hecho. El proveedor opera la aplicación completa. |
| **BaaS** | Backend como servicio. Un proveedor entrega una capacidad de backend lista (identidad, archivos) y la aplicación la consume por API. Es una forma de SaaS acotada a esa capacidad. |
| **DBaaS** | Base de datos como servicio. El motor lo opera el proveedor. El equipo define el modelo y consulta los datos, sin instalar ni respaldar el motor. |
| **FaaS** | Función como servicio. Una función se ejecuta por evento y el proveedor la apaga después. No hay un proceso permanente a cargo del equipo. |

---

## 2. IaaS

Ucaboot no alquila máquinas virtuales. Postgres, Auth, Storage, el backend y el frontend son servicios administrados. Administrar un sistema operativo no aporta al corte: el trabajo está en el modelo de datos, la API y la partida.

---

## 3. PaaS

| Pieza | Plataforma | Por qué | Defiende |
| --- | --- | --- | --- |
| Backend (Express + Socket.IO) | **Render**, Web Service con Docker | Corre la imagen del `Dockerfile` (target `runtime`) y mantiene el proceso abierto, que es lo que necesitan los WebSockets. | Gabriel Castellano |
| Frontend (build estático de Vite) | **Vercel** | Publica archivos estáticos con HTTPS y CDN en cada push. El frontend compilado no necesita su propio servidor. Ya está en https://ucaboot.vercel.app/. | Emmanuel Santiago |

nginx se queda en el entorno local. En la nube Vercel sirve el frontend y Render sirve la API y Socket.IO.

---

## 4. SaaS y BaaS

| Pieza | Plataforma | Modelo | Por qué | Defiende |
| --- | --- | --- | --- | --- |
| Cuentas del anfitrión | **Supabase Auth** | BaaS | Registro, sesión, recuperación de contraseña y reglas de contraseña ya resueltas. El backend no guarda contraseñas: `requireHost` solo verifica el JWT. | José Ojeda |
| Imágenes de portada y de pregunta | **Supabase Storage** | BaaS (almacenamiento de objetos) | Archivos fuera de Postgres, con URL pública de lectura. El backend valida tipo y tamaño y escribe con la clave de servicio. | José Ojeda |

El participante no tiene cuenta. Entra con PIN y apodo, y su identidad vive el tiempo de la partida.

---

## 5. DBaaS

| Pieza | Plataforma | Por qué | Defiende |
| --- | --- | --- | --- |
| Cuestionarios e historial | **Postgres de Supabase** | El mismo motor que en local. Las tablas del dominio (`quizzes`, `questions`, `options`) y las del historial (`games`, `game_players`, `game_questions`) viven en `public`. `host_id` referencia `auth.users`. Drizzle genera las migraciones y el backend las aplica al arrancar. Borrar el cuestionario vivo no borra el historial: la partida guarda su propia copia. | José Ojeda |
| Estado de las salas | **Redis Cloud** | Estado efímero de la partida, con acceso rápido y operaciones atómicas, compatible con el cliente `redis` del backend. | Gabriel Crespo |

En este corte el estado de las salas sigue en memoria (`InMemoryRoomStateStore`). Redis Cloud es el destino cuando `RoomStateStore` deje esa implementación. Los cuestionarios y el historial sí persisten en Postgres.

---

## 6. FaaS

El CRUD, el historial y la partida viven en el proceso de Express. Una función suelta no mantiene la sala, el reloj de `closesAt` ni la conexión de Socket.IO. Ucaboot no despliega funciones.
