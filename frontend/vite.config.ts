import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ command, mode }) => {
  if (command === "build") return { plugins: [react()] };

  // Dev server behind nginx, which routes /api, /socket.io and /auth/v1
  const env = loadEnv(mode, process.cwd(), ''); 
  const port = Number(env.FRONTEND_PORT || process.env.FRONTEND_PORT);
  if (!port) throw new Error("FRONTEND_PORT must be set");

  return {
    plugins: [react()],
    server: { host: true, port, strictPort: true },
  };
});
