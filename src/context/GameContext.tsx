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
  gameVersion: number;
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
  const [gameVersion, setGameVersion] = useState(0);

  // Reset the game
  const resetGame = useCallback(() => {
    chess.reset();
    setSelectedSquare(null);
    setMoveHistory([]);
    setHistoryIndex(0);
    setGameVersion(0);
  }, [chess]);

  // Make a move
  const makeMove = useCallback((from: Square, to: Square): Move | null => {
    try {
      // Try the move
      const moveResult = chess.move({ from, to, promotion: 'q' });

      if (moveResult) {
        // --- Update history for user's move --- 
        const userMoveSan = moveResult.san;
        const historyAfterUserMove = moveHistory.slice(0, historyIndex);
        historyAfterUserMove.push(userMoveSan);
        setMoveHistory(historyAfterUserMove);
        const newIndexAfterUser = historyAfterUserMove.length;
        setHistoryIndex(newIndexAfterUser);
        setSelectedSquare(null);

        // --- Trigger AI move if applicable --- 
        if (chess.turn() === 'b' && !chess.isGameOver() && !chess.isDraw()) {
          console.log("User move successful. Triggering AI move...");
          setTimeout(() => {
            const aiMoves = chess.moves({ verbose: true });
            if (aiMoves.length > 0) {
              const randomAIMove = aiMoves[Math.floor(Math.random() * aiMoves.length)];
              try {
                // Make AI move directly on the chess instance
                const aiMoveResult = chess.move(randomAIMove);

                if (aiMoveResult) {
                  console.log("AI moved:", aiMoveResult.san);
                  // Update history state *again* for AI move using functional updates
                  setMoveHistory(prevHistory => [...prevHistory.slice(0, newIndexAfterUser), aiMoveResult.san]);
                  setHistoryIndex(prevIndex => prevIndex + 1);
                  setGameVersion(prev => prev + 1); // Force update after AI move

                  // Check game status after AI move
                  if (chess.isCheckmate()) {
                    console.log("Game Over: Checkmate! AI wins.");
                    // Optionally add state for game over message
                  } else if (chess.isDraw()) {
                    console.log("Game Over: Draw!");
                    // Optionally add state for game over message
                  }

                } else {
                  console.error("AI failed to make chosen move:", randomAIMove);
                }
              } catch (aiError) {
                console.error("Error during AI move execution:", aiError);
              }
            } else {
              // Should not happen unless game already ended
              console.log("AI has no legal moves.");
            }
            // Force a state update to ensure UI reflects AI move? 
            // Updating historyIndex should suffice, but if not, add a dummy state toggle.
            // Example: setForceUpdate(prev => !prev);
          }, 500); // 500ms delay for AI 'thinking' time
        } else if (chess.isGameOver() || chess.isDraw()) {
          if(chess.isCheckmate()) {
            console.log("Game Over: Checkmate! You win!");
          } else if (chess.isStalemate()){
            console.log("Game Over: Stalemate!");
          } else if (chess.isThreefoldRepetition()) {
            console.log("Game Over: Draw by Threefold Repetition!");
          } else if (chess.isInsufficientMaterial()) {
            console.log("Game Over: Draw by Insufficient Material!");
          } else if (chess.isDraw()) {
            console.log("Game Over: Draw!");
          }
        }

        return moveResult;
      }
    } catch (e) {
      console.error('Invalid move:', e);
    }
    
    return null;
  }, [chess, moveHistory, historyIndex]);

  // Undo a move
  const undoMove = useCallback(() => {
    // Check if there's anything to undo
    if (historyIndex <= 0) return;

    const turnBeforeUndo = chess.turn(); // 'b' if user (white) last moved, 'w' if AI (black) last moved
    const moveUndone = chess.undo(); // Undo the last half-move

    if (moveUndone) {
      let newHistoryIndex = historyIndex - 1;

      // If it was white's turn before the undo (meaning white's move was just undone),
      // it implies the AI might have moved just before that. Undo again.
      if (turnBeforeUndo === 'b') {
        const aiMoveUndone = chess.undo();
        if (aiMoveUndone) {
          console.log("Undid AI move as well.");
          newHistoryIndex--; // Decrement index again for the AI move
        } else {
          // This case should ideally not happen if history is managed correctly
          console.warn("Attempted to undo AI move, but chess.undo() failed.");
        }
      }

      // Update state
      setHistoryIndex(newHistoryIndex);
      // Prune the move history array based on the new index
      setMoveHistory(prevHistory => prevHistory.slice(0, newHistoryIndex));
      setSelectedSquare(null);
      setGameVersion(prev => prev + 1); // Force update after undo
    } else {
      console.error("Undo failed: chess.undo() returned null.");
    }
  }, [chess, historyIndex]); // Dependency on historyIndex is important here

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
    setGameVersion(prev => prev + 1); // Force update after history jump
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
    setHistoryIndex: handleSetHistoryIndex,
    gameVersion,
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