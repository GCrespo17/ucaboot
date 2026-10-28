# Épica 8. Podio y cierre

Al terminar la última pregunta, la partida se cierra. El anfitrión presenta el podio y la tabla. El participante ve su puesto. Los resultados quedan guardados para el historial.

## HU-8.1 Ver el podio

**Prioridad:** Corte 2

**Actor:** Anfitrión

**Historia:** Yo como anfitrión, quiero presentar el podio de los tres primeros, para cerrar la partida con los ganadores a la vista de la sala.

**Precondiciones:**

- La última pregunta ya está en revelación, o el anfitrión avanzó desde ella (HU-7.4, FA1).
- Los totales finales ya están calculados.

**Flujo base:**

1. El anfitrión pasa de la última revelación al cierre.
2. El sistema ordena a los participantes con la regla de desempate del índice.
3. El sistema muestra en la pantalla del anfitrión una presentación animada de las tres primeras personas de ese orden, con su puesto y su puntaje.
4. Si hay menos de tres participantes, muestra solo a quienes jugaron.
5. Al cerrar la animación, el anfitrión puede abrir la tabla completa (HU-8.2).

**Criterios de aceptación:**

- El primer puesto es quien encabeza el orden del índice.
- El podio muestra como máximo tres personas. Quien no cabe sigue en el orden completo y aparece en la tabla de HU-8.2.
- Un empate que la regla del índice deja en el mismo puesto se muestra así, y el puesto siguiente se salta, sin pasar de tres personas en el podio.
- La animación no cambia puntajes.
- Los participantes ven su propio cierre en HU-8.3 mientras el anfitrión presenta el podio.

**Flujos alternos:**

- **FA1. Un solo participante.** El podio muestra solo el primer puesto.
- **FA2. Todos empatados.** El sistema aplica la regla de desempate del índice, incluido el orden de entrada al lobby, y muestra solo las tres primeras personas.
- **FA3. El anfitrión recarga durante la animación.** El sistema vuelve a mostrar el mismo podio, sin recalcular otra partida.
- **FA4. No se jugó ninguna pregunta.** No aplica a este flujo: una sala cerrada en lobby no llega al podio (HU-4.7).
- **FA5. Fallo al armar el orden.** El sistema no muestra puestos inventados y permite reintentar con los totales ya guardados.

**Postcondiciones:** La partida está en cierre. El podio visible corresponde al orden final de esa sala.

## HU-8.2 Ver la tabla final

**Prioridad:** Corte 2

**Actor:** Anfitrión

**Historia:** Yo como anfitrión, quiero ver la tabla de todos los participantes, para conocer el puntaje final, los aciertos y el tiempo promedio de cada uno.

**Precondiciones:**

- La sala está en el cierre de HU-8.1.
- Cada participante de la lista fijada tiene total, aciertos y tiempos de las respuestas aceptadas.

**Flujo base:**

1. El anfitrión abre la tabla completa.
2. El sistema lista a todos los participantes de la partida, no solo a los tres primeros.
3. Cada fila muestra apodo, puesto, puntaje final, cantidad de respuestas correctas y tiempo promedio de respuesta.
4. El tiempo promedio usa solo las preguntas en las que hubo respuesta aceptada. Si no hubo ninguna, la fila muestra el promedio como no aplicable.
5. El anfitrión puede volver al podio o salir al detalle del cuestionario cuando los resultados ya quedaron guardados (HU-8.4).

**Criterios de aceptación:**

- La tabla incluye a toda la lista fijada al comenzar, también a quien tiene 0 puntos o se desconectó.
- Las respuestas correctas cuentan aunque hayan otorgado 0 puntos por redondeo.
- Una pregunta no presentada no entra en los aciertos, en el tiempo promedio ni como ausencia.
- El tiempo promedio se expresa en segundos, con un decimal, calculado en el servidor.
- El orden es el de la regla de desempate del índice, el mismo que usa el podio.
- La tabla no permite corregir respuestas.

**Flujos alternos:**

- **FA1. Participante sin respuestas aceptadas.** Puntaje 0, aciertos 0 y tiempo promedio no aplicable.
- **FA2. Preguntas que el participante no alcanzó a ver por una caída.** Esas preguntas cuentan como ausencia: no suman acierto ni entran al promedio.
- **FA3. El anfitrión recarga.** La tabla vuelve a leer el cierre guardado.
- **FA4. Fallo al cargar la tabla.** El podio sigue disponible y la tabla puede reintentarse.

**Postcondiciones:** El anfitrión dispone de la tabla final de esa partida. Los valores coinciden con lo que se guarda en el historial.

## HU-8.3 Ver mi puesto y mi puntaje final

**Prioridad:** Corte 1

