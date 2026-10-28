import { io } from "socket.io-client";
import { API_URL } from "../api/config";
import { getAccessToken } from "../auth/supabase";
import { useParticipantStore } from "../participant/useParticipantStore";

// Connects to the backend (same origin, or VITE_API_URL if it's on another domain).
// The host sends their Supabase access token in the handshake; participants have none.

export const socket = io(API_URL || undefined, {
  autoConnect: false,
  auth: (cb) => {
    void getAccessToken().then((token) => cb({ token }));
  },
});



/* Registra los escuchadores de eventos emitidos por el servidor 
y actualiza el reducer de Zustand del participante. */ 
export const setupParticipantSocketListeners = () => { 
  // Limpia listeners previos para evitar ejecuciones duplicadas 
  socket.removeAllListeners('question:open'); 
  socket.removeAllListeners('player:result'); 
  socket.removeAllListeners('game:end'); 
  
  socket.on('question:open', (data) => { 
    useParticipantStore.getState().dispatch({ 
      type: 'QUESTION_OPEN', 
      payload: data, 
    }); 
  }); 
  
  socket.on('player:result', (data) => { 
    useParticipantStore.getState().dispatch({ 
      type: 'ROUND_RESULT', 
      payload: data, 
    }); 
  }); 
  
  socket.on('game:end', (data) => { 
    useParticipantStore.getState().dispatch({ 
      type: 'GAME_OVER', 
      payload: data, 
    }); 
  }); 
}; 

/* Funciones para emitir acciones hacia el backend */ 
export const emitJoinRoom = (pin: string, nickname: string) => { 
  if (!socket.connected) { 
    socket.connect(); 
  } 
  
  socket.emit('player:join', { pin, nickname }, (response?: { ok: boolean; error?: string }) => { 
    if (!response || response.ok) { 
      useParticipantStore.getState().dispatch({ 
        type: 'JOIN_ROOM', 
        payload: { pin, nickname }, 
      }); 
    } 
  }); 
}; 

export const emitSubmitAnswer = (optionId: string) => { 
  const state = useParticipantStore.getState(); 
  if (state.status === 'pregunta') { 
    socket.emit('player:answer', { optionId }); 
    useParticipantStore.getState().dispatch({ 
      type: 'SUBMIT_ANSWER', 
      payload: { optionId }, 
    }); 
  } 
};