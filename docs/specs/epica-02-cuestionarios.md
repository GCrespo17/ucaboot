# Épica 2. Biblioteca de cuestionarios

El anfitrión crea, consulta, modifica, copia y previsualiza sus cuestionarios. Las preguntas de cada cuestionario se especifican en la [épica 3](epica-03-preguntas.md). La regla de partida activa está en el [índice](00-indice.md) y se detalla en HU-2.9.

## HU-2.1 Crear cuestionario

**Prioridad:** Corte 1

**Actor:** Anfitrión

**Historia:** Yo como anfitrión, quiero crear un cuestionario con título y descripción, para usarlo después en una partida.

**Precondiciones:**

- Hay una sesión de anfitrión activa.
- El cuestionario nuevo pertenece solo a esa cuenta.

**Flujo base:**

1. El anfitrión elige crear un cuestionario.
2. Ingresa un título y, si quiere, una descripción.
3. Confirma la creación.
4. El sistema valida el título.
5. El sistema guarda el cuestionario vacío, sin preguntas y sin portada, asociado al anfitrión.
6. El sistema abre el detalle de ese cuestionario para agregar preguntas.

**Criterios de aceptación:**

- El título es obligatorio, de 1 a 80 caracteres tras recortar espacios.
- La descripción es opcional y admite hasta 500 caracteres.
- El cuestionario queda visible solo para el anfitrión que lo creó.
- Un cuestionario recién creado no puede iniciar partida hasta tener al menos una pregunta válida (HU-4.1).
- La portada no se pide en este flujo: se agrega con HU-2.6.

**Flujos alternos:**

- **FA1. Título vacío.** Se dispara si el título queda vacío al recortar espacios. El sistema no guarda y señala el campo.
- **FA2. Título o descripción demasiado largos.** Se dispara si el título supera 80 caracteres o la descripción supera 500. El sistema no guarda y señala el campo.
- **FA3. Sesión cerrada.** Se dispara si la sesión venció antes de confirmar. El sistema no guarda el cuestionario y pide iniciar sesión.
- **FA4. Fallo al guardar.** Se dispara si el cuestionario no puede persistirse. El sistema conserva lo escrito en el formulario y permite reintentar.
- **FA5. El anfitrión cancela.** Se dispara si cierra el formulario sin confirmar. El sistema no crea el cuestionario.

**Postcondiciones:** Existe un cuestionario sin preguntas, propiedad del anfitrión, con el título y la descripción confirmados.

## HU-2.2 Listar mis cuestionarios

**Prioridad:** Corte 1

**Actor:** Anfitrión

**Historia:** Yo como anfitrión, quiero ver la lista de mis cuestionarios, para elegir cuál editar o cuál usar en una partida.

**Precondiciones:**

- Hay una sesión de anfitrión activa.

**Flujo base:**

1. El anfitrión abre el panel de cuestionarios.
2. El sistema muestra los cuestionarios de esa cuenta, del más reciente al más antiguo.
3. Cada elemento muestra título, cantidad de preguntas y fecha de última modificación.
4. El anfitrión puede abrir el detalle, editar, eliminar o iniciar partida desde esa lista.

**Criterios de aceptación:**

- La lista incluye solo cuestionarios del anfitrión autenticado.
- El orden es por última modificación, descendente.
- Un cuestionario sin preguntas aparece con cantidad 0 y no ofrece un inicio de partida habilitado.
- La lista vacía muestra una acción para crear el primero.

**Flujos alternos:**

- **FA1. Sin cuestionarios.** Se dispara si la cuenta no tiene ninguno. El sistema muestra el estado vacío y el acceso a HU-2.1.
- **FA2. Sesión cerrada.** Se dispara si no hay sesión válida. El sistema no muestra títulos de cuestionarios y pide iniciar sesión.
- **FA3. Fallo al consultar.** Se dispara si la lista no puede cargarse. El sistema muestra el error y permite reintentar sin perder la sesión.

**Postcondiciones:** El anfitrión ve el inventario actual de sus cuestionarios. La consulta no modifica datos.

## HU-2.3 Ver el detalle de un cuestionario

**Prioridad:** Corte 1

**Actor:** Anfitrión

**Historia:** Yo como anfitrión, quiero abrir un cuestionario, para revisar su título, su descripción y sus preguntas antes de usarlo.

**Precondiciones:**

- Hay una sesión de anfitrión activa.
- El cuestionario pertenece a esa cuenta.

**Flujo base:**

