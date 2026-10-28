import React, { useState } from "react";
import { COLOR_PALETTES, type ColorTheme } from "./themes"; 

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => { 
    // Selecciona un tema al azar UNA sola vez al cargar la app/pantalla 
    const [theme] = useState<ColorTheme>(() => {
        const randomIndex = Math.floor(Math.random() * COLOR_PALETTES.length);
        return COLOR_PALETTES[randomIndex];
    });

    return (
        <div 
            style={{ 
                "--primary-color": theme.primary,
                "--secondary-color": theme.secondary,
            } as React.CSSProperties}
        >{children}</div>
    );
}; 