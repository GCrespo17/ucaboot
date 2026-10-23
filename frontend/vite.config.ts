import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ command }) => {
  if (command === "build") return { plugins: [react()] };

  // Dev server behind nginx, which routes /api, /socket.io and /auth/v1
  const port = Number(process.env.FRONTEND_PORT);
  if (!port) throw new Error("FRONTEND_PORT must be set");

  return {
    plugins: [react()],
    server: { host: true, port, strictPort: true },
  };
});
