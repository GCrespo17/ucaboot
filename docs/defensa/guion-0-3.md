# Defensa · minutos 0 a 3

José Ojeda. Problema, alcance y propuesta de valor. Unas 400 palabras, para decirlas en tres minutos sin leer el informe.

## Guion

Ucaboot es un clon de Kahoot para un salón de clase. El problema que resuelve es concreto: un profesor quiere hacer una pregunta a todo el grupo al mismo tiempo, ver quién respondió y guardar el resultado, sin pedirle a cada estudiante que cree una cuenta.

Hay dos roles. El anfitrión se registra con correo y arma sus cuestionarios. El participante solo escribe un PIN de seis dígitos y un apodo. Desde el celular ve colores y formas, no el texto de la opción, y elige antes de que se acabe el tiempo.

El alcance del curso es esa partida completa y lo que queda después. El anfitrión crea el cuestionario, lo puede duplicar y reordenar, y puede ponerle portada e imágenes. Abre la sala, el grupo juega, y al final el resultado queda guardado: puesto, puntaje, aciertos y cuántos eligieron cada opción. Ese resultado se puede descargar en CSV. No hay chat, ni equipos, ni un modo en el que cada quien responda cuando quiera. Eso quedó fuera a propósito, para poder explicar y defender lo que sí está construido.

La propuesta de valor, para esta materia, no es inventar Kahoot. Es que el juego obliga a separar dos tipos de datos. El cuestionario y el historial tienen que sobrevivir aunque se cierre el navegador, y por eso están en Postgres. La sala, las respuestas y el puntaje de la ronda solo importan mientras se juega, y por eso no van a la base. El servidor, no el celular, decide si la respuesta llegó a tiempo.

Eso es lo que vamos a mostrar: una partida real en la URL pública, y después el registro de esa partida en la base, asociado solo al anfitrión que la creó.

## Preguntas para practicar

De todo el sistema, no solo de datos:

- ¿Qué componente tiene estado y por qué? Postgres y Redis guardan estado. El backend debe poder reemplazarse: la sala no puede vivir solo en su memoria si queremos más de una instancia.
- ¿Qué pasa si Postgres o Redis dejan de responder? El usuario ve un error al guardar o al jugar. El log dice qué dependencia falló, sin correos ni tokens.
- ¿Qué dispara el deploy y qué corre el pipeline? Push o merge a la rama protegida. El workflow corre tipos, pruebas y build del backend y del frontend, y construye las imágenes.
- ¿Dónde están las credenciales? En `.env`, que no se versiona, en los secretos de GitHub y en los paneles de Render y Supabase. La clave de servicio de Storage no va al frontend.
- ¿Por qué estos proveedores? Vercel sirve el estático, Render mantiene el proceso de Socket.IO, Supabase junta Postgres y Auth, Redis Cloud es el destino de las salas. No alquilamos máquinas.
- ¿Qué cambia con cien veces más tráfico? Una sola instancia de Socket.IO y el pool de Postgres se vuelven el cuello. Hacen falta varias instancias, adaptador de Redis y el pooler de Supabase.
- ¿Por qué `closesAt` y no una cuenta regresiva? El reloj del cliente se atrasa. El servidor guarda la hora de cierre y con eso acepta o rechaza.
- ¿Cómo se cuenta una respuesta una sola vez? La sala guarda una respuesta por jugador y por pregunta. La segunda se rechaza.
- ¿Cómo se identifica el participante y cómo vuelve? No tiene cuenta. Recibe un token aleatorio que la sala reconoce.
- ¿Qué hace cada etapa del Dockerfile? Una instala dependencias, otra compila, la de ejecución solo lleva el JavaScript compilado.
- ¿Cómo se verifica el JWT? El frontend lo pide a Supabase Auth. El backend solo comprueba la firma y saca el id del usuario.

De datos:

- ¿Por qué el historial guarda una copia? Porque el cuestionario vivo se puede editar o borrar, y el resultado de esa partida no debe cambiar.
- ¿Por qué 404 y no 403? Un 403 le dice al cliente que el id existe y es de otro. El 404 no distingue "no existe" de "no es tuyo".
- ¿Qué pasa si se cae Postgres? No se puede crear un cuestionario ni leer el historial. La sala que ya está en memoria puede seguir hasta que necesite guardar el cierre.
- ¿Cómo se restaura un respaldo? `pg_dump` del esquema `public`. En un Postgres vacío hay que tener `auth.users` antes, porque `host_id` apunta ahí. Las imágenes del bucket no vienen en ese archivo.
- ¿Cómo se guarda una partida una sola vez? `room_key` es único: el PIN más el instante en que se creó la sala. El segundo intento no inserta.
