import React, { createContext, useContext, useState, useEffect } from 'react';
import { Howl } from 'howler';

interface SoundContextType {
  isSoundEnabled: boolean;
  toggleSound: () => void;
  playSound: (soundName: string) => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

// Placeholder sound files - in a real app, you'd have actual audio files
const sounds = {
  cardPlay: new Howl({ src: [''], volume: 0.5 }), // TODO: Add actual sound files
  cardDraw: new Howl({ src: [''], volume: 0.5 }),
  gameWin: new Howl({ src: [''], volume: 0.7 }),
  gameStart: new Howl({ src: [''], volume: 0.6 }),
  buttonClick: new Howl({ src: [''], volume: 0.3 }),
};

export const SoundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSoundEnabled, setIsSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('unoSoundEnabled');
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem('unoSoundEnabled', JSON.stringify(isSoundEnabled));
  }, [isSoundEnabled]);

  const toggleSound = () => {
    setIsSoundEnabled(!isSoundEnabled);
  };

  const playSound = (soundName: string) => {
    if (isSoundEnabled && sounds[soundName as keyof typeof sounds]) {
      try {
        sounds[soundName as keyof typeof sounds].play();
      } catch (error) {
        console.warn('Could not play sound:', soundName, error);
      }
    }
  };

  return (
    <SoundContext.Provider value={{ isSoundEnabled, toggleSound, playSound }}>
      {children}
    </SoundContext.Provider>
  );
};

export const useSound = () => {
  const context = useContext(SoundContext);
  if (!context) {
    throw new Error('useSound must be used within a SoundProvider');
  }
  return context;
};
