import { describe, it, expect } from 'vitest'; 
import { 
    participantReducer, 
    initialParticipantState, 
    type ParticipantState 
} from './participantReducer'; 

describe('participantReducer', () => { 

    it('debe iniciar en estado "esperando" al unirse a una sala', () => { 
        const action = { 
            type: 'JOIN\_ROOM' as const, 
            payload: { 
                pin: '123456', 
                nickname: 'Pablo' 
            } 
        }; 
        const state = participantReducer(initialParticipantState, action); 

        expect(state.status).toBe('esperando'); 
        expect(state.pin).toBe('123456'); 
        expect(state.nickname).toBe('Pablo'); 
    }); 
    
    it('debe cambiar a "pregunta" al recibir QUESTION\_OPEN', () => { 
        const action = { 
            type: 'QUESTION\_OPEN' as const, 
            payload: { 
                questionIndex: 1, 
                totalQuestions: 5, 
                timeLimit: 20, 
                closesAt: Date.now() + 20000, 
            } 
        }; 
        const state = participantReducer(initialParticipantState, action); 
        
        expect(state.status).toBe('pregunta'); 
        expect(state.currentQuestion?.questionIndex).toBe(1); 
        expect(state.selectedOptionId).toBeNull(); 
    }); 
    
    it('debe cambiar a "respondí" al enviar una opción válida', () => { 
        const stateEnPregunta: ParticipantState = { 
            ...initialParticipantState, 
            status: 'pregunta', 
            currentQuestion: { 
                questionIndex: 1, 
                totalQuestions: 5, 
                timeLimit: 20, 
                closesAt: Date.now() + 20000 
            } 
        }; 
        const action = { 
            type: 'SUBMIT\_ANSWER' as const, 
            payload: { 
                optionId: 'opt-red-triangle' 
            } 
        }; 
        const nextState = participantReducer(stateEnPregunta, action); 
        
        expect(nextState.status).toBe('respondí'); 
        expect(nextState.selectedOptionId).toBe('opt-red-triangle'); 
    }); 
    
    it('NO debe registrar respuesta si no está en estado "pregunta"', () => { 
        const stateEnEsperando: ParticipantState = { 
            ...initialParticipantState, 
            status: 'esperando' 
        }; 
        const action = { 
            type: 'SUBMIT\_ANSWER' as const, 
            payload: { 
                optionId: 'opt-red-triangle' 
            } 
        }; 
        const nextState = participantReducer(stateEnEsperando, action); 
        
        expect(nextState.status).toBe('esperando'); 
        expect(nextState.selectedOptionId).toBeNull(); 
    }); 
    
    it('debe cambiar a "resultado" al recibir ROUND\_RESULT', () => { 
        const action = { 
            type: 'ROUND\_RESULT' as const, 
            payload: { 
                isCorrect: true, 
                scoreGained: 850, 
                totalScore: 850, 
                rank: 2 
            } 
        }; 
        const state = participantReducer(initialParticipantState, action); 
        
        expect(state.status).toBe('resultado'); 
        expect(state.lastRoundResult?.isCorrect).toBe(true); 
        expect(state.lastRoundResult?.totalScore).toBe(850); 
    }); 
    
    it('debe cambiar a "final" al recibir GAME\_OVER', () => { 
        const action = { 
            type: 'GAME\_OVER' as const, 
            payload: { 
                totalScore: 2400, 
                finalRank: 1, 
                totalPlayers: 10 
            } 
        }; 
        const state = participantReducer(initialParticipantState, action); 
        
        expect(state.status).toBe('final'); 
        expect(state.finalResult?.finalRank).toBe(1); 
    }); 
    
    it('debe reiniciar el estado al ejecutar RESET\_GAME', () => { 
        const stateModificado: ParticipantState = { 
            status: 'resultado', 
            pin: '999999', 
            nickname: 'Pablo', 
            currentQuestion: null, 
            selectedOptionId: 'opt-1', 
            lastRoundResult: { 
                isCorrect: true, 
                scoreGained: 500, 
                totalScore: 500, 
                rank: 1 
            }, 
            finalResult: null, 
        }; 
        const state = participantReducer(stateModificado, { type: 'RESET\_GAME' }); 
        
        expect(state).toEqual(initialParticipantState); 
    }); 
});