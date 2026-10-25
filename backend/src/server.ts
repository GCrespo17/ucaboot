import { existsSync } from "node:fs";
import { createServer } from "node:http";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { createApp } from "./app.js";
import { buildContainer } from "./container.js";
import { db } from "./infra/db/client.js";
import { env } from "./config/env.js";
import { createSocketServer } from "./controllers/sockets/socket.js";

// Applies pending migrations (none exist until the first domain table is generated)
if (existsSync("./drizzle/meta/_journal.json")) {
  await migrate(db, { migrationsFolder: "./drizzle" });
}

const container = buildContainer();
const httpServer = createServer();
const io = createSocketServer(httpServer);

io.on("connection", (socket) => {
  container.logger.info("socket connected", { socketId: socket.id });
});

httpServer.on("request", createApp(container));

httpServer.listen(env.PORT, () => {
  container.logger.info("API listening", { port: env.PORT });
});
