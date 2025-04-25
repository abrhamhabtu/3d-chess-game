import React from 'react';
import { Hand, Move, Pointer } from 'lucide-react';

const GestureGuide: React.FC = () => {
  return (
    <div className="absolute left-4 top-1/2 -translate-y-1/2 bg-slate-800/90 p-4 rounded-lg text-white max-w-[240px] shadow-lg">
      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <Hand size={20} className="text-blue-400" />
        Gesture Guide
      </h3>
      
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="bg-slate-700/50 p-2 rounded">
            <Pointer size={20} className="text-blue-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Select Piece</p>
            <p className="text-xs text-slate-300">Pinch thumb and index finger together over a piece</p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <div className="bg-slate-700/50 p-2 rounded">
            <Move size={20} className="text-blue-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Move Piece</p>
            <p className="text-xs text-slate-300">Keep pinching and move your hand to the target square</p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <div className="bg-slate-700/50 p-2 rounded">
            <Hand size={20} className="text-blue-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Place Piece</p>
            <p className="text-xs text-slate-300">Release the pinch to drop the piece</p>
          </div>
        </div>
      </div>
      
      <div className="mt-4 pt-3 border-t border-slate-600/50">
        <p className="text-xs text-slate-400">
          Keep your hand within view of the camera and make deliberate pinching motions for best results
        </p>
      </div>
    </div>
  );
};

export default GestureGuide;