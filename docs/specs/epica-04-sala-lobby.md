# Épica 4. Sala y lobby del anfitrión

El anfitrión abre una sala, muestra el PIN, ve quién entra y decide cuándo empezar. La unión del participante está en la [épica 5](epica-05-union-participante.md). El máximo por defecto es 50, según el [índice](00-indice.md).

## HU-4.1 Iniciar partida y obtener un PIN

**Prioridad:** Corte 1

**Actor:** Anfitrión

**Historia:** Yo como anfitrión, quiero iniciar una partida de un cuestionario y recibir un PIN, para que los participantes entren a mi sala.

**Precondiciones:**

- Hay una sesión de anfitrión activa.
- El cuestionario pertenece a esa cuenta, tiene al menos una pregunta válida y no tiene otra sala abierta.

**Flujo base:**

1. El anfitrión elige iniciar partida sobre un cuestionario.
2. El sistema toma una copia jugable del cuestionario: orden, textos, opciones, marcas, tiempos, puntajes e imágenes ya guardadas.
3. El sistema genera un PIN de 6 dígitos que no esté en uso por otra sala abierta.
4. El sistema crea la sala en estado de lobby, asociada al anfitrión, al PIN y a esa copia.
5. El sistema abre la pantalla de lobby.

**Criterios de aceptación:**

- El PIN tiene exactamente 6 dígitos.
- Dos salas abiertas al mismo tiempo no comparten PIN.
- La sala nace en lobby, sin pregunta activa y sin puntajes.
- La copia jugable no cambia si después se edita el cuestionario una vez cerrada esta sala; mientras la sala exista, el cuestionario vivo queda bloqueado por HU-2.9.
- El anfitrión que creó la sala es el único que puede expulsar, empezar, avanzar preguntas y cerrarla.

**Flujos alternos:**

- **FA1. Sin preguntas válidas.** El sistema no crea sala ni PIN e indica que hace falta al menos una pregunta completa.
- **FA2. Ya hay una sala abierta de ese cuestionario.** El sistema no crea otro PIN y lleva al anfitrión a la sala existente si la sesión es la dueña de esa sala.
- **FA3. El anfitrión ya tiene otra sala abierta de otro cuestionario.** El sistema no abre una segunda sala y ofrece volver a la sala en curso o cerrarla si todavía está en lobby (HU-4.7). Si la otra sala ya comenzó, solo ofrece volver a ella.
- **FA4. No hay PIN libre en el intento.** Se dispara si el PIN generado ya está en uso. El sistema genera otro antes de responder. Si no logra un PIN libre, no crea la sala y permite reintentar.
- **FA5. Sesión cerrada o cuestionario no disponible.** El sistema no crea sala.
- **FA6. Fallo al crear la sala.** El sistema no publica un PIN a medias y permite reintentar.

**Postcondiciones:** Existe una sala en lobby con un PIN único y una copia fija del cuestionario. El anfitrión está en esa pantalla.

## HU-4.2 Ver el lobby con el PIN

**Prioridad:** Corte 1

**Actor:** Anfitrión

**Historia:** Yo como anfitrión, quiero ver el PIN destacado en el lobby, para dictarlo o proyectarlo a quienes van a jugar.

**Precondiciones:**

- Hay una sala en lobby creada por el anfitrión autenticado.

**Flujo base:**

1. El anfitrión permanece en la pantalla de lobby.
2. El sistema muestra el PIN en grande, el título del cuestionario y, si existe, la portada.
3. El sistema muestra la cantidad de participantes unidos respecto del máximo de la sala.
4. El anfitrión puede leer el PIN sin salir de la pantalla.

**Criterios de aceptación:**

- El PIN visible es el de esa sala y no cambia mientras el lobby siga abierto.
- El título y la portada corresponden a la copia con la que se creó la sala.
- El PIN se muestra con los 6 dígitos, incluidos los ceros a la izquierda.
- La pantalla está pensada para proyectarse: el PIN se lee a distancia.

**Flujos alternos:**

