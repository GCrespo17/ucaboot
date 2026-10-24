import { existsSync } from "node:fs";
import { createServer } from "node:http";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { app } from "./app.js";
import { db } from "./infra/db/client.js";
import { env } from "./config/env.js";
import { createSocketServer } from "./controllers/sockets/socket.js";

// Applies pending migrations (none exist until the first domain table is generated)
if (existsSync("./drizzle/meta/_journal.json")) {
  await migrate(db, { migrationsFolder: "./drizzle" });
}

const httpServer = createServer(app);
const io = createSocketServer(httpServer);

io.on("connection", (socket) => {
  console.log("socket connected", socket.id);
});

httpServer.listen(env.PORT, () => {
  console.log(`API listening on port ${env.PORT}`);
});
