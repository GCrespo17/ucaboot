# Épica 6. Ronda en tiempo real

Cada pregunta se muestra a la vez en la pantalla del anfitrión y en los dispositivos de los participantes. El tiempo, los colores y el puntaje siguen las reglas del [índice](00-indice.md).

## HU-6.1 Proyectar la pregunta

**Prioridad:** Corte 1

**Actor:** Anfitrión

**Historia:** Yo como anfitrión, quiero proyectar la pregunta con su texto y sus opciones, para que la sala vea qué se está preguntando.

**Precondiciones:**

- La sala ya comenzó (HU-4.6) o el anfitrión avanzó a una pregunta (HU-7.4).
- Esa pregunta todavía no ha revelado resultados.

**Flujo base:**

1. El sistema toma la pregunta actual de la copia jugable.
2. En la pantalla del anfitrión muestra el texto, la imagen si existe, las opciones en orden y la pareja color-forma de cada una.
3. Muestra el temporizador de HU-6.3.
4. No marca todavía cuál opción es correcta.
5. Muestra cuántos participantes ya respondieron, sin decir qué eligieron.
6. Los participantes ven su propia vista en HU-6.2.

**Criterios de aceptación:**

- Texto, imagen, orden y cantidad de opciones coinciden con la copia fijada al crear la sala.
- Si la pregunta no tiene imagen, la pantalla no reserva un error: muestra el texto y las opciones.
- Los colores y formas siguen el orden del índice: rojo/triángulo, azul/rombo, amarillo/círculo y verde/cuadrado.
- La respuesta correcta permanece oculta hasta HU-7.1.
- El conteo de respuestas no baja cuando alguien ya respondió, tampoco si ese participante se desconecta después (HU-10.3).

**Flujos alternos:**

- **FA1. Imagen no disponible.** El sistema muestra el texto y las opciones, e indica que la imagen no cargó. La ronda sigue.
- **FA2. El anfitrión recarga la proyección.** El sistema vuelve a pintar la misma pregunta, el mismo tiempo restante y el mismo conteo, sin reiniciar la ronda.
- **FA3. La pregunta ya cerró.** El sistema muestra la revelación de HU-7.1, no otra vez el enunciado en juego.
- **FA4. Sesión del anfitrión caída.** La pregunta sigue activa para los participantes. Al volver, el anfitrión retoma la proyección según HU-10.2.

**Postcondiciones:** La sala está viendo la misma pregunta, con el temporizador en curso y las correctas ocultas.

## HU-6.2 Responder desde el dispositivo

**Prioridad:** Corte 1

**Actor:** Participante

**Historia:** Yo como participante, quiero elegir una opción por su color y su forma antes de que se acabe el tiempo, para responder sin ver el texto en mi pantalla.

**Precondiciones:**

- El participante pertenece a la lista fijada al comenzar.
- La pregunta actual está abierta a respuestas.
- El participante todavía no ha enviado una respuesta para esa pregunta.

**Flujo base:**

1. El participante ve tantas opciones como tenga la pregunta, cada una con su color y su forma, en el mismo orden que la proyección.
2. Ve el temporizador.
3. Elige una opción.
4. El sistema registra la elección en el servidor, junto con el instante de aceptación.
5. El sistema bloquea las demás opciones de esa pregunta.
6. El participante ve que su respuesta quedó enviada y espera el cierre de la ronda.
7. El conteo del anfitrión aumenta en uno.

**Criterios de aceptación:**

- El participante no ve el texto de las opciones ni cuál es correcta.
- Solo puede elegir una opción por pregunta.
- La elección queda bloqueada: no se cambia ni se anula desde el dispositivo.
- La respuesta cuenta solo si el servidor la acepta mientras la pregunta sigue abierta.
- El orden color-forma coincide con la pantalla del anfitrión.
- Quien no elige nada permanece en espera hasta el cierre y esa pregunta le vale 0.

**Flujos alternos:**

- **FA1. Segunda pulsación.** Se dispara si intenta elegir otra opción, o la misma, después de una aceptación. El sistema ignora el intento y mantiene la primera respuesta aceptada.
- **FA2. Tiempo agotado o ronda ya cerrada.** Se dispara si la elección llega cuando la recepción ya cerró (HU-6.3). El sistema no la guarda, informa que llegó tarde y esa pregunta vale 0.
- **FA3. Elección de una opción que no existe en la pregunta.** El sistema no guarda la respuesta y deja las opciones disponibles si la ronda sigue abierta.
- **FA4. Participante que no está en la lista.** El sistema rechaza la respuesta. Ocurre si no llegó a entrar antes de comenzar o si fue expulsado en el lobby.
- **FA5. Conexión caída después de pulsar y antes de la aceptación.** El participante ve que no quedó confirmada. Si la ronda sigue abierta al reconectar, puede enviar una vez. Si ya cerró, aplica FA2. El detalle de reconexión está en HU-10.1.
- **FA6. Dos envíos simultáneos.** El sistema acepta uno solo y descarta el otro.

**Postcondiciones:** Si el flujo base se cumple, el participante tiene una respuesta aceptada para esa pregunta. Si no, sigue sin respuesta o con la primera ya aceptada.

## HU-6.3 Cerrar la recepción de respuestas

**Prioridad:** Corte 1

**Actor:** Anfitrión

**Historia:** Yo como anfitrión, quiero que la pregunta deje de aceptar respuestas cuando todos contestaron o cuando el tiempo se agota, para pasar a los resultados con una sola recogida.

