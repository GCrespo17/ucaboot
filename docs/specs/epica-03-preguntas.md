# Épica 3. Preguntas

El anfitrión arma las preguntas de un cuestionario propio. El orden de esta lista es el orden de la partida. Las reglas de opciones, tiempo, puntaje y colores están en el [índice](00-indice.md). Si el cuestionario tiene una partida activa, se aplica [HU-2.9](epica-02-cuestionarios.md).

## HU-3.1 Agregar pregunta

**Prioridad:** Corte 1

**Actor:** Anfitrión

**Historia:** Yo como anfitrión, quiero agregar una pregunta con sus opciones, el tiempo y el puntaje, para incluirla en la partida.

**Precondiciones:**

- Hay una sesión de anfitrión activa.
- El cuestionario pertenece a esa cuenta.
- El cuestionario no tiene una partida activa.

**Flujo base:**

1. El anfitrión elige agregar una pregunta.
2. Escribe el texto de la pregunta.
3. Escribe entre 2 y 4 opciones.
4. Marca al menos una opción como correcta.
5. Elige un tiempo límite de 5, 10, 15, 20 o 30 segundos.
6. Indica un puntaje base entero entre 100 y 2000.
7. Confirma el guardado.
8. El sistema valida todos los campos.
9. El sistema agrega la pregunta al final del orden de juego.
10. El sistema vuelve al detalle del cuestionario con la pregunta nueva.

**Criterios de aceptación:**

- El texto de la pregunta tiene entre 1 y 200 caracteres tras recortar espacios.
- Cada opción tiene entre 1 y 80 caracteres tras recortar espacios.
- Hay entre 2 y 4 opciones, y al menos una está marcada como correcta.
- Puede haber más de una opción correcta. El participante, en la partida, elige una sola: acierta si la elegida está marcada.
- El tiempo es uno de los cinco valores permitidos.
- El puntaje base es un entero entre 100 y 2000. Si el anfitrión no lo cambia, el valor inicial del formulario es 1000.
- El tiempo inicial del formulario es 20 segundos.
- La imagen de la pregunta no se pide aquí: se adjunta con HU-3.5.
- La pregunta nueva queda al final del orden.

**Flujos alternos:**

- **FA1. Texto de pregunta vacío o demasiado largo.** El sistema no guarda y señala el campo.
- **FA2. Cantidad de opciones fuera de rango.** Se dispara si hay menos de 2 o más de 4 opciones con texto. El sistema no guarda. Las filas vacías no cuentan como opción.
- **FA3. Opción vacía o demasiado larga.** Se dispara si una opción que el anfitrión dejó en uso queda vacía o pasa de 80 caracteres. El sistema no guarda y señala esa opción.
- **FA4. Ninguna opción correcta.** Se dispara si ninguna opción está marcada. El sistema no guarda y pide marcar al menos una.
- **FA5. Todas las opciones marcadas como correctas.** El sistema sí guarda: la regla exige al menos una, no una sola. El acierto del participante sigue siendo elegir cualquiera de ellas.
- **FA6. Tiempo o puntaje fuera de dominio.** Se dispara si el tiempo no es uno de los cinco valores o el puntaje no es un entero entre 100 y 2000. El sistema no guarda.
- **FA7. Partida activa.** El sistema no agrega la pregunta y aplica HU-2.9.
- **FA8. El anfitrión cancela.** El sistema no agrega la pregunta.
- **FA9. Sesión cerrada, cuestionario no disponible o fallo al guardar.** El sistema no agrega una pregunta parcial y permite reintentar cuando la sesión y el cuestionario sigan disponibles.

**Postcondiciones:** El cuestionario tiene una pregunta más, al final del orden, con opciones, marcas, tiempo y puntaje base válidos.

## HU-3.2 Editar una pregunta

**Prioridad:** Corte 1

**Actor:** Anfitrión

**Historia:** Yo como anfitrión, quiero corregir una pregunta ya guardada, para que la partida use el enunciado y las respuestas que quiero.

