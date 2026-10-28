# Ucaboot · Seguridad del backend

Controles de seguridad del backend, la amenaza que mitiga cada uno y dónde está en el código. La autenticación con Supabase Auth se explica en [`arquitectura_inicial.md`](arquitectura_inicial.md#4-autenticación).

---

## 1. Controles

| Amenaza | Control | Código |
| --- | --- | --- |
| Un anfitrión lee o modifica cuestionarios ajenos | Toda ruta de anfitrión exige el JWT de Supabase (`requireHost`) y filtra por `hostId`. Un cuestionario ajeno responde **404**, no 403, para no revelar que existe | `middlewares/requireHost.ts`, `services/quizService.ts` |
| Adivinar PINs probando `player:join` hasta dar con una sala abierta | Máximo **30 PIN fallidos por IP cada 10 min**. Solo cuentan `PIN_INVALID` y `PIN_NOT_FOUND`: un salón entero entra desde la misma IP pública y sus uniones correctas no deben bloquearse | `sockets/joinAttempts.ts`, `sockets/playerHandlers.ts` |
| Abrir salas en masa | Máximo **10 salas por minuto por anfitrión** en `POST /api/rooms` | `routes/rooms.ts` |
| Inundar la API | Máximo **300 peticiones por minuto por IP** en `/api` (no aplica a `/api/health`) | `middlewares/rateLimit.ts`, `app.ts` |
| Falsificar la IP para saltarse los límites | Solo se confía en `TRUST_PROXY_HOPS` proxies. Las entradas de `X-Forwarded-For` más a la izquierda las escribe el cliente y se ignoran | `app.ts` (`trust proxy`), `sockets/clientIp.ts` |
| Payloads enormes que consumen memoria | JSON de hasta **32 KB** (413 si se excede) y mensajes de Socket.IO de hasta **16 KB** | `app.ts`, `sockets/socket.ts` |
| Errores que filtran detalles internos | Error no previsto = 500 `INTERNAL` genérico; el detalle va solo al log. JSON mal formado = 400, no 500. `/api/health` dice `up`/`down`, nunca el error | `rest/errorHandler.ts`, `routes/health.ts` |
| Clickjacking, *MIME sniffing*, fuga del *referrer* | Cabeceras `X-Content-Type-Options`, `X-Frame-Options`, `Content-Security-Policy`, `Referrer-Policy`, `Strict-Transport-Security`; sin `X-Powered-By` | `middlewares/securityHeaders.ts` |
| Llamadas desde otros sitios | CORS solo para los orígenes de `CORS_ORIGINS` | `middlewares/cors.ts` |
| Entrada maliciosa o malformada | Todo cuerpo REST y todo evento de socket se valida con zod antes de llegar al servicio | `rest/quizInput.ts`, `sockets/schemas.ts` |
| Secretos en el repositorio | `.env` en `.gitignore`; en la nube, en los paneles de Render/Vercel y en GitHub Secrets | `.gitignore` |

Respuesta de un límite superado (REST con cabecera `Retry-After`, o el *ack* del socket):

```json
{ "error": "RATE_LIMITED", "message": "Too many requests", "retryAfterSeconds": 42 }
```

## 2. `TRUST_PROXY_HOPS`

Número de proxies propios delante del backend que agregan la IP del cliente a `X-Forwarded-For`. Por defecto vale `1`, que corresponde a nginx en local y al balanceador de carga de Render.

- **Si es menor que la cantidad real**, el backend ve la IP del proxy: todos los clientes comparten un mismo contador y se bloquean entre sí.
- **Si es mayor**, el backend lee una entrada que escribió el cliente: cualquiera puede falsificar su IP y saltarse los límites.

**Cómo verificarlo en producción:** hacer una petición y comparar la IP que registra el backend con la IP pública propia. Si no coinciden, ajustar `TRUST_PROXY_HOPS` en el panel de Render.

## 3. Límites conocidos

- **Los contadores viven en memoria de cada instancia.** Con una instancia es exacto. Con varias, cada una cuenta por su lado, y el límite efectivo se multiplica por el número de instancias. Al escalar horizontalmente, los contadores pasan a Redis (`INCR` + `EXPIRE`), igual que el estado de las salas.
- **Un reinicio del backend reinicia los contadores.**
- **El límite por IP no distingue usuarios detrás de la misma IP** (un salón, una red móvil con NAT). Por eso el límite de uniones solo cuenta fallos y el general es holgado.