- **FA1. La sala ya comenzó.** Se dispara si el anfitrión vuelve a la ruta del lobby después de HU-4.6. El sistema muestra la pregunta en curso, no el lobby de espera.
- **FA2. La sala ya no existe.** Se dispara si se cerró o terminó. El sistema vuelve al detalle del cuestionario e indica que la sala no está abierta.
- **FA3. Sesión de otro anfitrión.** El sistema no muestra el PIN de una sala ajena.
- **FA4. Fallo al pintar el lobby.** El sistema permite recargar. El PIN de la sala no cambia por la recarga.

**Postcondiciones:** El anfitrión sigue viendo el PIN de la sala en lobby. Esta historia no modifica la sala.

## HU-4.3 Mostrar un código QR de acceso

**Prioridad:** Corte 2

**Actor:** Anfitrión

**Historia:** Yo como anfitrión, quiero mostrar un código QR en el lobby, para que los participantes abran la unión desde el celular sin copiar el PIN a mano.

**Precondiciones:**

- Hay una sala en lobby creada por el anfitrión autenticado.
- El lobby ya muestra el PIN (HU-4.2).

**Flujo base:**

1. El sistema compone una dirección de unión que incluye el PIN de la sala.
2. El sistema muestra el QR de esa dirección junto al PIN.
3. Un dispositivo que lee el QR abre la pantalla de unión con el PIN ya completado.
4. El participante todavía elige su apodo y confirma la entrada (HU-5.1).

**Criterios de aceptación:**

- El QR codifica la misma sala que el PIN visible.
- Leer el QR no mete al participante en la sala: falta el apodo y la confirmación.
- Si el PIN de la sala sigue siendo el mismo, el QR también.
- El QR deja de mostrarse cuando el lobby termina.

**Flujos alternos:**

- **FA1. El QR no puede generarse.** El sistema mantiene el PIN visible, informa que el QR no está disponible y permite reintentar la generación sin crear otra sala.
- **FA2. El PIN del QR ya no está abierto.** Se dispara si alguien abre un QR guardado después de cerrar la sala. La pantalla de unión responde como PIN inexistente (HU-5.1).
- **FA3. La sala ya comenzó.** El QR deja de estar en pantalla. Un QR leído tarde cae en el alterno de partida ya iniciada de HU-5.1.

**Postcondiciones:** El lobby muestra un QR que apunta a la unión de esa sala. La sala no cambia de estado.

## HU-4.4 Ver los apodos que entran

**Prioridad:** Corte 1

**Actor:** Anfitrión

**Historia:** Yo como anfitrión, quiero ver los apodos a medida que entran, para saber quién está listo antes de comenzar.

**Precondiciones:**

- Hay una sala en lobby creada por el anfitrión autenticado.

**Flujo base:**

1. El anfitrión observa el lobby.
2. Cada vez que un participante entra con HU-5.1, su apodo aparece en la pantalla del anfitrión sin que este recargue.
3. El sistema muestra el apodo y actualiza el conteo de unidos.
4. Si un participante sale con HU-5.3, su apodo desaparece y el conteo baja.

**Criterios de aceptación:**

- Un ingreso válido se refleja en el lobby del anfitrión en la misma sala.
- El apodo mostrado es el aceptado, no un texto intermedio del formulario.
- El conteo coincide con los apodos visibles.
- El orden de aparición sigue el orden de entrada aceptada.
- Dos anfitriones no ven la lista: solo el dueño de la sala.

**Flujos alternos:**

- **FA1. Nadie ha entrado.** El sistema muestra la lista vacía y el conteo en cero. Comenzar sigue las reglas de HU-4.6.
- **FA2. Ingreso rechazado.** Se dispara si el PIN, el apodo o el cupo fallan en HU-5.1. El lobby no agrega ese apodo.
- **FA3. El anfitrión pierde la conexión un momento.** Al recuperar la pantalla de lobby, el sistema muestra la lista vigente, no una lista vieja. El detalle de reconexión del anfitrión está en HU-10.2.
- **FA4. Participante expulsado.** El apodo desaparece en cuanto HU-4.5 se confirma.

