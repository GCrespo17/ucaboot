# Épica 10. Resiliencia de la partida

La partida sobrevive a caídas breves de red. El participante vuelve con su puntaje. El anfitrión recupera el control de la misma sala. Si alguien se desconecta, los demás siguen.

La unión del participante queda reconocida por un token guardado en su dispositivo al completar HU-5.1. La sala del anfitrión queda reconocida por su cuenta.

## HU-10.1 Reconectar al participante

**Prioridad:** Corte 2

**Actor:** Participante

**Historia:** Yo como participante, quiero volver a la partida después de una caída de red, para no perder el puntaje ni las respuestas que ya había enviado.

**Precondiciones:**

- El participante entró con HU-5.1 y su dispositivo conserva el token de unión.
- La sala todavía existe: está en lobby, en una pregunta, en una revelación o en el cierre.

**Flujo base:**

1. El participante recupera la conexión o vuelve a abrir la aplicación en el mismo dispositivo.
2. El sistema reconoce el token de unión.
3. Restaura el apodo, las respuestas ya aceptadas y el puntaje acumulado.
4. Lo coloca en la pantalla que corresponde al estado actual de la sala: espera, respuesta, revelación de su resultado o puesto final.
5. Si la pregunta en curso sigue abierta y todavía no tiene respuesta aceptada, puede responder una vez (HU-6.2).
6. El lobby del anfitrión no lo duplica: sigue siendo el mismo jugador.

**Criterios de aceptación:**

- El puntaje restaurado es el último calculado en el servidor, no uno reconstruido en el dispositivo.
- Una respuesta ya aceptada no se puede cambiar al volver.
- El apodo sigue reservado para ese token mientras la sala exista.
- Reconectar no crea un segundo participante en el conteo.
- Si la sala ya está en cierre, ve HU-8.3.

**Flujos alternos:**

- **FA1. El token ya no es válido.** Se dispara si la sala se cerró en el lobby, el participante fue expulsado o el token se descartó al salir. El sistema muestra el aviso que corresponda y la pantalla de unión, sin puntaje.
- **FA2. La pregunta cerró durante la caída.** El sistema no acepta una respuesta tardía. Muestra el resultado de esa pregunta o la pregunta nueva si el anfitrión ya avanzó.
- **FA3. La pulsación no había sido aceptada.** Si la ronda sigue abierta, el participante puede enviar una respuesta. Si ya cerró, esa pregunta vale 0.
- **FA4. Otro dispositivo intenta usar una copia vieja del token.** El sistema mantiene una sola unión activa: la más reciente que presente el token. La anterior deja de recibir estado.
- **FA5. La partida ya fue guardada y el token de cierre venció en el dispositivo.** El participante no recupera el puesto desde la pantalla de unión. El resultado sigue en el historial del anfitrión.
- **FA6. Fallo al restaurar.** El sistema no muestra un puntaje local distinto del servidor y permite reintentar la reconexión.

**Postcondiciones:** El mismo participante sigue en la sala, con su historial de respuestas y su puntaje de servidor.

## HU-10.2 Reconectar al anfitrión

**Prioridad:** Corte 2

**Actor:** Anfitrión

**Historia:** Yo como anfitrión, quiero volver a mi sala después de una caída o de cerrar sesión, para seguir dirigiendo la misma partida.

**Precondiciones:**

- Existe una sala abierta creada por esa cuenta.
- El anfitrión inicia sesión de nuevo en HU-1.2, o recupera la sesión que no llegó a invalidarse.

**Flujo base:**

1. El anfitrión entra a su cuenta.
2. El sistema detecta la sala abierta de esa cuenta.
3. Lo lleva a esa sala, no a una sala nueva.
4. Muestra el estado vigente: lobby con la lista actual, pregunta en curso con el tiempo restante del servidor, revelación, podio o tabla.
5. El anfitrión recupera las acciones de su estado: expulsar y comenzar en el lobby, o avanzar cuando la pregunta esté en revelación.
6. El PIN sigue siendo el mismo.

**Criterios de aceptación:**

- Reconectar no genera otro PIN ni reinicia puntajes.
- El tiempo restante que ve es el del servidor.
- Si la recepción cerró durante la ausencia, al volver ve la revelación, no una ronda abierta.
- Solo la cuenta dueña recupera el control.
- Mientras el anfitrión falta, el temporizador de una pregunta abierta sigue corriendo y se cierra solo (HU-6.3).