**Precondiciones:**

- Hay una sesión de anfitrión activa.
- La pregunta pertenece a un cuestionario de esa cuenta.
- El cuestionario no tiene una partida activa.

**Flujo base:**

1. El anfitrión abre una pregunta existente.
2. Modifica el texto, las opciones, las marcas de correcta, el tiempo o el puntaje base.
3. Confirma el guardado.
4. El sistema aplica las mismas validaciones de HU-3.1.
5. El sistema reemplaza el contenido de esa pregunta y conserva su posición en el orden.
6. El sistema vuelve al detalle con la pregunta actualizada.

**Criterios de aceptación:**

- La pregunta editada cumple las mismas reglas que una pregunta nueva.
- Su posición en el orden no cambia en este flujo.
- La imagen adjunta, si existe, se conserva salvo que se modifique con HU-3.5.
- Las partidas ya cerradas no cambian su copia histórica.

**Flujos alternos:**

- **FA1. Validación incumplida.** Se dispara en los mismos casos que FA1 a FA4 y FA6 de HU-3.1. El sistema conserva la versión anterior de la pregunta.
- **FA2. Quitar una opción.** Se dispara si el anfitrión deja de usar una opción y siguen quedando entre 2 y 4, con al menos una correcta. El sistema guarda el conjunto nuevo. Si al quitarla no queda ninguna correcta o quedan menos de 2 opciones, aplica FA1.
- **FA3. Agregar una opción.** Se dispara si había menos de 4 y el anfitrión completa otra, hasta 4. El sistema la incluye si cumple el texto y queda al menos una correcta en el conjunto.
- **FA4. Sin cambios.** Se dispara si el contenido resultante es igual al guardado. El sistema no escribe de nuevo.
- **FA5. Partida activa.** El sistema no guarda y aplica HU-2.9.
- **FA6. Pregunta inexistente, cuestionario ajeno, cancelación, sesión cerrada o fallo al guardar.** El sistema conserva la versión anterior.

**Postcondiciones:** La pregunta queda con el contenido confirmado y en la misma posición.

## HU-3.3 Eliminar una pregunta

**Prioridad:** Corte 1

**Actor:** Anfitrión

**Historia:** Yo como anfitrión, quiero eliminar una pregunta, para que no aparezca en la partida.

**Precondiciones:**

- Hay una sesión de anfitrión activa.
- La pregunta pertenece a un cuestionario de esa cuenta.
- El cuestionario no tiene una partida activa.

**Flujo base:**

1. El anfitrión elige eliminar una pregunta.
2. El sistema pide confirmación y muestra el texto de la pregunta.
3. El anfitrión confirma.
4. El sistema elimina la pregunta, sus opciones y su imagen.
5. El sistema compacta el orden: las preguntas siguientes avanzan una posición.
6. El sistema vuelve al detalle.

**Criterios de aceptación:**

- Hace falta confirmación explícita.
- La pregunta eliminada no aparece en la vista previa ni en una partida futura.
- El orden relativo del resto se conserva.
- Si era la única pregunta, el cuestionario queda con cero preguntas y no puede iniciar partida.
- Cancelar no borra la pregunta.

**Flujos alternos:**

- **FA1. El anfitrión cancela.** El sistema conserva la pregunta y el orden.
- **FA2. Partida activa.** El sistema no elimina y aplica HU-2.9.
- **FA3. Pregunta inexistente o de otro cuestionario.** El sistema no borra nada y vuelve al detalle disponible.
- **FA4. Sesión cerrada o fallo al eliminar.** El sistema conserva la pregunta.

**Postcondiciones:** La pregunta ya no forma parte del cuestionario y el orden de las restantes es continuo.

## HU-3.4 Reordenar preguntas

**Prioridad:** Corte 2

**Actor:** Anfitrión

**Historia:** Yo como anfitrión, quiero cambiar el orden de las preguntas, para que la partida las presente en la secuencia que quiero.

**Precondiciones:**

