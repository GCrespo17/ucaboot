# Épica 5. Unión del participante

El participante entra a una sala con PIN y apodo, espera en el lobby y puede salir o ser expulsado. No necesita cuenta. Las reglas del apodo están en el [índice](00-indice.md).

## HU-5.1 Unirse con PIN y apodo

**Prioridad:** Corte 1

**Actor:** Participante

**Historia:** Yo como participante, quiero unirme con el PIN y un apodo, para jugar sin registrarme.

**Precondiciones:**

- Existe una sala en lobby con ese PIN.
- El participante no está unido a otra sala en este dispositivo.
- El apodo cumple las reglas del índice y no está en uso en esa sala.
- La sala no alcanzó su máximo.

**Flujo base:**

1. El participante abre la pantalla de unión, desde la dirección de la aplicación o desde un QR (HU-4.3).
2. Ingresa el PIN de 6 dígitos. Si llegó por QR, el PIN ya está completado y puede corregirlo.
3. Ingresa un apodo.
4. Confirma la entrada.
5. El sistema comprueba que la sala esté en lobby, que haya cupo y que el apodo sea válido y único.
6. El sistema une al participante a la sala.
7. El apodo aparece en el lobby del anfitrión (HU-4.4).
8. El participante pasa a la pantalla de espera (HU-5.2).

**Criterios de aceptación:**

- No se pide correo ni contraseña.
- El PIN se acepta solo si tiene 6 dígitos y corresponde a una sala en lobby.
- El apodo tiene entre 2 y 20 caracteres tras recortar espacios y es único en la sala sin distinguir mayúsculas.
- El participante queda identificado por ese apodo durante la partida.
- Un mismo navegador no queda unido a dos salas a la vez.

**Flujos alternos:**

- **FA1. PIN inexistente.** Se dispara si no hay sala abierta con ese PIN. El sistema no une al participante y lo dice sin mostrar datos de otras salas.
- **FA2. PIN de una partida ya comenzada.** El sistema no agrega al participante e indica que la partida ya empezó.
- **FA3. PIN de una sala cerrada o terminada.** El sistema responde como PIN inexistente.
- **FA4. Apodo vacío o fuera de longitud.** El sistema no une y señala el campo.
- **FA5. Apodo duplicado.** Se dispara si otro participante de la misma sala ya usa ese apodo, sin distinguir mayúsculas. El sistema no une y pide otro apodo. El PIN escrito se conserva.
- **FA6. Sala llena.** Se dispara si los unidos alcanzan el máximo de HU-4.8. El sistema no une e indica que no hay cupo.
- **FA7. PIN incompleto.** Se dispara si no hay 6 dígitos. El sistema no consulta la sala y señala el campo.
- **FA8. Ya está unido a esta sala.** Se dispara si ese dispositivo ya entró con un apodo. El sistema lo devuelve a la espera o a la ronda en curso, sin crear otro jugador.
- **FA9. Ya está unido a otra sala.** Si esa sala sigue en lobby, el sistema pide salir con HU-5.3 antes de entrar a otra. Si la partida ya comenzó, el dispositivo permanece en ella hasta que termine y el sistema lo devuelve a la ronda o al cierre en curso.
- **FA10. Fallo al unir.** El sistema no muestra al participante en el lobby y permite reintentar.

**Postcondiciones:** El participante está en la sala, visible en el lobby, con un apodo único. En los flujos alternos no se crea un jugador nuevo.

## HU-5.2 Esperar en el lobby

**Prioridad:** Corte 1

**Actor:** Participante

**Historia:** Yo como participante, quiero ver que ya entré y que la partida aún no empieza, para saber que debo esperar al anfitrión.

**Precondiciones:**

- El participante está unido a una sala que sigue en lobby.

**Flujo base:**

1. El sistema muestra el apodo aceptado y un mensaje de espera.
2. El participante permanece en esa pantalla.
3. Cuando el anfitrión comienza (HU-4.6), la pantalla pasa a la primera ronda sin pedir otro PIN.
4. Si el anfitrión cierra la sala (HU-4.7), el participante ve el aviso de cierre y vuelve a la unión.

**Criterios de aceptación:**

