# Épica 1. Cuenta del creador

Un visitante crea una cuenta de anfitrión, entra, sale y administra el acceso a esa cuenta. El participante de una partida no usa esta épica: se une sin registro.

Reglas de correo y contraseña: [índice](00-indice.md).

## HU-1.1 Registrarse con correo y contraseña

**Prioridad:** Corte 1

**Actor:** Visitante

**Historia:** Yo como visitante, quiero registrarme con mi correo y una contraseña, para crear cuestionarios y dirigir partidas.

**Precondiciones:**

- El visitante no tiene una sesión activa.
- El correo todavía no pertenece a una cuenta.

**Flujo base:**

1. El visitante abre la pantalla de registro.
2. Ingresa correo, contraseña y confirmación de contraseña.
3. Confirma el registro.
4. El sistema valida el formato del correo, la política de contraseña y que ambas contraseñas coincidan.
5. El sistema comprueba que el correo no esté registrado.
6. El sistema crea la cuenta y abre una sesión de anfitrión.
7. El sistema muestra el panel de cuestionarios de esa cuenta.

**Criterios de aceptación:**

- El registro exige correo, contraseña y confirmación.
- El correo se guarda en minúsculas y sin espacios alrededor.
- La contraseña cumple la política del índice y coincide con la confirmación.
- Al terminar, el visitante queda autenticado como anfitrión sin un segundo inicio de sesión.
- La contraseña no vuelve a mostrarse en claro.
- El panel solo lista cuestionarios de esa cuenta.

**Flujos alternos:**

- **FA1. Correo ya registrado.** Se dispara si el correo ya pertenece a una cuenta. El sistema no crea otra cuenta, conserva los datos escritos salvo la contraseña y la confirmación, e indica que ese correo ya tiene cuenta y que puede iniciar sesión.
- **FA2. Contraseñas distintas.** Se dispara si la contraseña y la confirmación difieren. El sistema no crea la cuenta y señala los dos campos.
- **FA3. Contraseña fuera de política.** Se dispara si la contraseña tiene menos de 8 caracteres o no incluye letra y número. El sistema no crea la cuenta y muestra la política.
- **FA4. Correo inválido.** Se dispara si el correo está vacío o no tiene formato de correo. El sistema no crea la cuenta y señala el campo.
- **FA5. Campos vacíos.** Se dispara si falta alguno de los tres campos. El sistema no crea la cuenta y señala cada campo vacío.
- **FA6. Sesión ya activa.** Se dispara si el visitante abre el registro con una sesión de anfitrión abierta. El sistema lo lleva al panel de cuestionarios y no muestra el formulario.
- **FA7. Fallo al crear la cuenta.** Se dispara si la cuenta no puede guardarse. El sistema no abre sesión, conserva el correo escrito y permite reintentar.

**Postcondiciones:** Existe una cuenta nueva y una sesión de anfitrión asociada a ese correo. En los flujos alternos no existe cuenta nueva ni sesión nueva.

## HU-1.2 Iniciar sesión con correo y contraseña

**Prioridad:** Corte 1

**Actor:** Visitante

**Historia:** Yo como visitante, quiero iniciar sesión con mi correo y mi contraseña, para volver a mis cuestionarios y a mis partidas.

**Precondiciones:**

- Existe una cuenta creada con ese correo y una contraseña local.
- El visitante no tiene una sesión activa.

**Flujo base:**

1. El visitante abre la pantalla de inicio de sesión.
2. Ingresa correo y contraseña.
3. Confirma el ingreso.
4. El sistema busca la cuenta por el correo normalizado y comprueba la contraseña.
5. El sistema abre una sesión de anfitrión.
6. El sistema muestra el panel de cuestionarios.

**Criterios de aceptación:**

- El correo se compara sin distinguir mayúsculas y sin espacios alrededor.
- Una contraseña correcta abre la sesión de esa cuenta y de ninguna otra.
- El panel muestra solo los cuestionarios del anfitrión autenticado.
- Una contraseña incorrecta no abre sesión y no revela si el correo existe.

**Flujos alternos:**

- **FA1. Credenciales incorrectas.** Se dispara si el correo no existe o la contraseña no coincide. El sistema no abre sesión, muestra un único mensaje de correo o contraseña incorrectos y vacía el campo de contraseña.
- **FA2. Campos vacíos.** Se dispara si falta el correo o la contraseña. El sistema no abre sesión y señala el campo vacío.
- **FA3. Correo con formato inválido.** Se dispara si el texto no tiene formato de correo. El sistema no consulta la contraseña y señala el campo.
- **FA4. Sesión ya activa.** Se dispara si ya hay una sesión de anfitrión. El sistema lleva al panel y no vuelve a pedir credenciales.
- **FA5. Fallo al abrir la sesión.** Se dispara si las credenciales son correctas y la sesión no puede crearse. El sistema no deja al usuario a medias y permite reintentar.

