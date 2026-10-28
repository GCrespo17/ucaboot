import { existsSync } from "node:fs";
import { createServer } from "node:http";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { createApp } from "./app.js";
import { buildContainer } from "./container.js";
import { db } from "./infra/db/client.js";
import { env } from "./config/env.js";
import { registerSocketHandlers } from "./controllers/sockets/registerSocketHandlers.js";
import { createSocketServer } from "./controllers/sockets/socket.js";

// Applies pending migrations (none exist until the first domain table is generated)
if (existsSync("./drizzle/meta/_journal.json")) {
  await migrate(db, { migrationsFolder: "./drizzle" });
}

// Express must be the server's request listener before Socket.IO attaches: engine.io wraps the
// existing listeners so /socket.io/ requests never reach Express. A listener added afterwards
// would also answer them, and the double response crashes Node (ERR_HTTP_HEADERS_SENT).
// `app` is assigned before listen(), so no request can hit it uninitialized.
const httpServer = createServer((req, res) => app(req, res));
const io = createSocketServer(httpServer);
const container = buildContainer(io);
const app = createApp(container);

registerSocketHandlers(io, container);

httpServer.listen(env.PORT, () => {
  container.logger.info("API listening", { port: env.PORT });
});
