# Épica 7. Resultados de cada pregunta

Cuando la recepción se cierra, la sala ve qué opción era correcta y cada participante ve cómo le fue. El anfitrión decide cuándo pasar a la siguiente pregunta.

## HU-7.1 Revelar la respuesta correcta

**Prioridad:** Corte 1

**Actor:** Anfitrión

**Historia:** Yo como anfitrión, quiero ver la respuesta correcta y cuántos eligieron cada opción, para comentar el resultado antes de seguir.

**Precondiciones:**

- La recepción de la pregunta actual ya cerró (HU-6.3).
- El puntaje de esa pregunta ya fue calculado (HU-6.4).

**Flujo base:**

1. El sistema muestra en la pantalla del anfitrión el texto de la pregunta y sus opciones.
2. Señala cada opción correcta.
3. Muestra, por opción, cuántos participantes la eligieron.
4. Muestra cuántos no respondieron.
5. La suma de las elecciones y de las ausencias coincide con el tamaño de la lista fijada al comenzar. Quien esté desconectado y no haya respondido sigue en ese conteo como ausencia (HU-10.3).

**Criterios de aceptación:**

- Las opciones correctas son las de la copia jugable, aunque haya más de una.
- El gráfico o la cifra por opción usa solo respuestas aceptadas de esta pregunta.
- Una ausencia no se suma a ninguna opción.
- La revelación no permite reabrir la recepción.
- Los participantes no ven este desglose completo en su dispositivo: ven su propio resultado en HU-7.2.

**Flujos alternos:**

- **FA1. Nadie respondió.** Todas las opciones quedan en cero y las ausencias igualan a la lista. Las correctas se señalan igual.
- **FA2. Varias opciones correctas.** El sistema señala todas las marcadas. El conteo de cada barra sigue siendo cuántos la eligieron, no cuántos acertaron en conjunto.
- **FA3. El anfitrión recarga.** El sistema vuelve a mostrar la misma revelación, sin recalcular con respuestas nuevas.
- **FA4. Imagen no disponible.** La revelación sigue con el texto, las marcas y los conteos.
- **FA5. Fallo al leer los conteos.** El sistema no avanza solo a la pregunta siguiente y permite recargar la revelación.

**Postcondiciones:** La sala permanece en la revelación de esa pregunta hasta que el anfitrión avance (HU-7.4). Si era la última, ese avance abre el cierre.

## HU-7.2 Ver si acerté

**Prioridad:** Corte 1

**Actor:** Participante

**Historia:** Yo como participante, quiero ver si acerté, cuántos puntos gané en la pregunta y cuál es mi total, para saber cómo voy.

**Precondiciones:**

- La recepción de la pregunta ya cerró.
- El participante pertenece a la lista de la partida.

**Flujo base:**

1. El sistema muestra en el dispositivo del participante si su respuesta fue correcta o incorrecta.
2. Muestra los puntos obtenidos en esa pregunta.
3. Muestra el puntaje total acumulado de la partida.
4. El participante permanece en esa pantalla hasta que el anfitrión avanza.

**Criterios de aceptación:**

- Un acierto se muestra como acierto aunque los puntos redondeados sean 0 (HU-6.4, FA2).
- Una respuesta incorrecta muestra 0 puntos en la pregunta y el total anterior sin incremento.
- Una ausencia muestra que no respondió, 0 puntos en la pregunta y el total sin incremento.
- El total coincide con la suma calculada en el servidor.
- El participante no ve el conteo del resto de opciones en esta historia. El puesto parcial de los cinco primeros es HU-7.3.

**Flujos alternos:**

- **FA1. Llegó tarde.** El sistema muestra que la respuesta no entró, con 0 puntos en la pregunta.
- **FA2. El participante recarga.** El sistema vuelve a mostrar el mismo acierto, los mismos puntos de la pregunta y el mismo total.
- **FA3. Está desconectado durante la revelación.** Al reconectar, ve este resultado si la sala sigue en la revelación, o la pregunta siguiente si el anfitrión ya avanzó (HU-10.1).
- **FA4. No formaba parte de la lista.** El sistema no muestra puntaje de esta partida.

