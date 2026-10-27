import React from 'react'; 
import './RoundResultScreen.css'; 

interface RoundResultProps { 
    isCorrect: boolean; 
    scoreGained: number; 
    totalScore: number; 
    rank?: number; 
} 

export const RoundResultScreen: React.FC<RoundResultProps> = ({
  isCorrect,
  scoreGained,
  totalScore,
  rank,
}) => {
  return (
    <div className={`result-container`}>
      <div className="result-card">
        <div className="result-icon">
          {isCorrect ? '🎉' : '❌'}
        </div>
        <h1 className="result-title">
          {isCorrect ? '¡Correcto!' : '¡Incorrecto!'}
        </h1>

        <div className="score-box">
          <span className="score-gained">
            {isCorrect ? `+${scoreGained} pts` : '+0 pts'}
          </span>
          <span className="score-total">Total: {totalScore} pts</span>
        </div>

        {rank && (
          <div className="rank-badge">
            Estás en el puesto #{rank}
          </div>
        )}
      </div>
    </div>
  );
};