- Hay una sesión de anfitrión activa.
- El cuestionario pertenece a esa cuenta y tiene al menos dos preguntas.
- El cuestionario no tiene una partida activa.

**Flujo base:**

1. El anfitrión abre el orden de las preguntas.
2. Mueve una pregunta a una posición distinta, hacia arriba, hacia abajo o a un puesto concreto.
3. Confirma el orden.
4. El sistema guarda la secuencia nueva completa.
5. El detalle, la vista previa y la partida futura usan ese orden.

**Criterios de aceptación:**

- El orden confirmado es una permutación de las mismas preguntas: no se duplican ni se pierden.
- La primera pregunta del orden nuevo es la primera de la partida.
- Reordenar no cambia textos, opciones, tiempos, puntajes ni imágenes.
- Con una sola pregunta, el control de reordenar no se ofrece.

**Flujos alternos:**

- **FA1. Menos de dos preguntas.** El sistema no abre el reorden y el único orden posible es el actual.
- **FA2. Soltar en la misma posición.** El sistema reconoce que no hubo cambio y no escribe de nuevo.
- **FA3. Partida activa.** El sistema no guarda el orden nuevo y aplica HU-2.9. La sala sigue con el orden cargado al crear el PIN.
- **FA4. El anfitrión cancela.** El sistema restaura el orden guardado.
- **FA5. El conjunto de preguntas cambió antes de confirmar.** Se dispara si en otra sesión se agregó o se eliminó una pregunta. El sistema rechaza el orden viejo, recarga la lista y pide ordenar de nuevo.
- **FA6. Sesión cerrada o fallo al guardar.** El sistema conserva el orden anterior.

**Postcondiciones:** El cuestionario tiene el orden confirmado. La composición de cada pregunta no cambia.

## HU-3.5 Adjuntar o quitar imagen de la pregunta

**Prioridad:** Corte 2

**Actor:** Anfitrión

**Historia:** Yo como anfitrión, quiero adjuntar o quitar una imagen en una pregunta, para hacer una pregunta visual en la pantalla de la sala.

**Precondiciones:**

- Hay una sesión de anfitrión activa.
- La pregunta pertenece a un cuestionario de esa cuenta.
- El cuestionario no tiene una partida activa.

**Flujo base:**

1. El anfitrión abre una pregunta guardada.
2. Elige una imagen.
3. El sistema comprueba tipo y tamaño.
4. El sistema asocia la imagen a esa pregunta y la muestra en el detalle y en la vista de anfitrión.
5. Si ya había otra imagen, la reemplaza.

**Criterios de aceptación:**

- Se aceptan JPEG, PNG y WebP de hasta 2 MB.
- La imagen es opcional. Una pregunta sin imagen sigue siendo válida para jugar.
- En la partida, la imagen se ve en la pantalla del anfitrión (HU-6.1) y no reemplaza a los colores y formas del participante.
- Quitar la imagen deja la pregunta sin archivo gráfico y no altera el texto ni las opciones.

**Flujos alternos:**

- **FA1. Tipo o tamaño no admitidos.** El sistema no reemplaza la imagen anterior.
- **FA2. Quitar imagen.** El anfitrión elige quitarla. El sistema borra la imagen de esa pregunta. Si no había imagen, informa que ya está sin imagen.
- **FA3. Partida activa.** El sistema no cambia la imagen y aplica HU-2.9.
- **FA4. Pregunta todavía no guardada.** Se dispara si el anfitrión intenta adjuntar la imagen antes de existir la pregunta. El sistema pide guardar primero la pregunta con HU-3.1 y después adjuntar la imagen.
- **FA5. El anfitrión cancela la selección.** El sistema conserva la imagen anterior.
- **FA6. Fallo al guardar el archivo, sesión cerrada o pregunta no disponible.** El sistema conserva la imagen anterior.

**Postcondiciones:** La pregunta queda con la imagen confirmada, o sin imagen si se quitó. El resto de sus campos no cambia.