**Postcondiciones:** Hay una sesión de anfitrión de esa cuenta. En los flujos alternos la sesión sigue cerrada.

## HU-1.3 Cerrar sesión

**Prioridad:** Corte 1

**Actor:** Anfitrión

**Historia:** Yo como anfitrión, quiero cerrar mi sesión, para que otra persona que use el mismo dispositivo no entre a mis cuestionarios.

**Precondiciones:**

- Hay una sesión de anfitrión activa.

**Flujo base:**

1. El anfitrión elige cerrar sesión.
2. El sistema invalida esa sesión.
3. El sistema muestra la pantalla pública de inicio, desde la que se puede entrar o unirse a una partida.

**Criterios de aceptación:**

- Después de cerrar, las pantallas de cuestionarios, historial y sala de anfitrión exigen un nuevo inicio de sesión.
- Cerrar la sesión no borra cuestionarios, partidas guardadas ni una sala que todavía esté en juego.
- Si el anfitrión cerró sesión durante una sala abierta, la sala sigue existiendo hasta que ocurra lo descrito en HU-4.7, HU-8.4 o HU-10.2.

**Flujos alternos:**

- **FA1. Sesión ya cerrada.** Se dispara si la sesión expiró o ya fue cerrada en otra pestaña. El sistema muestra la pantalla pública y no produce un error de cierre.
- **FA2. Cierre con sala en lobby.** Se dispara si hay una sala creada que todavía no comenzó. El sistema cierra la sesión, mantiene la sala y el PIN, y los participantes siguen en la espera hasta que el anfitrión vuelva (HU-10.2) o la sala se cierre por inactividad de anfitrión según HU-10.2.
- **FA3. Cierre durante una ronda.** Se dispara si la partida ya comenzó. El sistema cierra la sesión del navegador, congela el avance de preguntas porque solo el anfitrión puede avanzarla (HU-7.4) y mantiene puntajes y respuestas ya aceptadas.
- **FA4. Fallo al invalidar la sesión.** Se dispara si el cierre no puede confirmarse. El sistema mantiene la sesión activa e informa que sigue autenticado.

**Postcondiciones:** La sesión de ese dispositivo queda cerrada. Los datos persistentes de la cuenta siguen disponibles para el próximo inicio de sesión.

## HU-1.4 Recuperar contraseña

**Prioridad:** Corte 2

**Actor:** Visitante

**Historia:** Yo como visitante, quiero restablecer mi contraseña desde mi correo, para volver a entrar si la olvidé.

**Precondiciones:**

- El visitante no tiene sesión activa, o tiene sesión y eligió el flujo de recuperación desde el ingreso.
- La recuperación se completa desde un enlace de un solo uso enviado al correo de la cuenta.

**Flujo base:**

1. El visitante abre la recuperación e ingresa su correo.
2. Confirma el envío.
3. El sistema, si existe una cuenta para ese correo, envía un enlace de un solo uso que vence a los 30 minutos.
4. El visitante abre el enlace.
5. Ingresa una contraseña nueva y su confirmación.
6. El sistema valida la política y que ambas coincidan.
7. El sistema reemplaza la contraseña, invalida el enlace y cierra las sesiones abiertas de esa cuenta.
8. El sistema muestra el inicio de sesión para entrar con la contraseña nueva.

**Criterios de aceptación:**

- El mensaje posterior al paso 2 es el mismo exista o no la cuenta, para no revelar qué correos están registrados.
- El enlace sirve una sola vez y solo durante 30 minutos.
- La contraseña nueva cumple la política del índice.
- Las sesiones anteriores quedan cerradas al cambiar la contraseña.
- La contraseña anterior deja de ser válida.

**Flujos alternos:**

- **FA1. Correo sin cuenta.** Se dispara si el correo no existe. El sistema muestra el mismo mensaje de envío y no manda un enlace utilizable.
- **FA2. Correo con formato inválido o vacío.** Se dispara antes del envío. El sistema no simula el envío y señala el campo.
- **FA3. Enlace vencido.** Se dispara si han pasado más de 30 minutos. El sistema no cambia la contraseña y ofrece pedir otro enlace.
- **FA4. Enlace ya usado.** Se dispara si ese enlace ya restableció la contraseña. El sistema no cambia la contraseña y ofrece pedir otro enlace.
- **FA5. Contraseña nueva inválida.** Se dispara si no cumple la política o la confirmación no coincide. El sistema conserva el enlace todavía vigente y no cambia la contraseña.
- **FA6. Fallo al enviar o al guardar.** Se dispara si el correo no sale o la contraseña nueva no se guarda. El sistema no invalida la contraseña anterior y permite reintentar. Si el enlace ya se consumió y el guardado falla, el sistema mantiene vigente un enlace nuevo.

