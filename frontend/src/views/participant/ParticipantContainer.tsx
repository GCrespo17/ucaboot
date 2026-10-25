import React from 'react';
import { useParticipantStore } from '../../model/participant/useParticipantStore'; 
import { JoinScreen } from './JoinScreen'; 
import { LobbyScreen } from './LobbyScreen'; 
import { ThemeProvider } from "../../components/Themes/ThemeProvider";
import { BackgroundShapes } from '../../components/BackgroundShapes/BackgroundShapes';

export const ParticipantContainer: React.FC = () => { 
    const status = useParticipantStore((state) => state.status); 
    const pin = useParticipantStore((state) => state.pin); 

    // 1. Si no ha ingresado PIN ni apodo, se muestra la pantalla de Join 
    if (status === 'esperando' && !pin) { 
        return (
            <ThemeProvider>
                <BackgroundShapes>
                    <JoinScreen />
                </BackgroundShapes>
            </ThemeProvider>
        );
    }

    // 2. Si ya ingresó PIN y está en estado de espera, se muestra el Lobby 
    if (status === 'esperando' && pin) { 
        return (
            <ThemeProvider>
                <BackgroundShapes>
                    <LobbyScreen />
                </BackgroundShapes>
            </ThemeProvider>
        );
    }

    return null;
};