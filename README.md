# Ucaboot
### Plataforma de Cuestionarios Interactivos en Tiempo Real (Clon de Kahoot)

[![CI/CD Pipeline](https://img.shields.io/badge/CI%2FCD-GitHub_Actions-blue?logo=github-actions)](https://github.com)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![Cloud](https://img.shields.io/badge/Cloud-Render%20%7C%20Vercel%20%7C%20Supabase-informational)](https://render.com)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## Datos Académicos

* **Institución:** Universidad Católica Andrés Bello (UCAB)
* **Facultad:** Facultad de Ingeniería
* **Escuela:** Escuela de Ingeniería Informática
* **Asignatura:** Computación en la Nube (INFO-02028)
* **Semestre:** Septiembre 2026 – Enero 2027
* **Profesor:** Jorge Rojas

---

## Descripción del Proyecto

**Ucaboot** es una aplicación web interactiva de preguntas y respuestas en tiempo real inspirada en la popular plataforma **Kahoot**. Está diseñada para que profesores, estudiantes y facilitadores puedan crear cuestionarios de evaluación o dinámicas de aprendizaje gamificadas, proyectar preguntas en vivo frente a una audiencia y permitir que decenas de participantes se unan simultáneamente desde sus propios dispositivos (celulares, tablets o laptops) mediante un código PIN único, sin necesidad de registro previo.

La experiencia de uso se divide en dos roles claramente diferenciados:

- **Anfitrión (Host):** Es quien crea el cuestionario, inicia la partida y proyecta las preguntas en una pantalla compartida (proyector, TV o monitor). Controla el flujo del juego: avanza entre preguntas, visualiza estadísticas en vivo y presenta el podio final.
- **Participante (Jugador):** Se une a la partida ingresando el PIN y un apodo. Desde su dispositivo personal ve las opciones de respuesta (representadas por colores y formas), selecciona su respuesta antes de que se agote el tiempo, y recibe retroalimentación inmediata sobre si acertó o falló, junto con su puntaje acumulado y posición en el ranking.

El sistema busca replicar la mecánica central de Kahoot: la combinación de presión de tiempo, competencia entre pares y retroalimentación instantánea que convierte una evaluación convencional en una experiencia de juego motivadora.

### Justificación desde la perspectiva de Computación en la Nube

Un sistema tipo Kahoot es un caso de estudio especialmente relevante para la asignatura porque expone de forma natural los desafíos fundamentales de los sistemas distribuidos en la nube:

1. **Comunicación en tiempo real y concurrencia:** El juego requiere comunicación bidireccional de baja latencia (WebSockets) entre el anfitrión y todos los participantes. Las respuestas deben llegar al servidor dentro de ventanas de tiempo estrictas (5-30 segundos por pregunta), y todos los clientes deben estar sincronizados en la misma pregunta al mismo tiempo.
2. **Gestión de estado efímero vs. persistente:** Una partida activa genera estado volátil (qué jugadores están conectados, qué pregunta se está mostrando, qué respuestas se han recibido, los puntajes parciales) que debe existir en memoria con acceso ultra-rápido pero que no necesita sobrevivir más allá del fin de la partida. Esto contrasta con los datos persistentes (cuestionarios creados, cuentas de usuario, historial de resultados) que requieren almacenamiento relacional duradero.
3. **Escalabilidad horizontal:** El servidor debe poder manejar múltiples salas de juego simultáneas, cada una con decenas de participantes enviando respuestas concurrentemente. La arquitectura debe permitir agregar instancias del backend sin perder consistencia en el estado de las partidas.
4. **Resiliencia ante desconexiones:** En un entorno donde los participantes usan redes móviles o Wi-Fi inestable, el sistema debe manejar desconexiones y reconexiones sin perder el progreso del jugador.


## Alcance Funcional

### 1. Autenticación y Gestión de Usuarios

El sistema contempla dos tipos de acceso:

- **Creadores / Anfitriones (con cuenta):** Se registran con correo electrónico y contraseña (o autenticación social vía Google/GitHub). Una vez autenticados, pueden crear, editar y eliminar cuestionarios, así como iniciar partidas y acceder al historial de resultados de sus juegos anteriores.
- **Participantes (sin cuenta):** No requieren registro. Para unirse a una partida solo necesitan el código PIN y elegir un apodo (nickname). Su identidad es efímera y existe únicamente durante la duración de la partida.

### 2. Gestión de Cuestionarios (CRUD)

Los usuarios autenticados (anfitriones) disponen de un panel para administrar sus cuestionarios:

- **Crear cuestionario:** Definir título, descripción opcional e imagen de portada opcional.
- **Agregar preguntas:** Cada pregunta incluye:
  - Texto de la pregunta (obligatorio).
  - Imagen o multimedia adjunta (opcional, para preguntas visuales).
  - Entre 2 y 4 opciones de respuesta, cada una con su texto.
  - Indicación de cuál(es) opción(es) es(son) la(s) correcta(s) (al menos una).
  - Tiempo límite de respuesta configurable por pregunta (ej: 5, 10, 15, 20, 30 segundos).
  - Puntaje base configurable (ej: 1000 puntos), con bonificación por velocidad de respuesta.
- **Editar y eliminar:** Modificar cualquier campo de un cuestionario existente o eliminarlo por completo. Un cuestionario no puede ser editado mientras una partida basada en él está activa.
- **Duplicar cuestionario:** Crear una copia de un cuestionario existente para modificarla sin afectar el original.
- **Vista previa:** El anfitrión puede previsualizar el cuestionario tal como lo verán los participantes antes de iniciar una partida.

### 3. Flujo de Juego en Tiempo Real

Este es el módulo central de la aplicación. El flujo completo de una partida sigue estas fases:

#### 3.1. Creación de Sala y Lobby
1. El anfitrión selecciona un cuestionario y presiona "Iniciar Partida".
2. El servidor genera un **código PIN numérico único** (ej: 6 dígitos) y crea una sala de juego asociada en el sistema de caché.
3. Se muestra la pantalla de lobby en el dispositivo del anfitrión, con el PIN destacado y un código QR para facilitar el acceso desde móviles.
4. A medida que los participantes se unen, sus apodos aparecen en la pantalla del lobby en tiempo real, con animaciones de entrada.
5. El anfitrión puede **expulsar** jugadores del lobby antes de iniciar (ej: apodos inapropiados).
6. Cuando el anfitrión considera que hay suficientes jugadores, presiona "Comenzar".

#### 3.2. Ronda de Preguntas
1. La pregunta se muestra simultáneamente en la pantalla del anfitrión (con texto completo, imagen y opciones) y en los dispositivos de los participantes (solo las opciones representadas por colores/formas).
2. Se inicia un **temporizador regresivo** visible para todos. Los participantes deben seleccionar su respuesta antes de que el tiempo se agote.
3. El puntaje otorgado a cada respuesta correcta depende de la **velocidad**: responder más rápido otorga más puntos (fórmula basada en el porcentaje de tiempo restante multiplicado por el puntaje base).
4. Una vez que todos han respondido o el tiempo se agota, se cierra la recepción de respuestas.

#### 3.3. Resultados por Pregunta
1. Se revela la **respuesta correcta** en la pantalla del anfitrión, junto con un gráfico de barras que muestra cuántos jugadores eligieron cada opción.
2. En el dispositivo del participante se muestra si acertó o falló, los puntos ganados en esa ronda y su puntaje total acumulado.
3. Se muestra un **leaderboard parcial** con los 5 mejores jugadores tras esa pregunta.
4. El anfitrión avanza manualmente a la siguiente pregunta cuando lo considere oportuno.

#### 3.4. Podio Final
1. Al completar todas las preguntas, se presenta un **podio animado** con los 3 primeros lugares.
2. Se muestra una tabla de resultados completa con todos los participantes, su puntaje final, número de respuestas correctas y tiempo promedio de respuesta.
3. Los resultados de la partida se persisten en la base de datos para que el anfitrión pueda consultarlos posteriormente.

### 4. Experiencia del Participante (Jugador)

El flujo del participante está optimizado para dispositivos móviles y busca ser lo más simple posible:

1. **Acceso:** El jugador abre la URL de la aplicación (o escanea el QR mostrado por el anfitrión).
2. **Unirse:** Ingresa el PIN de 6 dígitos y elige un apodo.
3. **Espera:** Ve una pantalla de espera indicando que el anfitrión aún no ha comenzado.
4. **Jugar:** En cada ronda, ve las opciones (colores/formas que corresponden a las respuestas mostradas en el proyector) y selecciona una antes del tiempo límite.
5. **Retroalimentación:** Tras cada pregunta, ve si acertó, los puntos ganados y su posición actualizada.
6. **Final:** Ve su puntaje final y posición en el ranking general.

### 5. Historial y Estadísticas

Los anfitriones pueden acceder a un historial de las partidas que han organizado:

- Lista de partidas pasadas con fecha, cuestionario usado y número de participantes.
- Detalle de cada partida: ranking final, distribución de respuestas por pregunta y porcentaje de acierto global.
- Exportación de resultados en formato CSV para análisis externo o registro de calificaciones.



---

## Licencia

Este proyecto se distribuye bajo la licencia **MIT**. Consulte el archivo `LICENSE` para más información.
