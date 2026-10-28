import React, {useEffect} from 'react';
import { useParticipantStore } from '../../model/participant/useParticipantStore'; 
import { socket, setupParticipantSocketListeners, emitSubmitAnswer } from '../../model/realtime/socket';

import { JoinScreen } from './JoinScreen'; 
import { LobbyScreen } from './LobbyScreen'; 
import { QuestionScreen } from './QuestionScreen'; 
import { SubmittedScreen } from './SubmittedScreen'; 
import { RoundResultScreen } from './RoundResultScreen'; 
import { GameOverScreen } from './GameOverScreen';

import { ThemeProvider } from "../../components/Themes/ThemeProvider";
import { BackgroundShapes } from '../../components/BackgroundShapes/BackgroundShapes';
import styles from './ParticipantContainer.module.css';

export const ParticipantContainer: React.FC = () => { 
    const { 
        status, 
        pin, 
        selectedOptionId, 
        lastRoundResult, 
        finalResult,
    } = useParticipantStore();

    useEffect(() => { 
      // Conectar socket y activar escuchas de eventos al montar la vista 
      if (!socket.connected) { 
        socket.connect(); 
      } 
      setupParticipantSocketListeners(); 
      
      // Exponer la instancia de Zustand en window solo durante desarrollo 
      if (import.meta.env.DEV) { 
        (window as unknown as { useParticipantStore: typeof useParticipantStore }).useParticipantStore = useParticipantStore; 
      } 
    }, []);

    const renderCurrentView = () => { 
    // 1. Unirse (sin pin)
    if (status === 'esperando' && !pin) { 
        return<JoinScreen />;
    }
    
    // 2. Espera en Lobby (con pin)
    if (status === 'esperando' && pin) {
      return <LobbyScreen />;
    }

    // 3. Responder pregunta
    if (status === 'pregunta') {
      return (
        <QuestionScreen
          onSelectOption={(optionId) => emitSubmitAnswer(optionId)}
        />
      );
    }

    // 4. Respuesta registrada
    if (status === 'respondí') {
      return <SubmittedScreen selectedOption={selectedOptionId || undefined} />;
    }

    // 5. Resultado de la ronda
    if (status === 'resultado' && lastRoundResult) {
      return (
        <RoundResultScreen
          isCorrect={lastRoundResult.isCorrect}
          scoreGained={lastRoundResult.scoreGained}
          totalScore={lastRoundResult.totalScore}
          rank={lastRoundResult.rank}
        />
      );
    }

    // 6. Resumen final
    if (status === 'final' && finalResult) {
      return (
        <GameOverScreen
          finalRank={finalResult.finalRank}
          totalScore={finalResult.totalScore}
          onReset={() => useParticipantStore.getState().dispatch({ type: 'RESET_GAME' })}
        />
      );
    }

    return null;
  };

  return (
    <ThemeProvider>
      <div className={styles.root}>
        <BackgroundShapes>
          {renderCurrentView()}
        </BackgroundShapes>
      </div>
    </ThemeProvider>
  );
};