**Postcondiciones:** La cuenta tiene la contraseña nueva y ninguna sesión antigua sigue abierta. En los flujos alternos la contraseña anterior sigue vigente.

## HU-1.5 Editar perfil

**Prioridad:** Alcance completo

**Actor:** Anfitrión

**Historia:** Yo como anfitrión, quiero actualizar mi nombre visible y mi correo, para que mi cuenta refleje cómo quiero identificarme.

**Precondiciones:**

- Hay una sesión de anfitrión activa.
- El perfil tiene un nombre visible. Si nunca se definió, el valor inicial es la parte local del correo.

**Flujo base:**

1. El anfitrión abre su perfil.
2. Modifica el nombre visible, el correo o ambos.
3. Si cambia el correo, ingresa la contraseña actual.
4. Confirma el guardado.
5. El sistema valida el nombre y, si cambió, el correo.
6. El sistema guarda el perfil y muestra los datos nuevos.

**Criterios de aceptación:**

- El nombre visible tiene entre 2 y 40 caracteres tras recortar espacios.
- El correo nuevo se normaliza y no puede coincidir con el de otra cuenta.
- Cambiar el correo exige confirmar la identidad en el mismo intento.
- El nombre visible no sustituye al apodo de un participante: solo identifica al anfitrión en su cuenta.
- Un guardado exitoso deja el perfil como se confirmó.

**Flujos alternos:**

- **FA1. Nombre inválido.** Se dispara si el nombre queda vacío o fuera de 2 a 40 caracteres. El sistema no guarda y señala el campo.
- **FA2. Correo inválido o ajeno.** Se dispara si el formato es inválido o el correo pertenece a otra cuenta. El sistema no guarda y señala el campo.
- **FA3. Identidad no confirmada.** Se dispara si falta la contraseña o la contraseña no coincide. El sistema no cambia el correo.
- **FA4. Sin cambios.** Se dispara si el nombre y el correo normalizado son iguales a los guardados. El sistema no escribe de nuevo y confirma que el perfil sigue igual.
- **FA5. Sesión cerrada.** Se dispara si la sesión venció antes de guardar. El sistema no aplica el cambio y pide iniciar sesión.
- **FA6. Fallo al guardar.** Se dispara si el perfil no puede persistirse. El sistema conserva los valores anteriores y permite reintentar.

**Postcondiciones:** El perfil guardado muestra el nombre y el correo confirmados. El correo anterior deja de servir para iniciar sesión si fue reemplazado.

## HU-1.6 Cambiar contraseña

**Prioridad:** Alcance completo

**Actor:** Anfitrión

**Historia:** Yo como anfitrión, quiero cambiar mi contraseña desde la sesión, para mantener el acceso si creo que otra persona la conoce.

**Precondiciones:**

- Hay una sesión de anfitrión activa.

**Flujo base:**

1. El anfitrión abre el cambio de contraseña.
2. Ingresa la contraseña actual, la nueva y la confirmación.
3. Confirma el cambio.
4. El sistema comprueba la contraseña actual y la política de la nueva.
5. El sistema guarda la contraseña nueva y cierra las demás sesiones de esa cuenta.
6. La sesión desde la que se hizo el cambio permanece abierta.
7. El sistema confirma el cambio.

**Criterios de aceptación:**

- La contraseña actual correcta es obligatoria.
- La contraseña nueva cumple la política y coincide con la confirmación.
- La contraseña nueva es distinta de la actual.
- Las otras sesiones de la cuenta quedan cerradas.
- La sesión actual sigue abierta.

**Flujos alternos:**

- **FA1. Contraseña actual incorrecta.** Se dispara si no coincide. El sistema no cambia nada y vacía los tres campos.
- **FA2. Contraseña nueva inválida.** Se dispara si incumple la política, no coincide con la confirmación o es igual a la actual. El sistema no cambia la contraseña y señala el motivo.
- **FA3. Sesión cerrada.** Se dispara si la sesión venció durante el formulario. El sistema no cambia la contraseña y pide iniciar sesión.
- **FA4. Fallo al guardar.** Se dispara si la contraseña nueva no puede persistirse. La contraseña anterior sigue vigente y las demás sesiones no se cierran.

**Postcondiciones:** La contraseña quedó reemplazada y solo la sesión actual de ese cambio sigue abierta. En los flujos alternos la contraseña anterior sigue vigente.
