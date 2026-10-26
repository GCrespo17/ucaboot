# Ucaboot · Modelos de servicio cloud

Qué es cada modelo de servicio y qué pieza de Ucaboot cae en él. Las decisiones de arquitectura están en [arquitectura_inicial.md](arquitectura_inicial.md).

En local todo corre con Docker Compose y nginx es la única entrada. En la nube el frontend y el backend quedan en dominios distintos. El scaffold ya lo permite con `VITE_API_URL`, `VITE_SUPABASE_URL` y `CORS_ORIGINS`.

---

## 1. Qué significa cada modelo

| Modelo | Significado |
| --- | --- |
| **IaaS** | Infraestructura como servicio. Se alquila la máquina virtual y el equipo administra el sistema operativo, la red y lo que instale encima. |
| **PaaS** | Plataforma como servicio. Se entrega la aplicación y la plataforma la ejecuta, con HTTPS, despliegue y escalado básico. El equipo no administra la máquina. |
| **SaaS** | Software como servicio. Se usa un producto ya hecho. El proveedor opera la aplicación completa. |
| **DaaS** | Datos como servicio. El almacenamiento lo opera el proveedor. El equipo define el modelo y consulta los datos, sin instalar ni respaldar el motor. |
| **FaaS** | Función como servicio. Una función se ejecuta por evento y el proveedor la apaga después. No hay un proceso permanente a cargo del equipo. |

---

## 2. IaaS

Ucaboot no alquila máquinas virtuales. Postgres, Auth, el backend y el frontend son servicios administrados. Administrar un sistema operativo no aporta al corte: el trabajo está en el modelo de datos, la API y la partida.

---

## 3. PaaS

| Pieza | Plataforma | Por qué | Defiende |
| --- | --- | --- | --- |
| Backend (Express + Socket.IO) | **Render**, Web Service con Docker | Corre la imagen del `Dockerfile` (target `runtime`) y mantiene el proceso abierto, que es lo que necesitan los WebSockets. | Gabriel Castellano |
| Frontend (build estático de Vite) | **Vercel** o Netlify | Publica archivos estáticos con HTTPS y CDN en cada push. El frontend compilado no necesita su propio servidor. | Emmanuel Santiago |

nginx se queda en el entorno local. En la nube el hosting estático sirve el frontend y Render sirve la API y Socket.IO.

---

## 4. SaaS

| Pieza | Plataforma | Por qué | Defiende |
| --- | --- | --- | --- |
| Cuentas del anfitrión | **Supabase Auth** | Registro, sesión, recuperación de contraseña y reglas de contraseña ya resueltas. El backend no guarda contraseñas: `requireHost` solo verifica el JWT. | José Ojeda |

El participante no tiene cuenta. Entra con PIN y apodo, y su identidad vive el tiempo de la partida.

---

## 5. DaaS

| Pieza | Plataforma | Por qué | Defiende |
| --- | --- | --- | --- |
| Cuestionarios | **Postgres de Supabase** | El mismo motor que en local. Las tablas del dominio (`quizzes`, `questions`, `options`) viven en `public` y `host_id` referencia `auth.users`. Drizzle genera las migraciones y el backend las aplica al arrancar. | José Ojeda |
| Estado de las salas | **Upstash Redis** | Estado efímero de la partida, con acceso rápido y operaciones atómicas, compatible con el cliente `redis` del backend. | Gabriel Crespo |

En el corte 1 el estado de las salas sigue en memoria. Upstash es el destino cuando `RoomStateStore` deje esa implementación. Los cuestionarios sí persisten en Postgres.

---

## 6. FaaS

El CRUD y la partida viven en el proceso de Express. Una función suelta no mantiene la sala, el reloj de `closesAt` ni la conexión de Socket.IO. Ucaboot no despliega funciones.
