import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { PieceSymbol, Color, Square } from 'chess.js';
import { useGameContext } from '../context/GameContext';
import { createChessPiece } from '../utils/chessPieceModels';

interface ChessboardProps {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  soundEnabled: boolean;
  handPosition?: { x: number; y: number; isPinching?: boolean } | null;
}

const BOARD_SIZE = 8;
const SQUARE_SIZE = 1;
const BOARD_OFFSET = BOARD_SIZE * SQUARE_SIZE / 2 - SQUARE_SIZE / 2;

const Chessboard: React.FC<ChessboardProps> = ({ scene, camera, soundEnabled, handPosition }) => {
  const boardRef = useRef<THREE.Group>(new THREE.Group());
  const piecesRef = useRef<THREE.Group>(new THREE.Group());
  const highlightsRef = useRef<THREE.Group>(new THREE.Group());
  const hoverHighlightRef = useRef<THREE.Mesh | null>(null);
  const selectedPieceRef = useRef<THREE.Object3D | null>(null);
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());
  const moveSound = useRef<HTMLAudioElement | null>(null);
  const captureSound = useRef<HTMLAudioElement | null>(null);
  
  const { chess, makeMove, selectedSquare, setSelectedSquare } = useGameContext();
  const [hoveredSquare, setHoveredSquare] = useState<Square | null>(null);

  useEffect(() => {
    moveSound.current = new Audio('/sounds/move.mp3');
    captureSound.current = new Audio('/sounds/capture.mp3');
    
    scene.add(boardRef.current);
    scene.add(piecesRef.current);
    scene.add(highlightsRef.current);
    
    createChessboard();
    updatePieces();
    
    const canvas = camera.userData.controls?.domElement;
    if (canvas) {
      canvas.addEventListener('click', handleClick);
      
      return () => {
        canvas.removeEventListener('click', handleClick);
        scene.remove(boardRef.current);
        scene.remove(piecesRef.current);
        scene.remove(highlightsRef.current);
      };
    }
  }, [scene, camera]);

  useEffect(() => {
    updatePieces();
  }, [chess]);

  useEffect(() => {
    updateHighlights();
  }, [selectedSquare]);

  useEffect(() => {
    if (handPosition) {
      const square = calculateSquareFromHandPosition(handPosition.x, handPosition.y);
      updateHoverHighlight(square);
      setHoveredSquare(square);

      // If a piece is selected, update its position and show legal moves
      if (selectedSquare && selectedPieceRef.current) {
        // Get legal moves for the selected piece
        const legalMoves = chess.moves({ 
          square: selectedSquare, 
          verbose: true 
        });
        
        // Check if the hovered square is a legal move
        const isLegalTarget = legalMoves.some(move => move.to === square);
        
        // Update piece position - follow the hand position exactly
        const pos = getSquarePosition(square);
        
        // Always keep the piece elevated when selected
        // This makes it clear that the piece is selected
        const elevation = isLegalTarget ? 0.7 : 0.5;
        
        // This ensures the piece follows the hand position precisely
        selectedPieceRef.current.position.set(pos.x, elevation, pos.z);
        
        // Store the current target square in the piece's userData for easier access
        selectedPieceRef.current.userData.targetSquare = square;
        
        // Update the hover highlight color based on move legality
        if (hoverHighlightRef.current) {
          const material = hoverHighlightRef.current.material as THREE.MeshBasicMaterial;
          material.color.setHex(
            isLegalTarget ? 0x22c55e : 0xef4444
          );
          material.opacity = isLegalTarget ? 0.5 : 0.3;
        }
      } else {
        // Find the piece at the hovered square and elevate it if it's the current player's turn
        const piece = chess.get(square);
        if (piece && piece.color === chess.turn()) {
          piecesRef.current.children.forEach((pieceObj: THREE.Object3D) => {
            if (pieceObj.userData.square === square) {
              // Elevate the piece when hovering to show it's selectable
              pieceObj.position.y = 0.2;
              
              // Highlight this piece to show it's hoverable
              pieceObj.userData.isHovered = true;
            } else if (!selectedSquare) {
              pieceObj.position.y = 0; // Reset other pieces
              pieceObj.userData.isHovered = false;
            }
          });
        }
      }
    } else {
      clearHoverHighlight();
      setHoveredSquare(null);
      
      // Reset selected piece position if hand tracking is lost
      if (selectedPieceRef.current && selectedSquare) {
        const pos = getSquarePosition(selectedSquare);
        selectedPieceRef.current.position.set(pos.x, 0, pos.z);
      }
    }
  }, [handPosition, selectedSquare]);

  const calculateSquareFromHandPosition = (x: number, y: number): Square => {
    const file = String.fromCharCode(97 + Math.min(Math.max(Math.floor(x * 8), 0), 7));
    const rank = Math.min(Math.max(8 - Math.floor(y * 8), 1), 8);
    return `${file}${rank}` as Square;
  };

  const updateHoverHighlight = (square: Square) => {
    if (!hoverHighlightRef.current) {
      const geometry = new THREE.BoxGeometry(SQUARE_SIZE, 0.02, SQUARE_SIZE);
      const material = new THREE.MeshBasicMaterial({
        color: 0x3b82f6,
        transparent: true,
        opacity: 0.3
      });
      hoverHighlightRef.current = new THREE.Mesh(geometry, material);
      highlightsRef.current.add(hoverHighlightRef.current);
    }

    const piece = chess.get(square);
    const pos = getSquarePosition(square);
    
    hoverHighlightRef.current.position.set(pos.x, 0.05, pos.z);
    const material = hoverHighlightRef.current.material as THREE.MeshBasicMaterial;
    material.color.setHex(
      piece && piece.color === chess.turn() ? 0x22c55e : 0x3b82f6
    );
    hoverHighlightRef.current.visible = true;

    // Highlight hoverable pieces
    if (!selectedSquare) {
      // Find the piece at the current square
      let foundPiece = false;
      piecesRef.current.children.forEach((pieceObj: THREE.Object3D) => {
        if (pieceObj.userData.square === square) {
          const piece = chess.get(square);
          if (piece && piece.color === chess.turn()) {
            pieceObj.position.y = 0.2;
            foundPiece = true;
          }
        } else {
          pieceObj.position.y = 0;
        }
      });
      
      // Update selectedPieceRef if hovering over a valid piece
      if (foundPiece && !selectedSquare) {
        piecesRef.current.children.forEach((pieceObj: THREE.Object3D) => {
          if (pieceObj.userData.square === square) {
            selectedPieceRef.current = pieceObj;
          }
        });
      }
    }
  };

  const clearHoverHighlight = () => {
    if (hoverHighlightRef.current) {
      hoverHighlightRef.current.visible = false;
    }
    
    // Reset piece heights if no piece is selected
    if (!selectedSquare) {
      piecesRef.current.children.forEach(piece => {
        piece.position.y = 0;
      });
    }
  };

  const handleClick = (event: MouseEvent) => {
    const canvas = event.target as HTMLCanvasElement;
    const rect = canvas.getBoundingClientRect();
    mouse.current.x = ((event.clientX - rect.left) / canvas.clientWidth) * 2 - 1;
    mouse.current.y = -((event.clientY - rect.top) / canvas.clientHeight) * 2 + 1;
    
    raycaster.current.setFromCamera(mouse.current, camera);
    
    // Check for intersections with pieces first
    const pieceIntersects = raycaster.current.intersectObjects(piecesRef.current.children, true);
    if (pieceIntersects.length > 0) {
      const intersectedPiece = pieceIntersects[0].object.parent;
      if (intersectedPiece) {
        const square = intersectedPiece.userData.square as Square;
        const piece = chess.get(square);
        
        // If we already have a piece selected and click on another valid target square
        if (selectedSquare && selectedSquare !== square) {
          // Check if this is a valid move
          const legalMoves = chess.moves({ 
            square: selectedSquare, 
            verbose: true 
          });
          
          const isLegalMove = legalMoves.some(move => move.to === square);
          
          if (isLegalMove) {
            // Execute the move
            const moveResult = makeMove(selectedSquare, square);
            if (moveResult && soundEnabled) {
              if (moveResult.captured) {
                captureSound.current?.play();
              } else {
                moveSound.current?.play();
              }
            }
            selectedPieceRef.current = null;
            return;
          }
        }
        
        // Select a piece of the current player's color
        if (piece && piece.color === chess.turn()) {
          setSelectedSquare(square);
          selectedPieceRef.current = intersectedPiece;
          return;
        }
      }
    }
    
    // Check for intersections with the board
    const boardIntersects = raycaster.current.intersectObjects(boardRef.current.children);
    if (boardIntersects.length > 0) {
      const intersectedSquare = boardIntersects[0].object.userData.square as Square;
      
      if (selectedSquare) {
        // Check if this is a valid move
        const legalMoves = chess.moves({ 
          square: selectedSquare, 
          verbose: true 
        });
        
        const isLegalMove = legalMoves.some(move => move.to === intersectedSquare);
        
        if (isLegalMove) {
          // Execute the move if it's legal
          const moveResult = makeMove(selectedSquare, intersectedSquare);
          if (moveResult && soundEnabled) {
            if (moveResult.captured) {
              captureSound.current?.play();
            } else {
              moveSound.current?.play();
            }
          }
        } else {
          // Provide feedback for illegal moves
          console.log(`Illegal move attempted: ${selectedSquare} to ${intersectedSquare}`);
          // The piece will snap back to its original position
        }
        selectedPieceRef.current = null;
      } else {
        // Try to select a piece at this square
        const piece = chess.get(intersectedSquare);
        if (piece && piece.color === chess.turn()) {
          setSelectedSquare(intersectedSquare);
          
          // Find the piece object
          piecesRef.current.children.forEach((pieceObj: THREE.Object3D) => {
            if (pieceObj.userData.square === intersectedSquare) {
              selectedPieceRef.current = pieceObj;
            }
          });
        }
      }
    }
  };

  const createChessboard = () => {
    const board = boardRef.current;
    board.clear();
    
    for (let i = 0; i < BOARD_SIZE; i++) {
      for (let j = 0; j < BOARD_SIZE; j++) {
        const isWhite = (i + j) % 2 === 0;
        const color = isWhite ? 0xe2e8f0 : 0x475569;
        
        const geometry = new THREE.BoxGeometry(SQUARE_SIZE, 0.1, SQUARE_SIZE);
        const material = new THREE.MeshStandardMaterial({ 
          color, 
          roughness: 0.7,
          metalness: 0.1
        });
        
        const square = new THREE.Mesh(geometry, material);
        square.position.set(
          j * SQUARE_SIZE - BOARD_OFFSET,
          -0.05,
          i * SQUARE_SIZE - BOARD_OFFSET
        );
        square.receiveShadow = true;
        
        const file = String.fromCharCode(97 + j);
        const rank = 8 - i;
        const squareName = `${file}${rank}` as Square;
        square.userData.square = squareName;
        
        board.add(square);
      }
    }
    
    const borderSize = BOARD_SIZE * SQUARE_SIZE + 0.3;
    const borderGeometry = new THREE.BoxGeometry(borderSize, 0.12, borderSize);
    const borderMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x1e293b, 
      roughness: 0.8,
      metalness: 0.2 
    });
    
    const border = new THREE.Mesh(borderGeometry, borderMaterial);
    border.position.y = -0.11;
    border.receiveShadow = true;
    board.add(border);
  };

  const updatePieces = () => {
    piecesRef.current.clear();
    selectedPieceRef.current = null;
    
    for (let i = 0; i < BOARD_SIZE; i++) {
      for (let j = 0; j < BOARD_SIZE; j++) {
        const file = String.fromCharCode(97 + j);
        const rank = 8 - i;
        const square = `${file}${rank}` as Square;
        
        const piece = chess.get(square);
        if (piece) {
          const pieceObj = createChessPiece(piece.type as PieceSymbol, piece.color as Color);
          pieceObj.position.set(
            j * SQUARE_SIZE - BOARD_OFFSET,
            0,
            i * SQUARE_SIZE - BOARD_OFFSET
          );
          
          pieceObj.userData.square = square;
          pieceObj.userData.piece = piece;
          
          piecesRef.current.add(pieceObj);
        }
      }
    }
  };

  const updateHighlights = () => {
    highlightsRef.current.clear();
    
    if (!selectedSquare) return;
    
    // Highlight the selected square
    const squarePos = getSquarePosition(selectedSquare);
    const highlightGeometry = new THREE.BoxGeometry(SQUARE_SIZE, 0.02, SQUARE_SIZE);
    const highlightMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x3b82f6,
      transparent: true,
      opacity: 0.6
    });
    
    const highlight = new THREE.Mesh(highlightGeometry, highlightMaterial);
    highlight.position.set(squarePos.x, 0.05, squarePos.z);
    highlightsRef.current.add(highlight);
    
    // Get all legal moves for the selected piece
    const legalMoves = chess.moves({ 
      square: selectedSquare, 
      verbose: true 
    });
    
    // Create visual highlights for all legal moves
    legalMoves.forEach(move => {
      const movePos = getSquarePosition(move.to);
      const isCapture = !!move.captured;
      const isCheck = move.san.includes('+');
      const isCheckmate = move.san.includes('#');
      
      // Different colors for different types of moves
      let moveColor = 0x22c55e; // Default green for normal moves
      if (isCheckmate) {
        moveColor = 0xf59e0b; // Orange for checkmate
      } else if (isCheck) {
        moveColor = 0x8b5cf6; // Purple for check
      } else if (isCapture) {
        moveColor = 0xef4444; // Red for captures
      }
      
      const moveMaterial = new THREE.MeshBasicMaterial({ 
        color: moveColor,
        transparent: true,
        opacity: 0.5
      });
      
      const moveHighlight = new THREE.Mesh(highlightGeometry, moveMaterial);
      moveHighlight.position.set(movePos.x, 0.05, movePos.z);
      highlightsRef.current.add(moveHighlight);
      
      // Add a pulsing animation for important moves (check/checkmate)
      if (isCheck || isCheckmate) {
        const pulseAnimation = () => {
          if (!moveHighlight.parent) return; // Stop if removed from scene
          
          // Pulse the opacity
          const time = Date.now() * 0.001;
          const opacity = 0.3 + Math.sin(time * 4) * 0.2;
          (moveHighlight.material as THREE.MeshBasicMaterial).opacity = opacity;
          
          requestAnimationFrame(pulseAnimation);
        };
        
        pulseAnimation();
      }
    });

    if (hoverHighlightRef.current) {
      highlightsRef.current.add(hoverHighlightRef.current);
    }
  };

  const getSquarePosition = (square: Square) => {
    const file = square.charCodeAt(0) - 97;
    const rank = 8 - parseInt(square[1]);
    
    return {
      x: file * SQUARE_SIZE - BOARD_OFFSET,
      y: 0,
      z: rank * SQUARE_SIZE - BOARD_OFFSET
    };
  };

  return null;
};

export default Chessboard;