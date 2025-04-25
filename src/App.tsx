import React, { useState } from 'react';
import ChessGame from './components/ChessGame';
import WelcomeScreen from './components/WelcomeScreen';
import { GameProvider } from './context/GameContext';

function App() {
  const [isGameStarted, setIsGameStarted] = useState(false);
  
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <GameProvider>
        {!isGameStarted ? (
          <WelcomeScreen onStart={() => setIsGameStarted(true)} />
        ) : (
          <ChessGame />
        )}
      </GameProvider>
    </div>
  );
}

export default App;