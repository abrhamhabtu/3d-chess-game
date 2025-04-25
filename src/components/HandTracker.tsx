import React, { useEffect, useRef, useState } from 'react';
import { Camera } from '@mediapipe/camera_utils';
import { Hands, Results } from '@mediapipe/hands';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { HAND_CONNECTIONS } from '@mediapipe/hands';
import { useGameContext } from '../context/GameContext';
import { Square, Move } from 'chess.js';

interface HandTrackerProps {
  onHandMove?: (position: { x: number; y: number } | null) => void;
}

const HandTracker: React.FC<HandTrackerProps> = ({ onHandMove }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handsRef = useRef<Hands | null>(null);
  const cameraRef = useRef<Camera | null>(null);
  const lastPinchTime = useRef<number>(0);
  const lastSquare = useRef<string | null>(null);
  const positionBuffer = useRef<{ x: number; y: number }[]>([]);
  const pinchStartPosition = useRef<{ x: number; y: number } | null>(null);
  const pinchStateRef = useRef<boolean>(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isTracking, setIsTracking] = useState(false);
  const [pinchDetected, setPinchDetected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { selectedSquare, setSelectedSquare, makeMove, chess } = useGameContext();

  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const hands = new Hands({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      }
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    hands.onResults(onResults);
    handsRef.current = hands;

    const camera = new Camera(videoRef.current, {
      onFrame: async () => {
        if (videoRef.current && handsRef.current) {
          try {
            await handsRef.current.send({ image: videoRef.current });
            setError(null);
          } catch (err) {
            console.error('Hand detection error:', err);
            setError('Hand detection failed. Please try again.');
          }
        }
      },
      width: 640,
      height: 480
    });

    camera.start()
      .then(() => {
        setIsLoading(false);
        setError(null);
      })
      .catch(err => {
        console.error('Camera error:', err);
        setError('Failed to start camera. Please check permissions and try again.');
        setIsLoading(false);
      });

    cameraRef.current = camera;

    return () => {
      camera.stop();
      hands.close();
    };
  }, []);

  const smoothPosition = (x: number, y: number) => {
    // Add current position to the buffer
    positionBuffer.current.push({ x, y });
    
    // Keep a buffer of the last 8 positions for smoother tracking
    if (positionBuffer.current.length > 8) {
      positionBuffer.current.shift();
    }

    // Calculate weighted average with more recent positions having higher weight
    let totalWeight = 0;
    const weightedAvg = positionBuffer.current.reduce((acc, pos, index) => {
      // Weight increases with index (more recent positions have higher weight)
      const weight = index + 1;
      totalWeight += weight;
      return { 
        x: acc.x + pos.x * weight, 
        y: acc.y + pos.y * weight 
      };
    }, { x: 0, y: 0 });

    return {
      x: weightedAvg.x / totalWeight,
      y: weightedAvg.y / totalWeight
    };
  };

  const onResults = (results: Results) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (results.image) {
      ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
    }

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      setIsTracking(true);
      const landmarks = results.multiHandLandmarks[0];

      drawConnectors(ctx, landmarks, HAND_CONNECTIONS, {
        color: '#3b82f6',
        lineWidth: 3
      });
      drawLandmarks(ctx, landmarks, {
        color: '#ffffff',
        lineWidth: 2,
        radius: 3
      });

      const thumbTip = landmarks[4];
      const indexTip = landmarks[8];
      const distance = Math.sqrt(
        Math.pow(thumbTip.x - indexTip.x, 2) +
        Math.pow(thumbTip.y - indexTip.y, 2) +
        Math.pow(thumbTip.z - indexTip.z, 2)
      );

      // Adjust the pinch threshold for better detection
      const isPinching = distance < 0.1; // Increased threshold for easier pinch detection
      const now = Date.now();
      
      // Use the index finger tip position for more precise hovering
      // Flip the y-coordinate (1 - y) because the camera's y-axis is inverted
      const smoothed = smoothPosition(indexTip.x, 1 - indexTip.y);
      
      // Send the hand position to the Chessboard component
      onHandMove?.(smoothed);

      // Reduce the cooldown time for more responsive interactions
      // Only process pinch state changes after a cooldown
      if (isPinching !== pinchStateRef.current && now - lastPinchTime.current > 200) {
        const square = calculateSquareFromPosition(smoothed.x, smoothed.y);

        if (isPinching && !pinchStateRef.current) {
          // Starting a pinch - only allow selecting pieces of the current player's color
          const piece = chess.get(square);
          if (piece && piece.color === chess.turn()) {
            setSelectedSquare(square);
            pinchStartPosition.current = smoothed;
            lastSquare.current = square;
            
            // Log the legal moves for this piece for debugging
            const legalMoves = chess.moves({ 
              square: square as Square, 
              verbose: true 
            }) as Move[];
            console.log(`Selected ${piece.color} ${piece.type} at ${square}. Legal moves:`, 
              legalMoves.map(m => m.to));
          }
        } else if (!isPinching && pinchStateRef.current && selectedSquare) {
          // Releasing a pinch - enforce legal chess moves
          const startSquare = lastSquare.current;
          const targetSquare = calculateSquareFromPosition(smoothed.x, smoothed.y);
          
          // Always attempt to make a move when releasing a pinch, even if it's the same square
          // This ensures the piece is placed at the current hand position
          
          // Get all legal moves for the selected piece
          const legalMoves = chess.moves({ 
            square: startSquare as Square, 
            verbose: true 
          }) as Move[];
          
          // Check if the target square is a legal move
          const isLegalMove = legalMoves.some(move => move.to === targetSquare);
          
          if (isLegalMove) {
            // Execute the move if it's legal
            console.log(`Making move from ${startSquare} to ${targetSquare}`);
            makeMove(startSquare as Square, targetSquare as Square);
          } else if (startSquare !== targetSquare) {
            // Only show error for different squares
            console.log(`Illegal move attempted: ${startSquare} to ${targetSquare}`);
            // Provide visual feedback for illegal moves
            // The piece will snap back to its original position
          }
          
          // Reset selection state
          setSelectedSquare(null);
          pinchStartPosition.current = null;
          lastSquare.current = null;
        }

        lastPinchTime.current = now;
        pinchStateRef.current = isPinching;
        setPinchDetected(isPinching);
      }

      // Visual feedback
      ctx.beginPath();
      ctx.arc(30, 30, 15, 0, 2 * Math.PI);
      ctx.fillStyle = isPinching ? '#22c55e' : '#ef4444';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(indexTip.x * canvas.width, indexTip.y * canvas.height, 8, 0, 2 * Math.PI);
      ctx.fillStyle = selectedSquare ? '#22c55e' : '#3b82f6';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else {
      setIsTracking(false);
      onHandMove?.(null);
      
      if (pinchDetected) {
        setPinchDetected(false);
        setSelectedSquare(null);
        pinchStartPosition.current = null;
        lastSquare.current = null;
        pinchStateRef.current = false;
      }
    }

    ctx.restore();
  };

  const calculateSquareFromPosition = (x: number, y: number) => {
    // Apply a small adjustment to improve the accuracy of square selection
    // This helps align the visual hand position with the chess board grid
    const adjustedX = Math.max(0, Math.min(0.999, x)); // Ensure x is between 0 and 0.999
    const adjustedY = Math.max(0, Math.min(0.999, y)); // Ensure y is between 0 and 0.999
    
    const boardX = Math.floor(adjustedX * 8);
    const boardY = Math.floor(adjustedY * 8);
    
    const file = String.fromCharCode(97 + boardX);
    const rank = 8 - boardY;
    return `${file}${rank}` as const;
  };

  return (
    <div className="relative w-full h-full">
      <video
        ref={videoRef}
        className="absolute opacity-0 pointer-events-none"
        width="640"
        height="480"
        autoPlay
        playsInline
      />
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        width="640"
        height="480"
      />
      
      {(isLoading || error) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70">
          <p className="text-white text-center px-4">
            {error || 'Initializing hand tracking...'}
          </p>
        </div>
      )}
      
      <div className="absolute bottom-2 left-2 bg-black/60 px-3 py-2 rounded text-sm flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${isTracking ? 'bg-green-500' : 'bg-red-500'}`} />
        <span className="text-white">
          {isTracking ? (
            <>
              Tracking active
              {pinchDetected && ' - Pinch detected'}
            </>
          ) : (
            error || (isLoading ? 'Initializing...' : 'No hands detected')
          )}
        </span>
      </div>
    </div>
  );
};

export default HandTracker;