**Postcondiciones:** El participante conoce el resultado de su respuesta y su total. El total no cambia hasta que cierre otra pregunta.

## HU-7.3 Ver el leaderboard parcial

**Prioridad:** Corte 2

**Actor:** Anfitrión

**Historia:** Yo como anfitrión, quiero ver los cinco primeros después de cada pregunta, para proyectar cómo va la competencia.

**Precondiciones:**

- La pregunta actual está en revelación (HU-7.1).
- Los totales de la partida están actualizados.

**Flujo base:**

1. El sistema ordena a los participantes con la regla de desempate del índice.
2. Muestra en la pantalla del anfitrión como máximo a las cinco primeras personas de ese orden, con su puesto y su total.
3. Si hay menos de cinco, muestra a todos los que están en la lista.
4. El participante ve al menos su propio puesto en el dispositivo, junto con el resultado de HU-7.2.

**Criterios de aceptación:**

- El corte muestra como máximo cinco personas, aunque varias compartan puntaje, aciertos y tiempo.
- Quien no cabe en las cinco sigue en el orden completo y no aparece en esta vista.
- El orden usa los totales ya calculados, no un cálculo distinto en el navegador.
- Quien tiene 0 puntos aparece si entra en las cinco.
- Un participante desconectado sigue en el orden con su total guardado.
- El leaderboard no permite cambiar respuestas.

**Flujos alternos:**

- **FA1. Menos de cinco participantes.** El sistema muestra el ranking completo de la lista, sin filas vacías.
- **FA2. Todos en cero.** El sistema aplica la regla de desempate del índice, incluido el orden de entrada al lobby.
- **FA3. Un participante desconectado.** Sigue en el ranking con su total guardado y conserva su lugar en la lista.
- **FA4. El anfitrión recarga.** El ranking mostrado es el de esa revelación, no uno recalculado con una pregunta nueva.

**Postcondiciones:** La sala sigue en la revelación, ahora con el ranking parcial visible, hasta que el anfitrión avance.

## HU-7.4 Avanzar a la siguiente pregunta

**Prioridad:** Corte 1

**Actor:** Anfitrión

**Historia:** Yo como anfitrión, quiero pasar a la siguiente pregunta cuando ya comenté el resultado, para controlar el ritmo de la partida.

**Precondiciones:**

- La sala está en la revelación de la pregunta actual.
- El anfitrión autenticado es el dueño de la sala.

**Flujo base:**

1. El anfitrión elige avanzar.
2. El sistema cierra la revelación de la pregunta actual.
3. El sistema toma la siguiente pregunta del orden de la copia jugable.
4. La proyecta según HU-6.1 y abre su temporizador según HU-6.3.
5. Los participantes pasan de su resultado a la nueva pantalla de respuesta (HU-6.2).

**Criterios de aceptación:**

- Solo el anfitrión dueño de la sala puede avanzar.
- Avanzar no ocurre solo por el paso del tiempo.
- La pregunta siguiente es la inmediata en el orden. No se salta ni se repite la anterior.
- Los puntajes ya sumados se conservan.
- Los participantes no pueden avanzar la sala.

**Flujos alternos:**

- **FA1. Era la última pregunta.** Se dispara si no hay otra en el orden. El sistema no abre una pregunta vacía, cierra la sala en vivo y libera el cuestionario. En el corte 1 el anfitrión ve el orden final en una pantalla simple, con apodo, puesto y puntaje, y el participante ve HU-8.3. El podio animado de HU-8.1 aparece cuando esa historia está disponible.
- **FA2. Doble avance.** Un segundo avance mientras la pregunta nueva ya está abierta no la salta. El sistema ignora el duplicado.
- **FA3. Avance antes de cerrar la recepción.** El sistema no adelanta la pregunta mientras todavía se aceptan respuestas.
- **FA4. El anfitrión está desconectado.** La sala permanece en la revelación hasta que vuelva y avance, o hasta el tratamiento de HU-10.2.
- **FA5. Fallo al abrir la siguiente.** La sala sigue en la revelación actual y el anfitrión puede reintentar. No se pierden los puntajes.

**Postcondiciones:** La sala está en la pregunta siguiente, con la recepción abierta, o en el cierre de la partida si no quedaban preguntas.
