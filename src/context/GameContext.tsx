import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Chess, Move, Square } from 'chess.js';

interface GameContextType {
  chess: Chess;
  selectedSquare: Square | null;
  setSelectedSquare: (square: Square | null) => void;
  makeMove: (from: Square, to: Square) => Move | null;
  undoMove: () => void;
  resetGame: () => void;
  moveHistory: string[];
  historyIndex: number;
  setHistoryIndex: (index: number) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

interface GameProviderProps {
  children: ReactNode;
}

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  const [chess] = useState<Chess>(new Chess());
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  
  // Reset the game
  const resetGame = useCallback(() => {
    chess.reset();
    setSelectedSquare(null);
    setMoveHistory([]);
    setHistoryIndex(0);
  }, [chess]);
  
  // Make a move
  const makeMove = useCallback((from: Square, to: Square): Move | null => {
    try {
      // Try the move
      const moveResult = chess.move({ from, to, promotion: 'q' });
      
      if (moveResult) {
        // If successful, update history
        const newHistory = moveHistory.slice(0, historyIndex);
        newHistory.push(moveResult.san);
        setMoveHistory(newHistory);
        setHistoryIndex(newHistory.length);
        setSelectedSquare(null);
        return moveResult;
      }
    } catch (e) {
      console.error('Invalid move:', e);
    }
    
    return null;
  }, [chess, moveHistory, historyIndex]);
  
  // Undo a move
  const undoMove = useCallback(() => {
    if (historyIndex > 0) {
      chess.undo();
      setHistoryIndex(historyIndex - 1);
      setSelectedSquare(null);
    }
  }, [chess, historyIndex]);
  
  // Set history index (for redo)
  const handleSetHistoryIndex = useCallback((index: number) => {
    if (index < 0 || index > moveHistory.length) return;
    
    // Reset chess and replay moves up to the new index
    chess.reset();
    
    for (let i = 0; i < index; i++) {
      const move = moveHistory[i];
      chess.move(move);
    }
    
    setHistoryIndex(index);
    setSelectedSquare(null);
  }, [chess, moveHistory]);
  
  const value = {
    chess,
    selectedSquare,
    setSelectedSquare,
    makeMove,
    undoMove,
    resetGame,
    moveHistory,
    historyIndex,
    setHistoryIndex: handleSetHistoryIndex
  };
  
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export const useGameContext = (): GameContextType => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGameContext must be used within a GameProvider');
  }
  return context;
};