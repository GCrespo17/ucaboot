import React from "react";
import "./BackgroundShapes.css"; 

export const BackgroundShapes: React.FC<{ children?: React.ReactNode }> = ({ children }) => { 
    return ( 
        <div className="bg-animated-container">
            {/* Fondo animado */} 
            <ul className="bg-shapes">
                <li className="shape-triangle"></li> 
                <li className="shape-diamond"></li> 
                <li className="shape-circle"></li> 
                <li className="shape-square"></li> 
                <li className="shape-triangle"></li> 
                <li className="shape-diamond"></li> 
                <li className="shape-circle"></li> 
                <li className="shape-square"></li> 
                <li className="shape-triangle"></li> 
                <li className="shape-diamond"></li> 
            </ul>
            
            {/* Contenido de la vista sobre el fondo*/} 
            <div style={{position: "relative", zIndex: 1}}> 
                {children} 
            </div>
        </div> 
    );
};