**Actor:** Participante

**Historia:** Yo como participante, quiero ver mi puntaje final y mi posición, para saber cómo terminé la partida.

**Precondiciones:**

- La última pregunta ya cerró su puntaje, o la sala cerró por ausencia del anfitrión con lo ya puntuado (HU-10.2 FA3).
- El participante pertenece a la lista de la partida.
- El anfitrión avanzó desde la última revelación (HU-7.4 FA1), o la sala ya llegó a la pantalla final por HU-10.2 FA3.

**Flujo base:**

1. El sistema muestra el apodo, el puntaje final y el puesto.
2. El puesto usa la regla de desempate del índice, la misma de la pantalla simple del anfitrión, del podio y de la tabla.
3. El participante ve cuántas personas había en la lista, para entender el puesto.
4. La pantalla permanece hasta que el participante sale a la unión.

**Criterios de aceptación:**

- El puntaje final es la suma de las preguntas de esa partida.
- El puesto coincide con el que el anfitrión ve para ese apodo.
- Un empate muestra el puesto compartido.
- Esta pantalla no pide cuenta ni ofrece guardar el resultado a nombre del participante.
- Salir de la pantalla no borra el resultado guardado del anfitrión.

**Flujos alternos:**

- **FA1. El participante está desconectado en el momento del cierre.** Al reconectar con su unión vigente, ve este resultado si la sala ya cerró el juego (HU-10.1).
- **FA2. Sale antes de mirar el puesto.** Puede volver a verlo mientras la unión de esa partida siga reconocida en el dispositivo. Si ya no la reconoce, la pantalla de unión no recupera el puesto: el resultado queda del lado del anfitrión.
- **FA3. La partida no llegó a jugar preguntas.** El participante no ve un puesto. Ve el aviso de sala cerrada de HU-5.2.
- **FA4. No estaba en la lista.** El sistema no muestra un puesto de esa partida.

**Postcondiciones:** El participante conoce su puntaje y su puesto finales. La partida, para él, terminó.

## HU-8.4 Conservar los resultados

**Prioridad:** Corte 2

**Actor:** Anfitrión

**Historia:** Yo como anfitrión, quiero que los resultados queden guardados al terminar, para consultarlos después aunque cierre el navegador.

**Precondiciones:**

- La sala llegó a la pantalla final después de la última pregunta (HU-7.4 FA1), o cerró por ausencia del anfitrión con lo ya puntuado (HU-10.2 FA3).
- Los totales, aciertos, tiempos y conteos por opción de las preguntas ya cerradas están calculados.

**Flujo base:**

1. Al llegar a la pantalla final, el sistema guarda una partida terminada a nombre del anfitrión.
2. Guarda fecha de cierre, identificador del anfitrión, título del cuestionario usado, cantidad de participantes y la copia de las preguntas necesaria para el detalle.
3. Guarda por participante: apodo, puesto, puntaje, aciertos y tiempo promedio.
4. Guarda por cada pregunta presentada: texto, opciones, marcas de correcta, cuántos eligieron cada opción y cuántos no respondieron.
5. Guarda cada pregunta no proyectada con el estado no presentada, sin conteos de respuesta.
6. Invalida el PIN para ingresos nuevos. El cuestionario ya quedó libre al llegar a la pantalla final.
7. El historial de la épica 9 lee este registro.

**Criterios de aceptación:**

- El guardado ocurre una sola vez por sala.
- Cerrar el navegador después del guardado no borra el registro.
- Borrar después el cuestionario vivo no borra este registro (HU-2.5).
- Una sala cerrada en el lobby no genera este registro (HU-4.7).
- Una pregunta no presentada no cuenta como ausencia ni entra en el porcentaje de acierto.
- El PIN de una partida terminada no vuelve a abrir la misma sala.

**Flujos alternos:**

- **FA1. Fallo al guardar.** El sistema mantiene la pantalla final y permite reintentar el guardado. El cuestionario ya está libre para edición, porque el bloqueo terminó al llegar a esa pantalla.
- **FA2. Reintento después de un guardado exitoso.** El sistema no crea un segundo registro de la misma sala.
- **FA3. El anfitrión cierra sesión en el cierre.** Si el guardado ya ocurrió, el registro permanece. Si todavía no ocurrió, el guardado sigue pendiente hasta que HU-10.2 recupere al anfitrión o hasta que el servidor lo complete. El cuestionario permanece libre.
- **FA4. Dos cierres simultáneos.** Se conserva un único registro, con los totales ya calculados.

**Postcondiciones:** Existe un resultado persistido de la partida, el PIN en vivo ya no acepta jugadores y el cuestionario puede volver a editarse o a usarse en otra sala.
