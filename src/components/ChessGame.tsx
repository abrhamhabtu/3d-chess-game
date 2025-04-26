import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { useGameContext } from '../context/GameContext';
import Chessboard from './Chessboard';
import HandTracker from './HandTracker';
import GameControls from './GameControls';
import GameInfo from './GameInfo';
import GestureGuide from './GestureGuide';
import { Info, HandIcon as HandRaisedIcon, RotateCcw, Volume2, VolumeX } from 'lucide-react';

const ChessGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [renderer, setRenderer] = useState<THREE.WebGLRenderer | null>(null);
  const [camera, setCamera] = useState<THREE.PerspectiveCamera | null>(null);
  const [scene, setScene] = useState<THREE.Scene | null>(null);
  const [controls, setControls] = useState<OrbitControls | null>(null);
  const [showHandTracker, setShowHandTracker] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showInfo, setShowInfo] = useState(false);
  const [handPosition, setHandPosition] = useState<{ x: number; y: number; isPinching?: boolean } | null>(null);
  
  const { resetGame } = useGameContext();

  useEffect(() => {
    if (!canvasRef.current || renderer) return;

    const newRenderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });
    newRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    newRenderer.setSize(window.innerWidth, window.innerHeight);
    newRenderer.shadowMap.enabled = true;
    newRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    const newScene = new THREE.Scene();
    newScene.background = new THREE.Color(0x1e293b);
    
    const newCamera = new THREE.PerspectiveCamera(
      45, window.innerWidth / window.innerHeight, 0.1, 1000
    );
    newCamera.position.set(0, 12, 12);
    
    const newControls = new OrbitControls(newCamera, canvasRef.current);
    newControls.enableDamping = true;
    newControls.dampingFactor = 0.05;
    newControls.rotateSpeed = 1.0;
    newControls.panSpeed = 1.0;
    newControls.zoomSpeed = 1.0;
    newControls.minDistance = 5;
    newControls.maxDistance = 20;
    newControls.maxPolarAngle = Math.PI / 1.5;
    newControls.minPolarAngle = 0;
    newControls.enablePan = true;
    newControls.target.set(0, 0, 0);
    newControls.update();
    
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    newScene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.bias = -0.0001;
    newScene.add(directionalLight);

    setRenderer(newRenderer);
    setScene(newScene);
    setCamera(newCamera);
    setControls(newControls);

    const animate = () => {
      requestAnimationFrame(animate);
      newControls.update();
      newRenderer.render(newScene, newCamera);
    };
    animate();

    const handleResize = () => {
      if (!canvasRef.current || !newCamera || !newRenderer) return;
      
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      newCamera.aspect = width / height;
      newCamera.updateProjectionMatrix();
      newRenderer.setSize(width, height);
      newRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      newControls.dispose();
      newRenderer.dispose();
    };
  }, [renderer]);

  const toggleHandTracker = () => {
    setShowHandTracker(prev => !prev);
    if (!showHandTracker) {
      setHandPosition(null);
    }
  };

  const toggleSound = () => {
    setSoundEnabled(prev => !prev);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden" ref={containerRef}>
      <canvas ref={canvasRef} className="w-full h-full block touch-none" />
      
      {scene && camera && (
        <Chessboard 
          scene={scene} 
          camera={camera} 
          soundEnabled={soundEnabled}
          handPosition={handPosition}
        />
      )}
      
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10">
        <GameInfo />
        
        <div className="flex space-x-2">
          <button 
            onClick={() => setShowInfo(prev => !prev)}
            className="bg-slate-800/80 p-2 rounded-full hover:bg-slate-700/80 transition-colors"
            aria-label="Game Information"
          >
            <Info size={20} />
          </button>
          <button 
            onClick={toggleHandTracker}
            className={`p-2 rounded-full transition-colors ${showHandTracker ? 'bg-blue-600/80 hover:bg-blue-500/80' : 'bg-slate-800/80 hover:bg-slate-700/80'}`}
            aria-label="Toggle Hand Tracking"
          >
            <HandRaisedIcon size={20} />
          </button>
          <button 
            onClick={toggleSound}
            className="bg-slate-800/80 p-2 rounded-full hover:bg-slate-700/80 transition-colors"
            aria-label="Toggle Sound"
          >
            {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
          <button 
            onClick={resetGame}
            className="bg-slate-800/80 p-2 rounded-full hover:bg-slate-700/80 transition-colors"
            aria-label="Reset Game"
          >
            <RotateCcw size={20} />
          </button>
        </div>
      </div>
      
      <GameControls />
      
      {showHandTracker && (
        <>
          <div className="absolute bottom-4 right-4 w-64 h-48 md:w-80 md:h-60 bg-black/70 rounded-lg overflow-hidden">
            <HandTracker onHandMove={setHandPosition} />
          </div>
          <GestureGuide />
        </>
      )}
      
      {showInfo && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
          <div className="bg-slate-800 p-6 rounded-lg w-11/12 max-w-md">
            <h2 className="text-xl font-bold mb-4">How to Play</h2>
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Hand Gestures:</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Pinch your thumb and index finger to select a piece</li>
                <li>Move your hand to move the selected piece</li>
                <li>Release the pinch to place the piece</li>
              </ul>
            </div>
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Mouse Controls:</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Left-click and drag to rotate the board</li>
                <li>Right-click and drag to pan</li>
                <li>Scroll wheel to zoom in/out</li>
                <li>Click on pieces to select them</li>
              </ul>
            </div>
            <button 
              onClick={() => setShowInfo(false)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500 transition-colors"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChessGame;