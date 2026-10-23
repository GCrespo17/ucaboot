export type ParticipantStatus = 
    | 'esperando' // En el lobby tras ingresar PIN y apodo 
    | 'pregunta' // Pregunta activa en la pantalla del móvil 
    | 'respondí' // Respuesta enviada, esperando que cierre el tiempo 
    | 'resultado' // Resultado de la ronda (puntos y posición) 
    | 'final'; // Pantalla final con posición y resumen de partida 

    export interface QuestionData { 
        questionIndex: number; 
        totalQuestions: number; 
        timeLimit: number; 
        closesAt: number; // Timestamp UTC límite 
    } 
    
    export interface RoundResult { 
        isCorrect: boolean; 
        scoreGained: number; 
        totalScore: number; 
        rank: number; 
    } 
    
    export interface FinalResult { 
        totalScore: number; 
        finalRank: number; 
        totalPlayers: number; 
    } 
    
    export interface ParticipantState { 
        status: ParticipantStatus; 
        pin: string | null; 
        nickname: string | null; 
        currentQuestion: QuestionData | null; 
        selectedOptionId: string | null; 
        lastRoundResult: RoundResult | null; 
        finalResult: FinalResult | null; 
    } 
    
    export const initialParticipantState: ParticipantState = { 
        status: 'esperando', 
        pin: null, 
        nickname: null, 
        currentQuestion: null, 
        selectedOptionId: null, 
        lastRoundResult: null, 
        finalResult: null, 
    };
    
    export type ParticipantAction = 
        | { type: 'JOIN\_ROOM'; payload: { pin: string; nickname: string } } 
        | { type: 'QUESTION\_OPEN'; payload: QuestionData } 
        | { type: 'SUBMIT\_ANSWER'; payload: { optionId: string } } 
        | { type: 'ROUND\_RESULT'; payload: RoundResult } 
        | { type: 'GAME\_OVER'; payload: FinalResult } 
        | { type: 'RESET\_GAME' 
    }; 
    
    export function participantReducer( 
        state: ParticipantState, 
        action: ParticipantAction 
    ): ParticipantState { 
        switch (action.type) { 

            case 'JOIN\_ROOM': 
                return { 
                    ...state, 
                    status: 'esperando', 
                    pin: action.payload.pin, 
                    nickname: action.payload.nickname, 
                }; 

            case 'QUESTION\_OPEN': 
                return { 
                    ...state, 
                    status: 'pregunta', 
                    currentQuestion: action.payload, 
                    selectedOptionId: null, 
                };
                
            case 'SUBMIT\_ANSWER': 
                if (state.status !== 'pregunta') return state; 
                return { 
                    ...state,
                    status: 'respondí', 
                    selectedOptionId: action.payload.optionId, 
                }; 
            
            case 'ROUND\_RESULT': 
                return { 
                    ...state, 
                    status: 'resultado', 
                    lastRoundResult: action.payload, 
                }; 
                
            case 'GAME\_OVER': 
                return { 
                    ...state, 
                    status: 'final', 
                    finalResult: action.payload, 
                }; 
            
            case 'RESET\_GAME': 
                return initialParticipantState; 
            
            default: return state; 
        } 
    }