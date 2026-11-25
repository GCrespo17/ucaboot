# Lo que no se puede cerrar desde el repositorio

Estas tareas son de José y no quedan hechas con un commit. El código y los documentos ya están en las ramas. Esto es lo que hay que hacer en los paneles y con el equipo.

## Producción

- En Supabase, después de que se mergee `feat/HU-8.4-guardar-resultados` y Render redespliegue, confirmar que existen `games`, `game_players` y `game_questions`. El backend aplica la migración al arrancar. Si el servicio está dormido, despertarlo antes.
- Crear el bucket de Storage (lectura pública, sin política de escritura para la clave anónima). Pasarle a Gabriel Castellano los nombres `STORAGE_DRIVER=supabase`, `SUPABASE_SERVICE_ROLE_KEY` y `SUPABASE_STORAGE_BUCKET` para que los ponga en Render. La clave no se escribe en el chat ni en el repo.
- Cuando Gabriel Crespo llame a `recordFinishedGame` al pasar la sala a `final`, jugar una partida en https://ucaboot.vercel.app/ y comprobar que aparece en `GET /api/games` y que el CSV se descarga.
- Anotar, para la sección 14, el tamaño de la base, el del bucket y si el plan gratuito pausa el proyecto.

En local, el 24 de noviembre de 2026, la migración del historial ya se aplicó al Postgres de Docker y el respaldo se restauró una vez. El detalle está en `docs/respaldo.md`.

## Equipo

- Pedir revisión de cada PR. No se mergea a `develop` sin la aprobación de otra persona. El orden es el de la lista de ramas: modelos cloud, historial, CSV, duplicar, reordenar, bloqueo, portada, imagen, respaldo, modelo de datos, autorización, este borrador.
- Avisar a Emmanuel cuando estén mergeadas las rutas nuevas: historial, CSV, duplicar, reordenar, imágenes y el error `QUIZ_IN_GAME`.
- Avisar a Gabriel Crespo que `gameHistoryService.recordFinishedGame(room, "completed")` se llama después de guardar la sala en `final`, y con `"hostAbsent"` cuando exista ese cierre. Está descrito en `docs/contrato-eventos.md`.
- Revisar, en el PR en que las salas pasen a Redis, que `findOpenByHost` siga devolviendo solo lobby, pregunta y revelación. El bloqueo de edición depende de eso.
- Antes del corte 2, explicar al equipo el modelo, el respaldo y el historial.
