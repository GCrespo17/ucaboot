# Respaldo y restauración

El esquema `public` (cuestionarios, preguntas, opciones e historial) es la copia que el equipo puede sacar y volver a cargar. Las cuentas viven en el esquema `auth`, que administra Supabase Auth. Las imágenes viven en Supabase Storage y **no entran en `pg_dump`**.

Fecha de la prueba descrita abajo: 24 de noviembre de 2026, contra el Postgres local del `docker compose` (imagen `postgres:17`).

## Qué se respalda y qué no

| Dato | Dónde | Entra en `pg_dump` del esquema `public` |
| --- | --- | --- |
| Cuestionarios, preguntas y opciones | Postgres, esquema `public` | Sí |
| Historial (`games`, `game_players`, `game_questions`) | Postgres, esquema `public` | Sí |
| Cuentas y contraseñas | Supabase Auth, esquema `auth` | No. `host_id` apunta a `auth.users` |
| Portadas e imágenes de pregunta | Disco local o Supabase Storage | No. En la fila solo queda la URL |
| Salas en juego | Redis o memoria del proceso | No. Es estado efímero |

## Política del plan de Supabase

El panel del proyecto es la fuente de la política vigente: el plan gratuito cambia y no incluye recuperación a un punto en el tiempo (PITR). Antes de la defensa hay que abrir Database → Backups y anotar qué retención ofrece el plan ese día. El respaldo que el equipo controla es el `pg_dump` manual de esta página.

- **RPO** del procedimiento manual: desde el último `pg_dump`. No es continuo.
- **RTO** medido en local, con 1 cuestionario, 1 pregunta y 2 opciones: el volcado y la restauración terminaron en la misma invocación, en segundos. En Supabase el tiempo lo marca el tamaño real y la red.

## Volcado

Desde la raíz del repo, con los contenedores arriba. El archivo queda dentro del contenedor y se borra al terminar; no se versiona (`backups/` está en `.gitignore`).

```bash
docker compose exec db pg_dump -U ucaboot -d ucaboot --schema=public --no-owner --no-privileges -f /tmp/ucaboot-public.sql
```

En PowerShell, para copiarlo fuera del contenedor:

```powershell
docker compose cp db:/tmp/ucaboot-public.sql .\backups\ucaboot-public.sql
```

## Restauración probada

Un Postgres vacío ya trae el esquema `public`, y las tablas del dominio referencian `auth.users`. Por eso la prueba hizo tres pasos: crear otra base, crear el esquema `auth` con los `id` de anfitrión que el volcado referencia, y cargar el volcado sin el `CREATE SCHEMA public`.

Resultado del 24 de noviembre de 2026:

- La base restaurada quedó con `quizzes`, `questions`, `options`, `games`, `game_players` y `game_questions`.
- Los conteos coincidieron con el origen: 1 cuestionario, 1 pregunta, 2 opciones, 0 partidas.
- Los índices `quizzes_host_id_updated_at_idx` y `games_host_id_finished_at_idx` estaban presentes.
- La base temporal `ucaboot_restore` se borró al terminar. La base de desarrollo no se tocó.

En Supabase el esquema `auth` ya existe y los usuarios también. Restaurar el `public` ahí no pide crear `auth.users`, salvo que el volcado mencione un `host_id` que ya no esté en ese proyecto: en ese caso la clave foránea falla y hay que revisar el usuario antes de reintentar.

## Lo que el volcado no recupera

Si se pierde el bucket, las filas siguen teniendo `cover_url` e `image_url`, pero el archivo no está. Hay que volver a subir las imágenes o aceptar las URLs rotas. Un respaldo completo del producto suma el `pg_dump` y una copia del bucket (desde el panel de Storage, o `supabase storage` cuando el equipo lo use).
