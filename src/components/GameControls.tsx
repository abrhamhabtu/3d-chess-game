import React from 'react';
import { useGameContext } from '../context/GameContext';
import { RotateCw, RotateCcw } from 'lucide-react';

const GameControls: React.FC = () => {
  const { chess, undoMove, historyIndex, setHistoryIndex, moveHistory } = useGameContext();
  
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < moveHistory.length;
  
  return (
    <div className="absolute bottom-4 left-4 z-10">
      <div className="flex space-x-2">
        <button 
          onClick={undoMove}
          disabled={!canUndo}
          className={`bg-slate-800/80 p-2 rounded-lg transition-colors ${canUndo ? 'hover:bg-slate-700/80' : 'opacity-50 cursor-not-allowed'}`}
          aria-label="Undo Move"
        >
          <RotateCcw size={20} />
        </button>
        <button 
          onClick={() => setHistoryIndex(historyIndex + 1)}
          disabled={!canRedo}
          className={`bg-slate-800/80 p-2 rounded-lg transition-colors ${canRedo ? 'hover:bg-slate-700/80' : 'opacity-50 cursor-not-allowed'}`}
          aria-label="Redo Move"
        >
          <RotateCw size={20} />
        </button>
      </div>
      
      <div className="mt-2 text-sm text-white/80 bg-slate-800/80 p-2 rounded-lg">
        <p>Turn: {chess.turn() === 'w' ? 'White' : 'Black'}</p>
        <p>Move: {Math.floor(moveHistory.length / 2) + 1}</p>
        {chess.isCheck() && <p className="text-red-400 font-bold">Check!</p>}
        {chess.isCheckmate() && <p className="text-red-400 font-bold">Checkmate!</p>}
        {chess.isStalemate() && <p className="text-yellow-400 font-bold">Stalemate!</p>}
        {chess.isDraw() && <p className="text-yellow-400 font-bold">Draw!</p>}
      </div>
    </div>
  );
};

export default GameControls;