**Postcondiciones:** La lista del lobby representa a los participantes unidos en ese instante.

## HU-4.5 Expulsar a un participante del lobby

**Prioridad:** Corte 2

**Actor:** Anfitrión

**Historia:** Yo como anfitrión, quiero expulsar a un participante del lobby, para sacar un apodo que no deba quedarse en la partida.

**Precondiciones:**

- Hay una sala en lobby creada por el anfitrión autenticado.
- El apodo elegido está unido a esa sala.

**Flujo base:**

1. El anfitrión elige expulsar un apodo de la lista.
2. El sistema pide confirmación con ese apodo.
3. El anfitrión confirma.
4. El sistema saca al participante de la sala y libera el apodo.
5. El apodo desaparece del lobby y el conteo baja.
6. El participante expulsado ve el resultado descrito en HU-5.4.

**Criterios de aceptación:**

- Hace falta confirmación.
- El expulsado no puede seguir en esa sala con la sesión de unión anterior.
- El apodo queda libre para que otra persona lo use en la misma sala.
- Expulsar no cierra la sala ni cambia el PIN.
- Durante una ronda ya comenzada, esta acción no está disponible: la expulsión de esta historia ocurre en el lobby.

**Flujos alternos:**

- **FA1. El anfitrión cancela.** El participante sigue en la sala.
- **FA2. El participante ya salió.** Se dispara si abandonó o se desconectó antes de confirmar. El sistema no muestra un error de expulsión y refresca la lista sin ese apodo.
- **FA3. La partida ya comenzó.** El sistema no expulsa con esta acción e indica que el lobby ya cerró.
- **FA4. Apodo que nunca estuvo.** El sistema refresca la lista y no modifica a los demás.
- **FA5. Fallo al expulsar.** El participante sigue unido y el anfitrión puede reintentar.

**Postcondiciones:** El participante confirmado ya no está en la sala. El resto del lobby sigue igual.

## HU-4.6 Comenzar la partida

**Prioridad:** Corte 1

**Actor:** Anfitrión

**Historia:** Yo como anfitrión, quiero comenzar la partida cuando los participantes ya entraron, para pasar de la espera a la primera pregunta.

**Precondiciones:**

- Hay una sala en lobby creada por el anfitrión autenticado.
- Hay al menos un participante unido.

**Flujo base:**

1. El anfitrión elige comenzar.
2. El sistema cierra el ingreso de participantes nuevos.
3. El sistema fija la lista de participantes que jugarán.
4. El sistema pasa la sala a la primera pregunta del orden, en el estado descrito por HU-6.1.
5. Los participantes dejan la espera y ven la primera ronda (HU-5.2 y HU-6.2).

**Criterios de aceptación:**

- Comenzar exige al menos un participante.
- Después de comenzar, un PIN ya no acepta ingresos nuevos.
- La primera pregunta es la primera del orden de la copia jugable.
- El temporizador de la primera pregunta arranca al mostrarse, según HU-6.3.
- El PIN sigue identificando la sala para reconexiones (épica 10), no para altas nuevas.

**Flujos alternos:**

- **FA1. Lobby vacío.** Se dispara si no hay participantes. El sistema no comienza y lo indica en el lobby.
- **FA2. Alguien entra o sale en el instante de confirmar.** El sistema usa la lista del momento en que acepta el comienzo. Si esa lista queda vacía, no comienza.
- **FA3. La sala ya comenzó.** Un segundo comienzo no reinicia la pregunta ni borra respuestas. El sistema mantiene la ronda en curso.
- **FA4. La copia no tiene preguntas.** No debería ocurrir si HU-4.1 se cumplió. Si la copia es inválida, el sistema no comienza, mantiene el lobby y permite cerrar la sala.
- **FA5. Fallo al cambiar de estado.** El sistema permanece en lobby, el PIN sigue aceptando ingresos y nadie ve una pregunta a medias.

**Postcondiciones:** La sala está en la primera pregunta, con el ingreso cerrado y la lista de jugadores fijada.

