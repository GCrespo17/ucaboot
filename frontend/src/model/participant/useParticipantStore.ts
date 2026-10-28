import { create } from 'zustand'; 
import { 
    type ParticipantState, 
    type ParticipantAction, 
    initialParticipantState, 
    participantReducer 
} from './participantReducer'; 

interface ParticipantStore extends ParticipantState { 
    dispatch: (action: ParticipantAction) => void; 
} 

export const useParticipantStore = create<ParticipantStore>((set) => ({
  ...initialParticipantState,
  dispatch: (action) => set((state) => participantReducer(state, action)),
}));

if (typeof window !== 'undefined') { 
    (window as unknown as { useParticipantStore: typeof useParticipantStore }).useParticipantStore = useParticipantStore;
}