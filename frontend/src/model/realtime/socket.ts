import { io } from "socket.io-client";
import { API_URL } from "../api/config";
import { getAccessToken } from "../auth/supabase";

// Connects to the backend (same origin, or VITE_API_URL if it's on another domain).
// The host sends their Supabase access token in the handshake; participants have none.
export const socket = io(API_URL || undefined, {
  autoConnect: false,
  auth: (cb) => {
    void getAccessToken().then((token) => cb({ token }));
  },
});