- La espera muestra el apodo con el que entró.
- La espera no muestra las preguntas ni las opciones.
- El paso a la primera pregunta ocurre cuando la sala comienza, sin recargar a mano.
- El participante no puede adelantar el inicio.

**Flujos alternos:**

- **FA1. La sala se cierra.** El sistema avisa que el anfitrión cerró la sala y deja libre al participante para unirse a otra.
- **FA2. El participante es expulsado.** El sistema aplica HU-5.4.
- **FA3. El participante abandona.** El sistema aplica HU-5.3.
- **FA4. Se pierde la conexión durante la espera.** Al reconectar con la misma unión vigente, el participante vuelve a la espera si la sala sigue en lobby, o a la ronda si ya comenzó (HU-10.1).
- **FA5. La unión ya no es válida.** Se dispara si la sala desapareció mientras estaba desconectado. El sistema lo lleva a la pantalla de unión.

**Postcondiciones:** El participante sigue en la sala hasta que la partida comienza, sale, es expulsado o la sala se cierra.

## HU-5.3 Abandonar la sala antes de que empiece

**Prioridad:** Corte 2

**Actor:** Participante

**Historia:** Yo como participante, quiero salir del lobby antes de que empiece la partida, para liberar mi apodo si entré por error.

**Precondiciones:**

- El participante está unido a una sala que sigue en lobby.

**Flujo base:**

1. El participante elige salir.
2. El sistema lo desvincula de la sala y libera el apodo.
3. El apodo desaparece del lobby del anfitrión.
4. El sistema muestra la pantalla de unión.

**Criterios de aceptación:**

- Salir en el lobby no pide confirmación adicional más allá de la acción de salir.
- El apodo queda disponible de inmediato.
- El conteo del anfitrión baja.
- No queda puntaje ni historial, porque la partida no empezó.
- Después de salir, ese dispositivo puede unirse de nuevo con el mismo PIN y el mismo apodo, si la sala sigue en lobby.

**Flujos alternos:**

- **FA1. La partida comienza mientras sale.** Si el comienzo se acepta primero, el participante ya está en la lista fijada y esta salida de lobby no aplica: permanece en la partida. Si la salida se acepta primero, no queda en la lista que empieza.
- **FA2. La sala ya se cerró o ya fue expulsado.** El sistema lo lleva a la pantalla de unión sin un segundo abandono.
- **FA3. Fallo al salir.** El participante sigue en la espera y puede reintentar.

**Postcondiciones:** El participante ya no está en la sala y su apodo está libre.

## HU-5.4 Ser expulsado

**Prioridad:** Corte 2

**Actor:** Participante

**Historia:** Yo como participante, quiero enterarme si el anfitrión me expulsó, para saber que ya no estoy en la sala.

**Precondiciones:**

- El participante está unido al lobby.
- El anfitrión confirma la expulsión de su apodo (HU-4.5).

**Flujo base:**

1. El sistema recibe la expulsión de ese participante.
2. Lo desvincula y libera el apodo.
3. Muestra un aviso de que el anfitrión lo sacó de la sala.
4. Lo lleva a la pantalla de unión.
5. El PIN puede usarse otra vez si la sala sigue en lobby y hay cupo, incluso con el mismo apodo.

**Criterios de aceptación:**

- El aviso se muestra en el dispositivo del expulsado sin exigirle recargar.
- Ese dispositivo deja de recibir el estado de la sala hasta una nueva unión.
- El apodo desaparece del lobby del anfitrión.
- La expulsión no impide una entrada nueva mientras el lobby siga abierto.

**Flujos alternos:**

- **FA1. El participante ya había salido.** El sistema no muestra un aviso tardío de expulsión si ya está en la pantalla de unión por HU-5.3.
- **FA2. La conexión está caída en el momento de la expulsión.** Al volver, si la unión ya no existe, el sistema muestra el aviso de expulsión y la pantalla de unión, no la espera.
- **FA3. Intento de seguir la sala con la unión vieja.** El sistema rechaza el estado anterior y exige un ingreso nuevo.

**Postcondiciones:** El participante queda fuera de la sala. La sala sigue abierta para los demás.