1. El anfitrión elige un cuestionario de su lista.
2. El sistema muestra título, descripción, portada si existe, cantidad de preguntas y la lista ordenada de preguntas.
3. De cada pregunta muestra el texto, el tiempo límite, el puntaje base y cuántas opciones tiene.
4. El anfitrión puede pasar a editar, duplicar, previsualizar, agregar preguntas o iniciar partida si se cumplen las precondiciones de esas historias.

**Criterios de aceptación:**

- El detalle corresponde al cuestionario elegido y a la versión guardada.
- Las preguntas aparecen en el orden de juego definido en la épica 3.
- Un anfitrión no puede abrir el detalle de un cuestionario de otra cuenta: el sistema responde como si no existiera.

**Flujos alternos:**

- **FA1. Cuestionario inexistente o ajeno.** Se dispara si el identificador no existe o pertenece a otra cuenta. El sistema no revela datos y vuelve a la lista con un aviso de que no está disponible.
- **FA2. Sesión cerrada.** Se dispara si la sesión no es válida. El sistema pide iniciar sesión y no muestra el contenido.
- **FA3. Fallo al cargar.** Se dispara si el detalle no puede leerse. El sistema permite reintentar desde la lista.

**Postcondiciones:** El anfitrión ve el estado guardado del cuestionario. La consulta no lo modifica.

## HU-2.4 Editar título y descripción

**Prioridad:** Corte 1

**Actor:** Anfitrión

**Historia:** Yo como anfitrión, quiero cambiar el título y la descripción de un cuestionario, para corregirlos o actualizarlos antes de una partida.

**Precondiciones:**

- Hay una sesión de anfitrión activa.
- El cuestionario pertenece a esa cuenta.
- Ese cuestionario no tiene una partida activa (HU-2.9).

**Flujo base:**

1. El anfitrión abre la edición del cuestionario.
2. Modifica el título, la descripción o ambos.
3. Confirma el guardado.
4. El sistema valida las mismas reglas de HU-2.1.
5. El sistema guarda los valores nuevos y actualiza la fecha de modificación.
6. El sistema vuelve al detalle con los datos nuevos.

**Criterios de aceptación:**

- El título queda entre 1 y 80 caracteres y la descripción, si existe, en 500 o menos.
- Las preguntas, la portada y el orden no cambian en este flujo.
- La fecha de última modificación avanza aunque el texto resultante sea igual al anterior solo si el anfitrión confirmó un cambio real.

**Flujos alternos:**

- **FA1. Título vacío o textos fuera de límite.** Se dispara con las mismas condiciones que FA1 y FA2 de HU-2.1. El sistema conserva la versión anterior.
- **FA2. Partida activa.** Se dispara si existe una sala abierta de ese cuestionario. El sistema no guarda y explica que podrá editarlo cuando la partida termine o se cierre.
- **FA3. Sin cambios.** Se dispara si el título y la descripción, ya recortados, son iguales a los guardados. El sistema no escribe de nuevo y vuelve al detalle.
- **FA4. Cuestionario inexistente, ajeno o sesión cerrada.** El sistema no guarda y se comporta como en HU-2.3.
- **FA5. El anfitrión cancela.** El sistema descarta lo escrito en el formulario y conserva la versión guardada.
- **FA6. Fallo al guardar.** El sistema conserva la versión anterior y permite reintentar.

**Postcondiciones:** El cuestionario conserva el título y la descripción confirmados. Las preguntas permanecen intactas.

## HU-2.5 Eliminar un cuestionario

**Prioridad:** Corte 1

**Actor:** Anfitrión

**Historia:** Yo como anfitrión, quiero eliminar un cuestionario que ya no voy a usar, para mantener ordenada mi biblioteca.

**Precondiciones:**

- Hay una sesión de anfitrión activa.
- El cuestionario pertenece a esa cuenta.
- Ese cuestionario no tiene una partida activa (HU-2.9).

**Flujo base:**

1. El anfitrión elige eliminar el cuestionario.
2. El sistema pide confirmación y muestra el título.
3. El anfitrión confirma.
4. El sistema elimina el cuestionario, sus preguntas, sus opciones y su portada.
5. El sistema vuelve a la lista, ya sin ese cuestionario.

**Criterios de aceptación:**

- Hace falta una confirmación explícita.
- Al confirmar, el cuestionario deja de aparecer en la lista y no puede abrirse ni usarse para una partida nueva.
- Las partidas ya cerradas y guardadas en el historial conservan una copia de los datos necesarios para consultarse (HU-9.1), aunque el cuestionario vivo ya no exista.
- Cancelar la confirmación no borra nada.

**Flujos alternos:**

