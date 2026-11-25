# Épica 9. Historial

El anfitrión consulta las partidas que ya quedaron guardadas. Los registros nacen en [HU-8.4](epica-08-podio.md).

## HU-9.1 Listar partidas pasadas

**Prioridad:** Corte 2

**Actor:** Anfitrión

**Historia:** Yo como anfitrión, quiero ver la lista de mis partidas terminadas, para encontrar una sesión por su fecha, su cuestionario y su número de participantes.

**Precondiciones:**

- Hay una sesión de anfitrión activa.
- Las partidas listadas son las guardadas por HU-8.4 para esa cuenta.

**Flujo base:**

1. El anfitrión abre el historial.
2. El sistema muestra sus partidas terminadas, de la más reciente a la más antigua.
3. Cada elemento muestra fecha de cierre, título del cuestionario y cantidad de participantes.
4. El anfitrión puede abrir el detalle de una de ellas (HU-9.2).

**Criterios de aceptación:**

- La lista solo incluye partidas del anfitrión autenticado.
- Una sala todavía en lobby o en juego no aparece.
- Una sala cerrada antes de comenzar no aparece.
- Una partida guardada por ausencia del anfitrión (HU-10.2 FA3) sí aparece, aunque no se hayan proyectado todas las preguntas.
- El título mostrado es el de la copia jugada, aunque el cuestionario vivo haya cambiado de nombre o se haya eliminado.
- La lista vacía explica que todavía no hay partidas terminadas.

**Flujos alternos:**

- **FA1. Sin partidas.** El sistema muestra el estado vacío.
- **FA2. Sesión cerrada.** El sistema no muestra fechas ni títulos y pide iniciar sesión.
- **FA3. Fallo al consultar.** El sistema permite reintentar sin perder la sesión.
- **FA4. Partida de otro anfitrión.** No aparece en esta lista aunque el título coincida.

**Postcondiciones:** El anfitrión ve el inventario de sus partidas terminadas. La consulta no las modifica.

## HU-9.2 Ver el detalle de una partida

**Prioridad:** Corte 2

**Actor:** Anfitrión

**Historia:** Yo como anfitrión, quiero abrir el detalle de una partida pasada, para revisar el ranking, la distribución de respuestas y el porcentaje de acierto.

**Precondiciones:**

- Hay una sesión de anfitrión activa.
- La partida terminada pertenece a esa cuenta.

**Flujo base:**

1. El anfitrión elige una partida de la lista.
2. El sistema muestra la tabla final guardada: apodo, puesto, puntaje, aciertos y tiempo promedio.
3. El sistema muestra cada pregunta presentada, con cuántos eligieron cada opción y cuántos no respondieron.
4. El sistema marca cada pregunta no presentada con ese estado, sin distribuirla como si nadie hubiera respondido.
5. El sistema muestra el porcentaje de acierto global: respuestas correctas aceptadas divididas entre las oportunidades de las preguntas presentadas, que es participantes por preguntas presentadas, redondeado a un decimal.
6. El anfitrión puede volver a la lista.

**Criterios de aceptación:**

- Los números coinciden con el registro de HU-8.4 y no se recalculan a partir del cuestionario vivo.
- El porcentaje de acierto usa como numerador solo las respuestas marcadas correctas, incluidos los aciertos de 0 puntos por redondeo.
- Las ausencias de una pregunta presentada no cuentan como acierto y sí cuentan en el denominador.
- Las preguntas no presentadas quedan fuera del numerador y del denominador.
- Un anfitrión no abre el detalle de una partida ajena: el sistema responde como si no existiera.
- El detalle no modifica el registro.

**Flujos alternos:**

- **FA1. Partida inexistente o ajena.** El sistema vuelve a la lista e indica que no está disponible.
- **FA2. Sin respuestas en las preguntas presentadas.** El porcentaje de acierto es 0. Cada pregunta presentada muestra ceros y las ausencias completas. Las no presentadas siguen marcadas como no presentadas.
- **FA3. El cuestionario vivo ya no existe.** El detalle sigue completo gracias a la copia guardada.
- **FA4. Sesión cerrada o fallo al cargar.** El sistema no muestra datos parciales de otra partida y permite volver a la lista o reintentar.

**Postcondiciones:** El anfitrión ve el detalle persistido. El registro permanece igual.

## HU-9.3 Exportar una partida a CSV

**Prioridad:** Corte 2

**Actor:** Anfitrión

**Historia:** Yo como anfitrión, quiero descargar el resultado de una partida en CSV, para llevarlo a una hoja de cálculo o a un registro de calificaciones.

**Precondiciones:**

- Hay una sesión de anfitrión activa.
- La partida terminada pertenece a esa cuenta y fue guardada por HU-8.4.

**Flujo base:**

1. El anfitrión elige exportar una partida del historial.
2. El sistema arma un archivo CSV con una fila por participante de la lista guardada.
3. Cada fila trae puesto, apodo, puntaje, aciertos, cantidad de respuestas aceptadas y tiempo promedio en segundos.
4. El navegador descarga el archivo. El registro no cambia.

**Criterios de aceptación:**

- El archivo es `text/csv` en UTF-8, con marca de orden de bytes, para que una hoja de cálculo muestre bien los acentos.
- El nombre del archivo es `ucaboot-` seguido de la fecha de cierre en UTC y `.csv`.
- El orden de las filas es el de la tabla guardada.
- El tiempo promedio usa un decimal. Si el participante no tuvo respuestas aceptadas, esa celda queda vacía.
- Un apodo con coma, comilla o salto de línea se escapa. Un apodo que empieza por `=`, `+`, `-` o `@` no se interpreta como fórmula.
- Una partida de otra cuenta responde como si no existiera.
- La descarga no modifica el registro.

**Flujos alternos:**

- **FA1. Partida inexistente o ajena.** El sistema no entrega un archivo y responde como en HU-9.2 FA1.
- **FA2. Participante sin respuestas aceptadas.** Puntaje 0, aciertos 0 y tiempo promedio vacío.
- **FA3. Sesión cerrada.** El sistema no entrega el archivo y pide iniciar sesión.

**Postcondiciones:** El anfitrión tiene el archivo. El registro permanece igual.
