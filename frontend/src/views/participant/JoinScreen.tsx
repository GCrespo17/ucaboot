import React, { useState } from 'react'; 
import { useParticipantStore } from '../../model/participant/useParticipantStore';
import  UcabootLogo  from "../../assets/Ucaboot.svg"; 
import styles from './JoinScreen.module.css';

export const JoinScreen: React.FC = () => { 
    const dispatch = useParticipantStore((state) => state.dispatch); 
    
    const [pin, setPin] = useState(''); 
    const [nickname, setNickname] = useState(''); 
    const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = pin.trim();
    const cleanNickname = nickname.trim();

    // Validación 1: El PIN debe tener exactamente 6 dígitos numéricos
    if (!/^\d{6}$/.test(cleanPin)) {
      setError('El PIN debe ser un número de 6 dígitos.');
      return;
    }

    // Validación 2: El apodo debe tener al menos 2 caracteres
    if (cleanNickname.length < 2) {
      setError('El apodo debe tener al menos 2 caracteres.');
      return;
    }

    setError(null);

    // Actualiza el store de Zustand con los datos ingresados
    dispatch({
      type: 'JOIN_ROOM',
      payload: { pin: cleanPin, nickname: cleanNickname },
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <img src={UcabootLogo} alt="Ucaboot" className={styles.logo} />
        <p className={styles.subtitle}>Unirse a la partida</p>

        {error && <div className={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>PIN de la Sala</label>
            <input
              type="text"
              maxLength={6}
              placeholder="Ej: 123456"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className={styles.input}
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Tu Apodo</label>
            <input
              type="text"
              maxLength={15}
              placeholder="Ej: Pablo"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className={styles.input}
            />
          </div>

          <button type="submit" className={styles.button}>
            ¡Ingresar!
          </button>
        </form>
      </div>
    </div>
  );
};