**Flujos alternos:**

- **FA1. No hay sala abierta.** El sistema muestra el panel de cuestionarios.
- **FA2. Ausencia en el lobby mayor de 15 minutos.** Se dispara si la cuenta dueña no tiene ninguna sesión conectada a esa sala durante 15 minutos seguidos y la partida no ha comenzado. El sistema cierra la sala como en HU-4.7: invalida el PIN, avisa a los participantes y no guarda historial.
- **FA3. Ausencia durante la partida mayor de 15 minutos en revelación o cierre sin guardar.** El temporizador de la pregunta abierta igual llega a cero y el puntaje de lo ya jugado queda calculado. Si pasan 15 minutos sin un anfitrión conectado después de ese cierre de pregunta, o en el cierre final todavía no guardado, el sistema cierra la sala, libera el cuestionario y guarda lo ya puntuado con HU-8.4. Las preguntas que no se alcanzaron a proyectar quedan como no presentadas. Avisa a los participantes que la partida terminó porque el anfitrión no volvió.
- **FA4. El anfitrión vuelve dentro de los 15 minutos.** La sala sigue donde estaba y FA2 o FA3 no se aplican.
- **FA5. Dos sesiones de la misma cuenta.** Ambas pueden ver la sala. Una acción de comenzar, avanzar, expulsar o cerrar se aplica una sola vez, en el estado vigente.
- **FA6. Fallo al recuperar el estado.** El sistema no crea una sala paralela y permite reintentar.

**Postcondiciones:** El anfitrión dueño vuelve a controlar la misma sala, o la sala quedó cerrada por la ausencia descrita en FA2 o FA3.

## HU-10.3 Seguir si un participante se desconecta

**Prioridad:** Corte 2

**Actor:** Anfitrión

**Historia:** Yo como anfitrión, quiero que la partida continúe cuando un participante pierde la conexión, para no detener a toda la sala.

**Precondiciones:**

- La partida ya comenzó.
- Un participante de la lista fijada deja de estar conectado.

**Flujo base:**

1. El sistema detecta la ausencia de ese participante.
2. Lo mantiene en la lista, con su apodo, sus respuestas aceptadas y su puntaje.
3. El temporizador de la pregunta actual no se pausa.
4. Al cerrar la recepción, si ese participante no tiene respuesta aceptada, la pregunta le vale 0 y cuenta como ausencia.
5. El anfitrión sigue viendo el conteo de respuestas de quienes sí enviaron.
6. El participante puede volver con HU-10.1 hasta que la sala termine.
7. El ranking y la tabla final lo incluyen con lo que haya acumulado.

**Criterios de aceptación:**

- La desconexión de un participante no cierra la sala ni cambia el PIN.
- La desconexión no expulsa ni libera el apodo mientras la sala exista.
- Los demás participantes siguen respondiendo.
- El cierre por «todos respondieron» considera respondido a quien ya tiene respuesta aceptada. Quien está desconectado y no respondió no bloquea el cierre por tiempo: el cierre anticipado solo ocurre si todos los de la lista, conectados o no, ya tienen respuesta aceptada.
- El conteo de la revelación sigue usando a toda la lista fijada. El desconectado ausente suma en «no respondieron», no desaparece del denominador.

**Flujos alternos:**

- **FA1. Se desconecta después de responder.** Su respuesta y sus puntos permanecen. El conteo del anfitrión no baja.
- **FA2. Se desconecta en el lobby, antes de comenzar.** No aplica esta historia. Sigue unido hasta abandonar (HU-5.3), ser expulsado (HU-4.5) o hasta que el anfitrión comience. Si está desconectado al comenzar y no salió, entra en la lista fijada.
- **FA3. No vuelve en toda la partida.** Permanece en la tabla final con los puntos que alcanzó y con ausencias en el resto. No se borra su fila.
- **FA4. Vuelve en una pregunta posterior.** Ve la pregunta en curso si está abierta, o el estado vigente. Las preguntas que no alcanzó a responder siguen en 0.
- **FA5. Se cae el anfitrión y también un participante.** Cada uno sigue su historia: HU-10.2 y esta. El temporizador no espera a ninguno de los dos.
- **FA6. Falsa desconexión breve.** Si el participante sigue enviando estado, no se le trata como ausente y su pantalla no se reinicia.

**Postcondiciones:** La sala continúa con la lista original. El participante desconectado conserva su lugar, su apodo y su puntaje hasta que la partida termina o vuelve.