- **FA1. El anfitrión cancela la confirmación.** El sistema vuelve al detalle y el cuestionario sigue disponible.
- **FA2. Partida activa.** Se dispara si hay una sala abierta de ese cuestionario. El sistema no elimina y explica el bloqueo.
- **FA3. Cuestionario inexistente o ajeno.** El sistema no borra nada y vuelve a la lista indicando que no está disponible.
- **FA4. Sesión cerrada.** El sistema no elimina y pide iniciar sesión.
- **FA5. Fallo al eliminar.** El sistema conserva el cuestionario completo y permite reintentar.

**Postcondiciones:** El cuestionario vivo y su contenido editable desaparecen de la cuenta. El historial de partidas ya persistidas sigue consultable.

## HU-2.6 Subir o quitar imagen de portada

**Prioridad:** Corte 2

**Actor:** Anfitrión

**Historia:** Yo como anfitrión, quiero poner o quitar una imagen de portada, para reconocer el cuestionario en mi biblioteca y en el lobby.

**Precondiciones:**

- Hay una sesión de anfitrión activa.
- El cuestionario pertenece a esa cuenta.
- Ese cuestionario no tiene una partida activa (HU-2.9).

**Flujo base:**

1. El anfitrión abre la portada del cuestionario.
2. Elige una imagen.
3. El sistema comprueba el tipo y el tamaño.
4. El sistema guarda la imagen y la muestra en el detalle y en la lista.
5. Si ya había otra portada, la reemplaza.

**Criterios de aceptación:**

- Se aceptan JPEG, PNG y WebP de hasta 2 MB.
- La portada es opcional: un cuestionario sin imagen sigue siendo válido.
- Quitar la portada deja el cuestionario sin imagen y no afecta preguntas ni partidas ya guardadas.
- En el lobby (HU-4.2) se muestra la portada vigente al crear la sala.

**Flujos alternos:**

- **FA1. Tipo o tamaño no admitidos.** Se dispara si el archivo no es JPEG, PNG o WebP, o si pesa más de 2 MB. El sistema no reemplaza la portada anterior.
- **FA2. Quitar portada.** Se dispara si el anfitrión elige quitarla. El sistema borra la imagen de portada y deja el resto del cuestionario igual. Si no había portada, informa que ya está sin imagen.
- **FA3. Partida activa.** El sistema no cambia la portada de un cuestionario con sala abierta.
- **FA4. El anfitrión cancela la selección.** El sistema conserva la portada anterior.
- **FA5. Fallo al guardar el archivo.** El sistema conserva la portada anterior y permite reintentar.
- **FA6. Sesión cerrada o cuestionario no disponible.** El sistema no modifica la portada.

**Postcondiciones:** El cuestionario queda con la portada confirmada, o sin portada si se quitó.

## HU-2.7 Duplicar un cuestionario

**Prioridad:** Corte 2

**Actor:** Anfitrión

**Historia:** Yo como anfitrión, quiero duplicar un cuestionario, para modificar la copia sin cambiar el original.

**Precondiciones:**

- Hay una sesión de anfitrión activa.
- El cuestionario origen pertenece a esa cuenta.

**Flujo base:**

1. El anfitrión elige duplicar el cuestionario.
2. El sistema crea una copia con el título «{título original} (copia)», recortado a 80 caracteres si hace falta.
3. La copia incluye descripción, portada, preguntas, opciones, marcas de correcta, tiempos, puntajes e imágenes de pregunta, en el mismo orden.
4. La copia no incluye partidas ni historial.
5. El sistema abre el detalle de la copia.

**Criterios de aceptación:**

- El original permanece intacto, incluso si después se edita o se elimina la copia.
- La copia pertenece al mismo anfitrión y puede editarse con las reglas normales.
- Si el título con el sufijo supera 80 caracteres, se conserva el sufijo « (copia)» y se recorta el título base.
- Se puede duplicar un cuestionario aunque tenga una partida activa: la copia nace sin partida.

**Flujos alternos:**

- **FA1. Cuestionario origen no disponible.** Se dispara si no existe o es de otra cuenta. El sistema no crea una copia.
- **FA2. Sesión cerrada.** El sistema no crea una copia y pide iniciar sesión.
- **FA3. Fallo a mitad de la copia.** Se dispara si la copia no puede completarse. El sistema no deja un cuestionario parcial visible: o la copia está completa o no existe.
- **FA4. Título ya terminado en « (copia)».** El sistema añade otro sufijo « (copia)» y aplica el mismo recorte a 80 caracteres.

**Postcondiciones:** Existen el cuestionario original y una copia independiente, lista para editarse.

