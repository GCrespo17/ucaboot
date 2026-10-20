# Historias de usuario de Ucaboot

Catálogo funcional de Ucaboot, el clon de Kahoot descrito en el [README](../../README.md). Cada épica vive en su propio archivo dentro de `docs/specs`. Estas historias cubren el alcance funcional que el informe técnico debe poder explicar (funciones, exclusiones y casos de uso). La arquitectura, los contenedores, el CI/CD y la observabilidad se documentan aparte: no son historias de usuario.

## Actores

- **Visitante.** Persona sin sesión. Puede registrarse, iniciar sesión o unirse a una partida.
- **Anfitrión.** Usuario autenticado. Crea cuestionarios, abre la sala, proyecta las preguntas y consulta resultados.
- **Participante.** Jugador sin cuenta. Entra con un PIN y un apodo. Su identidad existe solo durante esa partida.

## Prioridades

| Etiqueta | Entrega | Uso |
| --- | --- | --- |
| Corte 1 | 28–30 de octubre de 2026 | MVP jugable de punta a punta |
| Corte 2 | 9–11 de diciembre de 2026 | Producto cercano al estado final |
| Alcance completo | 15–16 de diciembre de 2026 | Defensa del sistema completo |

La etiqueta no recorta la redacción: todas las historias incluyen flujo base, criterios de aceptación y flujos alternos.

## Mapa de épicas

1. [Cuenta del creador](epica-01-cuenta.md)
2. [Biblioteca de cuestionarios](epica-02-cuestionarios.md)
3. [Preguntas](epica-03-preguntas.md)
4. [Sala y lobby del anfitrión](epica-04-sala-lobby.md)
5. [Unión del participante](epica-05-union-participante.md)
6. [Ronda en tiempo real](epica-06-ronda.md)
7. [Resultados de cada pregunta](epica-07-resultados.md)
8. [Podio y cierre](epica-08-podio.md)
9. [Historial](epica-09-historial.md)
10. [Resiliencia de la partida](epica-10-resiliencia.md)

## Recorrido del corte 1

Un anfitrión se registra e inicia sesión con correo (HU-1.1, HU-1.2), crea un cuestionario (HU-2.1 a HU-2.5) con preguntas de texto (HU-3.1 a HU-3.3) e inicia una partida (HU-4.1). En el lobby ve el PIN y los apodos que entran (HU-4.2, HU-4.4). El participante se une sin cuenta y espera (HU-5.1, HU-5.2). El anfitrión comienza (HU-4.6). En cada ronda se proyecta la pregunta, el participante elige una opción antes de que cierre el tiempo y el acierto rápido vale más puntos (HU-6.1 a HU-6.4). Se revela la correcta, el participante ve su resultado y el anfitrión avanza (HU-7.1, HU-7.2, HU-7.4). Al terminar, el anfitrión ve el orden final en una pantalla simple y el participante ve su puesto y su puntaje (HU-8.3). Puede cerrar sesión (HU-1.3). El podio animado es de corte 2 (HU-8.1).

## Reglas transversales

Estas reglas se usan en varias historias. Cada historia las aplica; no se repiten como historias aparte.

- **Contraseña.** Mínimo 8 caracteres, con al menos una letra y un número. La confirmación debe coincidir con la contraseña. El sistema nunca vuelve a mostrar la contraseña en claro.
- **Correo.** Se guarda en minúsculas y sin espacios alrededor. Dos cuentas no pueden compartir el mismo correo.
- **Apodo.** De 2 a 20 caracteres visibles tras recortar espacios. Único dentro de la sala, sin distinguir mayúsculas. No puede estar vacío.
- **PIN.** Seis dígitos numéricos. Identifica una sola sala abierta a la vez.
- **Opciones de respuesta.** Cada pregunta tiene entre 2 y 4 opciones. Al menos una está marcada como correcta. El participante elige una sola opción. Si esa opción está marcada como correcta, la respuesta es acertada.
- **Colores y formas.** El orden de las opciones fija una pareja color-forma igual en la pantalla del anfitrión y en la del participante: rojo/triángulo, azul/rombo, amarillo/círculo y verde/cuadrado. El participante ve la pareja, no el texto de la opción.
- **Tiempo.** Cada pregunta usa 5, 10, 15, 20 o 30 segundos. El temporizador es el mismo para toda la sala.
- **Puntaje.** Una respuesta incorrecta, ausente o tardía vale 0. Una respuesta correcta aceptada vale `redondeo(puntajeBase × tiempoRestante / tiempoLímite)`. El puntaje base es un entero entre 100 y 2000. `tiempoRestante` es el tiempo que faltaba, en la misma unidad que el límite, en el instante en que el servidor acepta la respuesta.
- **Desempate.** El orden de una sala es: mayor puntaje total, luego más aciertos, luego menor tiempo promedio de las preguntas con respuesta aceptada. Quien no tiene ninguna respuesta aceptada queda detrás de quien sí tiene promedio. Si el empate continúa, queda antes quien entró primero al lobby. Un empate que llega a mostrarse comparte puesto y el puesto siguiente se salta. El ranking parcial muestra como máximo 5 personas y el podio como máximo 3. El corte no agrega empatados por encima de ese tope: los que no caben siguen el mismo orden y quedan fuera de esa vista.
- **Partida activa.** Una sala está activa mientras sigue en lobby, en una pregunta, en una revelación o en el cierre en vivo. El cuestionario de esa sala no se edita ni se elimina durante ese tiempo. La sala deja de estar activa al cerrar el lobby (HU-4.7 o HU-10.2 FA2) o al llegar a la pantalla final. Guardar el historial no es lo que mantiene el bloqueo.
- **Límite de sala.** Si el anfitrión no configura otro valor, el máximo es 50 participantes. El valor configurable se define en HU-4.8.

## Trazabilidad con el README

| Sección del README | Épicas |
| --- | --- |
| 1. Autenticación y gestión de usuarios | E1, y las historias de perfil y recuperación acordadas además del README |
| 2. Gestión de cuestionarios | E2 y E3. Reordenar preguntas es una historia añadida |
| 3. Flujo de juego en tiempo real | E4, E6, E7 y E8 |
| 4. Experiencia del participante | E5, E6, E7, E8 y E10 |
| 5. Historial y estadísticas | E9 |
| Resiliencia ante desconexiones | E10 |
| Límite de sala | E4. No aparece en el README; se acordó como alcance del producto |

## Exclusiones

Estas capacidades no tienen historia y no forman parte del alcance:

- Chat entre participantes o con el anfitrión.
- Modo asíncrono o de tarea, en el que cada quien responde por su cuenta.
- Cuestionarios públicos o reutilizables por otros anfitriones.
- Equipos, música, rachas y pagos.
- Moderación automática de apodos y reporte de apodos. El control previsto es la expulsión manual.
