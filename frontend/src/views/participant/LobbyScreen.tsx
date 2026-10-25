import React from 'react';
import { useParticipantStore } from '../../model/participant/useParticipantStore';
import styles from './LobbyScreen.module.css'; 

export const LobbyScreen: React.FC = () => { 
    const pin = useParticipantStore((state) => state.pin); 
    const nickname = useParticipantStore((state) => state.nickname); 
    
    return ( 
        <div className={styles.container}>

            <div className={styles.card}>

                <div className={styles.badge}>Sala #{pin}</div>

                <h2 className={styles.welcomeText}>
                    ¡Bienvenido, <br />
                    <span className={styles.nickname}>{nickname}</span>!
                </h2>

                <div className={styles.waitingAnimation}>
                    <div className={styles.spinner}></div>
                </div>

                <p className={styles.infoText}>
                    Esperando a que el anfitrión inicie la partida...
                </p>

            </div>

        </div>
    );
};