## HU-2.8 Previsualizar el cuestionario

**Prioridad:** Corte 2

**Actor:** Anfitrión

**Historia:** Yo como anfitrión, quiero previsualizar el cuestionario como se verá en la sala, para corregirlo antes de invitar participantes.

**Precondiciones:**

- Hay una sesión de anfitrión activa.
- El cuestionario pertenece a esa cuenta.
- El cuestionario tiene al menos una pregunta válida.

**Flujo base:**

1. El anfitrión elige previsualizar.
2. El sistema muestra la primera pregunta como la verá la pantalla del anfitrión: texto, imagen si existe y opciones con su color y su forma.
3. El anfitrión puede alternar a la vista del participante, que muestra solo colores y formas, el temporizador en pausa y sin texto de las opciones.
4. El anfitrión avanza o retrocede entre preguntas en el orden de juego.
5. El anfitrión cierra la vista previa y vuelve al detalle.

**Criterios de aceptación:**

- La vista previa no crea PIN, no abre sala y no otorga puntos.
- No se puede enviar una respuesta que cuente como jugada.
- El orden, los textos, las imágenes y las marcas de correcta coinciden con lo guardado.
- En la vista del anfitrión se distinguen las opciones correctas. En la vista del participante no se revelan.
- El temporizador se muestra con la duración configurada y no corre.

**Flujos alternos:**

- **FA1. Sin preguntas válidas.** Se dispara si no hay ninguna pregunta completa. El sistema no abre la vista previa e indica que hace falta al menos una pregunta.
- **FA2. Cuestionario no disponible o sesión cerrada.** El sistema no muestra el contenido.
- **FA3. El anfitrión cierra a mitad de la vista.** El sistema vuelve al detalle sin guardar cambios, porque la vista previa no edita.
- **FA4. Fallo al cargar una imagen.** El sistema muestra la pregunta con un aviso de imagen no disponible y permite seguir con el resto de las preguntas.

**Postcondiciones:** El cuestionario guardado permanece igual. No existe una sala nueva.

## HU-2.9 Impedir edición o borrado con partida activa

**Prioridad:** Corte 2

**Actor:** Anfitrión

**Historia:** Yo como anfitrión, quiero que un cuestionario en juego no cambie, para que todos los participantes respondan la misma versión que se proyecta.

**Precondiciones:**

- Hay una sesión de anfitrión activa.
- Existe una sala abierta creada a partir de ese cuestionario y esa sala todavía no ha cerrado.

**Flujo base:**

1. El anfitrión intenta editar el título, la descripción, la portada, una pregunta, el orden, o intenta eliminar el cuestionario.
2. El sistema detecta la partida activa.
3. El sistema rechaza el cambio y explica que el cuestionario está en una partida.
4. El detalle sigue mostrando la versión con la que se abrió la sala.
5. El sistema vuelve a permitir edición y borrado cuando el lobby se cierra (HU-4.7 o HU-10.2 FA2) o cuando la sala llega a la pantalla final (HU-7.4 FA1 o HU-10.2 FA3). Guardar el historial no es lo que levanta el bloqueo.

**Criterios de aceptación:**

- Quedan bloqueados HU-2.4, HU-2.5, HU-2.6, HU-3.1, HU-3.2, HU-3.3, HU-3.4 y HU-3.5 mientras la sala de ese cuestionario esté abierta.
- Duplicar (HU-2.7) y previsualizar (HU-2.8) siguen disponibles.
- Iniciar otra partida del mismo cuestionario también queda bloqueado hasta que la sala actual cierre.
- Los participantes de la sala siguen viendo la versión cargada al crear el PIN.

**Flujos alternos:**

- **FA1. La sala cierra entre la apertura del formulario y el guardado.** Se dispara si la partida termina antes de confirmar el cambio. El sistema revalida el bloqueo y, si ya no hay sala activa, guarda el cambio según la historia que el anfitrión estaba usando.
- **FA2. Dos pestañas.** Se dispara si en una pestaña se abre la sala y en otra se intenta guardar una edición previa. El guardado falla con el mismo aviso de partida activa y la versión de la sala no cambia.
- **FA3. Sala de otro cuestionario.** Se dispara si la partida activa es de otro cuestionario del mismo anfitrión. El bloqueo no afecta al cuestionario que no está en juego.
- **FA4. Consulta de historial.** Ver partidas pasadas no cuenta como edición y no se bloquea.

**Postcondiciones:** Mientras la sala siga abierta, la versión jugable del cuestionario permanece estable. Al cerrarse la sala, el cuestionario vuelve a ser editable.
