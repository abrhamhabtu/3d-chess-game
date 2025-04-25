import React from 'react';
import { Check as Chess } from 'lucide-react';

interface WelcomeScreenProps {
  onStart: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart }) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex flex-col items-center justify-center px-4 text-white">
      <Chess size={80} className="text-blue-500 mb-6" />
      <h1 className="text-4xl md:text-5xl font-bold mb-2">3D Chess</h1>
      <p className="text-xl text-blue-400 mb-8">with Hand Gesture Controls</p>
      
      <div className="max-w-md text-center mb-8">
        <p className="mb-4 text-slate-300">
          Play chess in an immersive 3D environment with hand gesture controls. 
          Use your camera to move pieces naturally with pinch gestures.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-left mb-8">
          <div className="bg-slate-800/70 p-3 rounded-lg">
            <h3 className="font-semibold mb-2 text-blue-400">Hand Controls</h3>
            <ul className="text-slate-300 space-y-1">
              <li>• Pinch gesture to grab pieces</li>
              <li>• Move your hand to position</li>
              <li>• Release pinch to place</li>
            </ul>
          </div>
          <div className="bg-slate-800/70 p-3 rounded-lg">
            <h3 className="font-semibold mb-2 text-blue-400">Mouse Controls</h3>
            <ul className="text-slate-300 space-y-1">
              <li>• Click to select/move pieces</li>
              <li>• Drag to rotate the board</li>
              <li>• Scroll to zoom in/out</li>
            </ul>
          </div>
        </div>
      </div>
      
      <button 
        onClick={onStart}
        className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-lg text-xl font-medium transition-colors duration-200 shadow-lg"
      >
        Start Game
      </button>
      
      <p className="mt-8 text-slate-400 text-sm">
        Note: Camera access is required for hand tracking features
      </p>
    </div>
  );
};

export default WelcomeScreen;