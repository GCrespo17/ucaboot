export interface ColorTheme { 
    name: string; 
    primary: string; 
    secondary: string;
} 

export const COLOR_PALETTES: ColorTheme[] = [ 
    { 
        name: "Verde", 
        primary: "#657E47", 
        secondary: "#80A32F",
    }, 
    { 
        name: "Amarillo", 
        primary: "#e4870f", 
        secondary: "#F4B42C",
    }, 
    { 
        name: "Rojo", 
        primary: "#91090B", 
        secondary: "#E95953",
    }, 
    { 
        name: "Azulo", 
        primary: "#263c7e", 
        secondary: "#7087BB",
    }, 
];