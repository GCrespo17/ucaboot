# Borrador del informe · secciones de José Ojeda

Borrador para el PDF del equipo. Las secciones 5 y 14 se cierran con Gabriel Castellano. Los números de costo que dependen del panel hay que copiarlos el día en que se arme el PDF, no inventarlos.

## 1. Resumen ejecutivo

Ucaboot es un clon de Kahoot para la asignatura de Computación en la Nube. Un anfitrión con cuenta crea un cuestionario y abre una sala. Los participantes entran con un PIN y un apodo, sin registrarse, y responden en el tiempo que marca el servidor. Al cierre, el anfitrión conserva el resultado.

El sistema separa dos estados. Lo que debe durar (cuentas, cuestionarios, historial) está en Postgres. Lo que solo importa mientras se juega (sala, respuestas, puntaje parcial) está en memoria y está previsto pasarlo a Redis. El navegador no decide si una respuesta llegó a tiempo: el servidor guarda `closesAt` al abrir la pregunta.

Está publicado con el frontend en Vercel, el backend en Render, la base y la autenticación en Supabase, y la caché prevista en Redis Cloud. El corte de datos cubre el CRUD de cuestionarios, el historial de partidas, la exportación CSV, las imágenes y el respaldo del esquema `public`.

## 2. Alcance funcional

Entran en el producto:

- Cuenta del anfitrión por correo y contraseña. El participante no tiene cuenta.
- Biblioteca de cuestionarios: crear, listar, ver, editar, eliminar, duplicar y reordenar preguntas. Cada pregunta tiene de 2 a 4 opciones, al menos una correcta, un tiempo de 5, 10, 15, 20 o 30 segundos y un puntaje base entre 100 y 2000.
- Portada del cuestionario e imagen de la pregunta, opcionales, en JPEG, PNG o WebP de hasta 2 MB.
- Sala en vivo: PIN, lobby, ronda, revelación y cierre. El puntaje de un acierto es `redondeo(base × tiempo restante / límite)`.
- Historial de las partidas terminadas, con ranking, distribución por opción y porcentaje de acierto. Exportación CSV de esa tabla.
- Un cuestionario con sala abierta no se edita ni se borra. Sí se puede duplicar.

Quedan fuera: chat, modo tarea, cuestionarios públicos, equipos, música y pagos. El detalle está en `docs/specs/`.

## 5. Modelos de servicio cloud

Texto de José. Gabriel Castellano completa el despliegue y los secretos.

| Modelo | Pieza de Ucaboot | Por qué ese modelo |
| --- | --- | --- |
| IaaS | Ninguna | No alquilamos máquinas ni administramos un sistema operativo |
| PaaS | Frontend en Vercel y backend en Render | Entregamos la aplicación. La plataforma pone HTTPS y el proceso. El backend va en contenedor porque Socket.IO necesita un proceso que no se apague entre peticiones |
| BaaS | Supabase Auth y Supabase Storage | La identidad y los archivos se consumen por API. El backend no guarda contraseñas: verifica el JWT |
| DBaaS | Postgres de Supabase y Redis Cloud | El proveedor opera el motor. Nosotros definimos tablas y consultas. Redis Cloud es el destino del estado efímero; en este corte las salas siguen en memoria |
| FaaS | Ninguna | Una función suelta no sostiene la sala, el reloj `closesAt` ni el WebSocket |

nginx solo existe en local, como única entrada. En la nube el frontend y el backend están en dominios distintos. El detalle está en `docs/modelos-cloud.md`.

## 7. Datos

El anfitrión solo ve sus filas. `host_id` referencia `auth.users`. Si el id no existe o es de otra cuenta, la API responde 404: no confirma que el recurso exista.

El historial no apunta a la pregunta viva. Al cerrar la sala se copia el título, los textos, las opciones, los puestos y los conteos. Borrar el cuestionario pone `games.quiz_id` en null y la partida sigue consultable. `room_key` (`pin` más la fecha de creación de la sala) es único, así que un reintento no duplica la partida.

Las opciones de esa copia van en jsonb. Guardarlas en las tablas vivas obligaría a no editar nunca un cuestionario ya jugado, o a recalcular mal el historial.

Las imágenes no se guardan en Postgres. La columna lleva la URL. En local el archivo está en un volumen de Docker y se sirve en `/api/files`. En la nube el archivo está en un bucket de Supabase Storage, público para lectura. Escribe solo el backend, con la clave de servicio, que no está en el repositorio. El tipo se valida por los bytes del archivo.

Los índices que usan las consultas reales son `(host_id, updated_at desc)` en cuestionarios y `(host_id, finished_at desc)` en partidas. El `EXPLAIN` local los usa. No hizo falta otro índice: el detalle de una partida lee como máximo 50 jugadores. El procedimiento y el resultado están en `docs/modelo-datos.md` y `docs/respaldo.md`.

## 14. Costos

José anota la parte de datos. Gabriel Castellano anota Render, Vercel y Redis Cloud. Copiar las cifras del panel el día del PDF.

| Servicio | Qué mirar en el panel | Qué anotar |
| --- | --- | --- |
| Supabase Postgres | Plan, tamaño de la base, si el proyecto se pausa por inactividad | Límite del plan gratuito y el tamaño medido de `public` |
| Supabase Auth | Usuarios del proyecto | Entra en el mismo proyecto. No hay costo aparte en el plan gratuito |
| Supabase Storage | Tamaño del bucket `quiz-images` y el límite del plan | Las imágenes no están en el `pg_dump` |
| Respaldo | Database → Backups | Si el plan incluye respaldo automático y por cuántos días. El procedimiento manual está en `docs/respaldo.md` |

Mientras el proyecto quepa en el plan gratuito, el costo de datos para la defensa es cero pesos, con el límite de que un proyecto inactivo se puede pausar y hay que despertarlo antes de la demo. Si el panel muestra otro número, ese número reemplaza esta frase.