## HU-4.7 Cerrar la sala antes de comenzar

**Prioridad:** Corte 2

**Actor:** Anfitrión

**Historia:** Yo como anfitrión, quiero cerrar la sala mientras sigue en el lobby, para anular un PIN que todavía no voy a usar.

**Precondiciones:**

- Hay una sala en lobby creada por el anfitrión autenticado.
- La partida no ha comenzado.

**Flujo base:**

1. El anfitrión elige cerrar la sala.
2. El sistema pide confirmación.
3. El anfitrión confirma.
4. El sistema marca la sala como cerrada, invalida el PIN y saca a los participantes.
5. El sistema no guarda una partida en el historial, porque no hubo preguntas jugadas.
6. El sistema libera el cuestionario para edición (HU-2.9).
7. Los participantes ven que la sala se cerró y vuelven a la pantalla de unión.
8. El anfitrión vuelve al detalle del cuestionario.

**Criterios de aceptación:**

- Hace falta confirmación.
- El PIN deja de aceptar ingresos.
- No se crea registro de historial ni puntajes.
- El cuestionario vuelve a poder editarse y a poder abrir otra sala.
- Cancelar deja el lobby como estaba.

**Flujos alternos:**

- **FA1. El anfitrión cancela.** La sala, el PIN y los participantes siguen en lobby.
- **FA2. La partida ya comenzó.** Esta historia no cierra una ronda en curso. El sistema ofrece seguir la partida hasta el podio.
- **FA3. La sala ya estaba cerrada.** El sistema lleva al detalle del cuestionario sin un segundo cierre.
- **FA4. Fallo al cerrar.** La sala sigue en lobby y el anfitrión puede reintentar.
- **FA5. Participantes en curso de unirse.** Quien no hubiera sido aceptado aún recibe PIN inexistente. Quien ya estaba dentro recibe el aviso de sala cerrada.

**Postcondiciones:** La sala en lobby queda cerrada, el PIN deja de valer y el cuestionario vuelve a estar libre. No hay historial de esa sala.

## HU-4.8 Definir un máximo de participantes

**Prioridad:** Alcance completo

**Actor:** Anfitrión

**Historia:** Yo como anfitrión, quiero definir cuántos participantes pueden entrar, para que la sala no supere el tamaño que quiero manejar.

**Precondiciones:**

- El anfitrión está creando la sala o todavía está en el lobby, antes de comenzar.
- El cuestionario cumple las precondiciones de HU-4.1.

**Flujo base:**

1. Antes de generar el PIN, o desde el lobby antes de comenzar, el anfitrión indica un máximo.
2. El sistema valida que sea un entero entre 1 y 50.
3. El sistema guarda ese máximo en la sala.
4. El lobby muestra unidos y máximo.
5. Un ingreso que supere el máximo se rechaza como sala llena (HU-5.1).

**Criterios de aceptación:**

- El valor permitido es un entero de 1 a 50.
- Si el anfitrión no elige otro, el máximo es 50.
- El máximo puede cambiarse en el lobby mientras el nuevo valor sea mayor o igual que los ya unidos.
- Al comenzar la partida el máximo queda fijo.
- El anfitrión cuenta aparte: no ocupa un cupo de participante.

**Flujos alternos:**

- **FA1. Valor fuera de rango.** Se dispara si el número es menor que 1, mayor que 50 o no es un entero. El sistema conserva el máximo anterior. Si la sala aún no existe, no la crea hasta tener un valor válido o el valor por defecto.
- **FA2. Máximo menor que los ya unidos.** El sistema no baja el tope e indica cuántos hay ahora.
- **FA3. Cambio después de comenzar.** El sistema no modifica el cupo de una partida ya iniciada.
- **FA4. Sala llena.** El ingreso siguiente falla en HU-5.1 y el lobby no agrega otro apodo.
- **FA5. Fallo al guardar el máximo.** El sistema conserva el valor vigente y permite reintentar.

**Postcondiciones:** La sala tiene un máximo definido. Los ingresos posteriores lo respetan hasta que la partida comienza.
