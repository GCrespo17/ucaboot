import React from 'react'; 
import './SubmittedScreen.css'; 

interface SubmittedScreenProps { 
    selectedOption?: string; 
} 

const optionStyles: Record<string, { label: string; shapeClass: string }> = {
    'A': { label: '▲', shapeClass: 'badge-triangle' },
    'B': { label: '◆', shapeClass: 'badge-hexagon' },
    'C': { label: '●', shapeClass: 'badge-circle' },
    'D': { label: '■', shapeClass: 'badge-square' },
};

export const SubmittedScreen: React.FC<SubmittedScreenProps> = ({ selectedOption }) => {
  
    const currentOptionStyle = selectedOption && optionStyles[selectedOption.toUpperCase()] 
    ? optionStyles[selectedOption.toUpperCase()] 
    : { label: selectedOption, shapeClass: 'badge-default' };
  
    return (
    <div className="submitted-container">
      <div className="submitted-card">
        <div className={`spinner option-${selectedOption?.toLowerCase()}`}></div>
        <h2>¡Respuesta Registrada!</h2>
        <p>Esperando a que termine el tiempo de los demás participantes...</p>
        
        {selectedOption && (
          <div className={`selected-badge ${currentOptionStyle.shapeClass} option-${selectedOption.toLowerCase()}`}>
            Opción seleccionada: <strong>{currentOptionStyle.label}</strong>
          </div>
        )}
      </div>
    </div>
  );
};