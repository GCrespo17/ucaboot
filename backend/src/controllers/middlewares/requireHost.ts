import type { RequestHandler } from "express";
import { bearerToken, verifyAccessToken } from "../../auth/supabase.js";

// Protects host routes: requires "Authorization: Bearer <Supabase access token>".
// Leaves the host's id (auth.users.id) in res.locals.hostId.
export const requireHost: RequestHandler = async (req, res, next) => {
  const token = bearerToken(req.headers.authorization);
  const hostId = token ? await verifyAccessToken(token) : null;
  if (!hostId) {
    res.status(401).json({ error: "UNAUTHORIZED", message: "Missing or invalid access token" });
    return;
  }
  res.locals.hostId = hostId;
  next();
};
