import React from 'react';
import { useParticipantStore } from '../../model/participant/useParticipantStore'; 

import { JoinScreen } from './JoinScreen'; 
import { LobbyScreen } from './LobbyScreen'; 
import { QuestionScreen } from './QuestionScreen'; 
import { SubmittedScreen } from './SubmittedScreen'; 
import { RoundResultScreen } from './RoundResultScreen'; 
import { GameOverScreen } from './GameOverScreen';

import { ThemeProvider } from "../../components/Themes/ThemeProvider";
import { BackgroundShapes } from '../../components/BackgroundShapes/BackgroundShapes';

export const ParticipantContainer: React.FC = () => { 
    const { 
        status, 
        pin, 
        selectedOptionId, 
        lastRoundResult, 
        finalResult, 
        dispatch,
    } = useParticipantStore();

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
          onSelectOption={(optionId) =>
            dispatch({ type: 'SUBMIT_ANSWER', payload: { optionId } })
          }
        />
      );
    }

    // 4. Respuesta registrada
    if (status === 'respondí') {
      return <SubmittedScreen selectedOption={selectedOptionId ?? undefined} />;
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
          onReset={() => dispatch({ type: 'RESET_GAME' })}
        />
      );
    }

    return null;
  };

  return (
    <ThemeProvider>
      <BackgroundShapes>
        {renderCurrentView()}
      </BackgroundShapes>
    </ThemeProvider>
  );
};