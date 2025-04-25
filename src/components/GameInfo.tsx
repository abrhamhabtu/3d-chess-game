import React from 'react';
import { useGameContext } from '../context/GameContext';

const GameInfo: React.FC = () => {
  const { moveHistory, chess } = useGameContext();
  
  // Prepare move history for display
  const formattedHistory = [];
  for (let i = 0; i < moveHistory.length; i += 2) {
    const moveNumber = Math.floor(i / 2) + 1;
    const whiteMove = moveHistory[i];
    const blackMove = i + 1 < moveHistory.length ? moveHistory[i + 1] : null;
    
    formattedHistory.push({
      moveNumber,
      white: whiteMove,
      black: blackMove
    });
  }
  
  const gameStatus = () => {
    if (chess.isCheckmate()) return "Checkmate";
    if (chess.isStalemate()) return "Stalemate";
    if (chess.isDraw()) return "Draw";
    if (chess.isCheck()) return "Check";
    return "In Progress";
  };
  
  return (
    <div className="bg-slate-800/80 rounded-lg p-3 text-white max-h-[40vh] w-64 overflow-hidden flex flex-col">
      <h2 className="text-lg font-semibold mb-2">Game Info</h2>
      <p className="text-sm mb-1">Status: <span className="font-medium">{gameStatus()}</span></p>
      <p className="text-sm mb-2">Turn: <span className={`font-medium ${chess.turn() === 'w' ? 'text-white' : 'text-gray-400'}`}>
        {chess.turn() === 'w' ? 'White' : 'Black'}
      </span></p>
      
      <h3 className="text-sm font-medium border-b border-slate-700 pb-1 mb-2">Move History</h3>
      <div className="overflow-y-auto flex-grow">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left">
              <th className="w-8 pr-1">#</th>
              <th className="w-1/2 px-1">White</th>
              <th className="w-1/2 pl-1">Black</th>
            </tr>
          </thead>
          <tbody>
            {formattedHistory.map(move => (
              <tr key={move.moveNumber} className="border-t border-slate-700/50">
                <td className="py-1 pr-1 text-slate-400">{move.moveNumber}.</td>
                <td className="py-1 px-1">{move.white}</td>
                <td className="py-1 pl-1">{move.black}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GameInfo;