**Precondiciones:**

- La pregunta actual está abierta.
- El temporizador arrancó al mostrarse la pregunta, con la duración configurada en esa pregunta.

**Flujo base:**

1. El sistema muestra el mismo tiempo restante al anfitrión y a cada participante.
2. Los participantes envían respuestas mientras la recepción esté abierta (HU-6.2).
3. La recepción se cierra cuando ocurre lo primero de estas dos condiciones: todos los participantes de la lista fijada tienen una respuesta aceptada, o el tiempo llega a cero.
4. El sistema deja de aceptar respuestas nuevas.
5. El sistema calcula el puntaje de cada respuesta aceptada según HU-6.4.
6. La sala pasa a la revelación de HU-7.1. El anfitrión no necesita pulsar para cerrar el tiempo.

**Criterios de aceptación:**

- El temporizador es único para la sala y corresponde a 5, 10, 15, 20 o 30 segundos, según la pregunta.
- Una respuesta aceptada con tiempo restante mayor que cero entra al cálculo.
- Una respuesta recibida con el cierre ya hecho no entra.
- Si todos responden antes del final, el temporizador se detiene y no se esperan los segundos que faltan.
- Quien no respondió queda con 0 en esa pregunta y cuenta como sin respuesta.
- El cierre ocurre una sola vez por pregunta.

**Flujos alternos:**

- **FA1. Nadie responde.** Se dispara al llegar el tiempo a cero. El sistema cierra con todas las respuestas vacías, todos con 0 en esa pregunta, y pasa a la revelación.
- **FA2. Respuesta en el instante del cierre.** Si el servidor todavía no cerró, la acepta con el tiempo restante de ese instante. Si ya cerró, aplica el rechazo de HU-6.2.
- **FA3. Un participante se desconecta con la ronda abierta.** Sigue en la lista. Si no hay respuesta aceptada al cierre, esa pregunta le vale 0. La partida no lo espera más allá del temporizador (HU-10.3).
- **FA4. El anfitrión está desconectado al llegar a cero.** El sistema cierra igual y guarda el resultado de la pregunta. Al reconectar, el anfitrión ve la revelación, no una ronda todavía abierta.
- **FA5. Relojes distintos en los dispositivos.** El tiempo que manda es el del servidor. La pantalla puede ir hasta un segundo desfasada, y la aceptación usa el instante del servidor.

**Postcondiciones:** La pregunta no admite más respuestas. Cada participante tiene o una respuesta aceptada o una ausencia, y la sala puede revelar resultados.

## HU-6.4 Recibir puntos por responder correctamente antes

**Prioridad:** Corte 1

**Actor:** Participante

**Historia:** Yo como participante, quiero que una respuesta correcta y rápida valga más puntos, para que la velocidad también cuente en mi puntaje.

**Precondiciones:**

- La recepción de esa pregunta ya cerró (HU-6.3).
- El sistema conoce, para cada respuesta aceptada, la opción elegida y el tiempo restante en el instante de aceptación.

**Flujo base:**

1. El sistema compara la opción elegida con las marcas de correcta de la copia jugable.
2. Si la opción no está marcada como correcta, asigna 0 puntos en esa pregunta.
3. Si la opción está marcada como correcta, asigna `redondeo(puntajeBase × tiempoRestante / tiempoLímite)`.
4. Suma esos puntos al total acumulado del participante en la partida.
5. Guarda también si la respuesta fue correcta y el tiempo que tardó, medido como `tiempoLímite − tiempoRestante`.
6. Esos datos alimentan la retroalimentación (HU-7.2), el ranking y el historial.

**Criterios de aceptación:**

- Una respuesta incorrecta vale 0, aunque haya sido rápida.
- Una ausencia o una respuesta rechazada por tardía vale 0.
- Una respuesta correcta usa el puntaje base y los tiempos de esa pregunta, no los de otra.
- Si hay varias opciones correctas, cualquiera de ellas otorga el puntaje de velocidad. El participante no tiene que marcar más de una.
- El redondeo es al entero más cercano.
- El total de la partida es la suma de los puntos de las preguntas ya cerradas.
- Dos participantes correctos no reciben el mismo puntaje si su tiempo restante era distinto.

**Flujos alternos:**

- **FA1. Respuesta correcta en el primer instante.** `tiempoRestante` es prácticamente el límite, así que el puntaje resultante es el puntaje base, salvo el redondeo.
- **FA2. Respuesta correcta con muy poco tiempo restante.** El producto puede redondear a 0. En ese caso la pregunta cuenta como acierto con 0 puntos, y el acierto sigue disponible para las estadísticas de respuestas correctas.
- **FA3. Puntaje base o tiempo alterados en el cuestionario vivo.** No afectan a la sala: el cálculo usa la copia fijada al crear el PIN.
- **FA4. Reconexión.** El puntaje ya calculado no se vuelve a sortear. HU-10.1 restaura el total guardado.
- **FA5. Empate de tiempo.** Dos aceptaciones con el mismo tiempo restante reciben los mismos puntos. El orden entre ellos, cuando haya que mostrarlo, sigue la regla de desempate del índice. El orden de entrada al lobby no suma puntos.

**Postcondiciones:** Cada participante tiene actualizados los puntos de la pregunta y el total de la partida. Esos valores quedan listos para la revelación y para el cierre final.
