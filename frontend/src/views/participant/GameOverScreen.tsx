import React from 'react'; 
import './GameOverScreen.css'; 

interface GameOverProps { 
    finalRank?: number; 
    totalScore: number; 
    onReset: () => void; 
} 

export const GameOverScreen: React.FC<GameOverProps> = ({
  finalRank = 1,
  totalScore,
  onReset,
}) => {
  const getMedal = (rank: number) => {
    if (rank === 1) return '1.er Lugar';
    if (rank === 2) return '2.do Lugar';
    if (rank === 3) return '3.er Lugar';
    return `Puesto #${rank}`;
  };

  return (
    <div className="gameover-container">
      <div className="gameover-card">
        <h1>¡Juego Finalizado!</h1>

        {finalRank <= 3 && (
            <div className="podium-container">
                <div 
                    className="podium-step second" 
                    style={{ backgroundColor: finalRank === 2 ? '#b4cae4' : '#e5e7eb' }}
                />
                <div 
                    className="podium-step first" 
                    style={{ backgroundColor: finalRank === 1 ? '#f4b42c' : '#e5e7eb' }}
                />
                <div 
                    className="podium-step third" 
                    style={{ backgroundColor: finalRank === 3 ? '#b45309' : '#e5e7eb' }}
                />
            </div>
        )}

        <div className="podium-badge">
            <strong style={{ 
                color: finalRank === 1 ? '#f4b42c' : 
                finalRank === 2 ? '#95afce' : 
                finalRank === 3 ? '#b45309' : 
                'var(--secondary-color)' 
                }}>
                    {getMedal(finalRank)}
            </strong>
        </div>

        <div className="final-score-box">
          <span>Puntaje Final</span>
          <strong>{totalScore} pts</strong>
        </div>

        <button className="btn-reset" onClick={onReset}>
          Volver al Inicio
        </button>
      </div>
    </div>
  );
};