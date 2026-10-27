import React from 'react';
import './QuestionScreen.css'; 

interface QuestionScreenProps { 
    onSelectOption: (optionId: string) => void; 
} 

export const QuestionScreen: React.FC<QuestionScreenProps> = ({ onSelectOption }) => {
  const handleTap = (optionId: string) => {
    // Feedback háptico en móviles
    if (typeof window !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(50);
    }
    onSelectOption(optionId);
  };

  return (
    <div className="question-container">
      <div className="question-header">
        <span className="question-badge">¡Elige tu respuesta!</span>
      </div>

      <div className="options-grid">
        <button
          className="btn-option option-red"
          onClick={() => handleTap('A')}
        >
          <span className="shape triangle">▲</span>
        </button>

        <button
          className="btn-option option-blue"
          onClick={() => handleTap('B')}
        >
          <span className="shape diamond">◆</span>
        </button>

        <button
          className="btn-option option-yellow"
          onClick={() => handleTap('C')}
        >
          <span className="shape circle">●</span>
        </button>

        <button
          className="btn-option option-green"
          onClick={() => handleTap('D')}
        >
          <span className="shape square">■</span>
        </button>
      </div>
    </div>
  );
};