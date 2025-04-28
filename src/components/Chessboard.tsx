import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Square } from 'chess.js';
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
  const moveSound = useRef<THREE.Audio | null>(null);
  const captureSound = useRef<THREE.Audio | null>(null);

  const { chess, makeMove, selectedSquare, setSelectedSquare, gameVersion } = useGameContext();
  const [isPieceGrabbed, setIsPieceGrabbed] = useState(false);
  const [lastValidDropTarget, setLastValidDropTarget] = useState<Square | null>(null);

  const getSquarePosition = useCallback((square: Square): { x: number; y: number; z: number } => {
    const fileIndex = square.charCodeAt(0) - 97; // 'a' -> 0, 'b' -> 1, ...
    const rankIndex = parseInt(square[1], 10) - 1; // '1' -> 0, '2' -> 1, ...
    const x = (fileIndex * SQUARE_SIZE) - BOARD_OFFSET;
    const z = BOARD_OFFSET - (rankIndex * SQUARE_SIZE);
    return { x, y: 0, z }; // y is usually 0 unless elevated
  }, []);

  const createChessboard = useCallback(() => {
    boardRef.current.clear(); // Clear previous board if any
    const geometry = new THREE.BoxGeometry(SQUARE_SIZE, 0.1, SQUARE_SIZE);
    for (let i = 0; i < BOARD_SIZE; i++) {
      for (let j = 0; j < BOARD_SIZE; j++) {
        const isWhite = (i + j) % 2 === 0;
        const material = new THREE.MeshStandardMaterial({ color: isWhite ? 0xffffff : 0x404040 });
        const squareMesh = new THREE.Mesh(geometry, material);
        const squareName = String.fromCharCode(97 + j) + (BOARD_SIZE - i) as Square;
        squareMesh.position.set(getSquarePosition(squareName).x, -0.05, getSquarePosition(squareName).z);
        squareMesh.userData = { type: 'square', square: squareName }; // Store square info
        boardRef.current.add(squareMesh);
      }
    }
  }, [getSquarePosition]);

  const updatePieces = useCallback(() => {
    console.log("Updating pieces on board...");
    // Clear existing pieces
    piecesRef.current.clear();
    
    // Get the current board state from chess.js
    const board = chess.board();
    
    // Create new 3D pieces based on the current board state
    board.forEach((row, rowIndex) => {
      row.forEach((piece, colIndex) => {
        if (piece) {
          const square = String.fromCharCode(97 + colIndex) + (8 - rowIndex) as Square;
          console.log(`Creating 3D piece for ${piece.type} at ${square}`);
          
          // Create the 3D piece mesh
          const pieceMesh = createChessPiece(piece.type, piece.color);
          const pos = getSquarePosition(square);
          pieceMesh.position.set(pos.x, 0, pos.z);
          
          // Store important metadata with the 3D object
          pieceMesh.userData = { 
            type: 'piece', 
            square: square, 
            pieceType: piece.type, 
            color: piece.color 
          };
          
          // Add to the pieces group
          piecesRef.current.add(pieceMesh);
        }
      });
    });
    
    // Log the total number of pieces created
    console.log(`Total 3D pieces created: ${piecesRef.current.children.length}`);
  }, [chess, getSquarePosition]);

  const updateHighlights = useCallback(() => {
    highlightsRef.current.clear(); // Clear previous highlights

    if (selectedSquare) {
      // Highlight selected square
      const selectedPos = getSquarePosition(selectedSquare);
      const selectedGeometry = new THREE.BoxGeometry(SQUARE_SIZE, 0.02, SQUARE_SIZE);
      const selectedMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.4 });
      const selectedHighlight = new THREE.Mesh(selectedGeometry, selectedMaterial);
      selectedHighlight.position.set(selectedPos.x, 0.05, selectedPos.z);
      highlightsRef.current.add(selectedHighlight);

      // Highlight legal moves
      const moves = chess.moves({ square: selectedSquare, verbose: true });
      moves.forEach(move => {
        const pos = getSquarePosition(move.to);
        const moveGeometry = new THREE.RingGeometry(SQUARE_SIZE * 0.2, SQUARE_SIZE * 0.3, 32);
        const moveMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide, transparent: true, opacity: 0.6 });
        const moveHighlight = new THREE.Mesh(moveGeometry, moveMaterial);
        moveHighlight.position.set(pos.x, 0.06, pos.z);
        moveHighlight.rotation.x = -Math.PI / 2; // Rotate to lay flat
        highlightsRef.current.add(moveHighlight);
      });
    }
  }, [selectedSquare, chess, getSquarePosition]);

  const clearHoverHighlight = useCallback(() => {
    if (hoverHighlightRef.current) {
      hoverHighlightRef.current.visible = false;
    }
    // Ensure all non-selected, non-grabbed pieces are grounded
    if (!selectedSquare && !isPieceGrabbed) {
      piecesRef.current.children.forEach((p: THREE.Object3D) => { p.position.y = 0 });
    }
  }, [selectedSquare, isPieceGrabbed]);

  const updateHoverHighlight = useCallback((square: Square | null) => {
    if (!square) {
      clearHoverHighlight();
      return;
    }

    if (!hoverHighlightRef.current) {
      const geometry = new THREE.BoxGeometry(SQUARE_SIZE, 0.02, SQUARE_SIZE);
      const material = new THREE.MeshBasicMaterial({
        color: 0x3b82f6, // Default blue
        transparent: true,
        opacity: 0.3
      });
      hoverHighlightRef.current = new THREE.Mesh(geometry, material);
      highlightsRef.current.add(hoverHighlightRef.current);
    }

    const pos = getSquarePosition(square);
    hoverHighlightRef.current.position.set(pos.x, 0.05, pos.z);
    hoverHighlightRef.current.visible = true;

    const material = hoverHighlightRef.current.material as THREE.MeshBasicMaterial;
    const piece = chess.get(square);
    const isMyPiece = piece && piece.color === chess.turn();
    const isLegalTargetForSelected = selectedSquare && chess.moves({ square: selectedSquare, verbose: true }).some(m => m.to === square);
    const isLegalTargetForGrabbed = isPieceGrabbed && selectedSquare && chess.moves({ square: selectedSquare, verbose: true }).some(m => m.to === square);

    let hoverColor = 0x3b82f6; // Blue (default/empty square)
    let hoverOpacity = 0.3;

    if (isPieceGrabbed) {
      hoverColor = isLegalTargetForGrabbed ? 0x22c55e : 0xef4444; // Green for legal, Red for illegal drop
      hoverOpacity = isLegalTargetForGrabbed ? 0.5 : 0.3;
    } else if (selectedSquare) {
      if (square === selectedSquare) {
        hoverColor = 0xfacc15; // Yellow for selected piece itself (override standard highlight)
        hoverOpacity = 0.5;
      } else if (isLegalTargetForSelected) {
        hoverColor = 0x22c55e; // Green for legal move target
        hoverOpacity = 0.4;
      }
    } else if (isMyPiece) {
      hoverColor = 0x60a5fa; // Lighter blue for hover over own piece (selectable)
      hoverOpacity = 0.4;
    }

    material.color.setHex(hoverColor);
    material.opacity = hoverOpacity;

    // Handle piece elevation on hover (only if not selected/grabbed)
    if (!selectedSquare && !isPieceGrabbed) {
      piecesRef.current.children.forEach((pieceObj: THREE.Object3D) => {
        if (pieceObj.userData.square === square && isMyPiece) {
          pieceObj.position.y = 0.1; // Slight elevation on hover
        } else {
          pieceObj.position.y = 0;
        }
      });
    }

  }, [clearHoverHighlight, getSquarePosition, chess, selectedSquare, isPieceGrabbed]);

  const calculateSquareFromHandPosition = useCallback((x: number, y: number): Square => {
    // Normalize x and y (assuming they are 0-1 range from HandTracker)
    // Calculate file (a-h) and rank (1-8)
    const fileIndex = Math.min(Math.max(Math.floor(x * BOARD_SIZE), 0), BOARD_SIZE - 1);
    const rankIndex = Math.min(Math.max(Math.floor((1 - y) * BOARD_SIZE), 0), BOARD_SIZE - 1); // Invert y

    const file = String.fromCharCode(97 + fileIndex);
    const rank = rankIndex + 1;
    return `${file}${rank}` as Square;
  }, []);

  useEffect(() => {
    // Initial setup
    const audioLoader = new THREE.AudioLoader();
    const listener = new THREE.AudioListener();
    camera.add(listener);

    audioLoader.load('/sounds/move.mp3', (buffer) => {
      if (moveSound.current) {
        moveSound.current.setBuffer(buffer);
        moveSound.current.setLoop(false);
        moveSound.current.setVolume(0.5);
      }
    });
    audioLoader.load('/sounds/capture.mp3', (buffer) => {
      if (captureSound.current) {
        captureSound.current.setBuffer(buffer);
        captureSound.current.setLoop(false);
        captureSound.current.setVolume(0.5);
      }
    });

    moveSound.current = new THREE.Audio(listener);
    captureSound.current = new THREE.Audio(listener);

    scene.add(boardRef.current);
    scene.add(piecesRef.current);
    scene.add(highlightsRef.current);

    createChessboard(); // Call memoized version
    updatePieces();

    // Store current ref values for cleanup
    const currentBoardGroup = boardRef.current;
    const currentPiecesGroup = piecesRef.current;
    const currentHighlightsGroup = highlightsRef.current;

    // Cleanup function
    return () => {
      scene.remove(currentBoardGroup); // Use stored group refs
      scene.remove(currentPiecesGroup);
      scene.remove(currentHighlightsGroup);
      if (camera.children.includes(listener)) {
        camera.remove(listener); // Clean up listener
      }
    };
  }, [scene, camera, createChessboard, updatePieces]);

  useEffect(() => {
    console.log("Chessboard: Game version changed, updating pieces:", gameVersion);
    console.log("Current turn:", chess.turn()); // Log whose turn it is
    
    // Debug: Log all pieces on the board from chess.js
    console.log("Current board state from chess.js:");
    const board = chess.board();
    let whitePieces = 0;
    let blackPieces = 0;
    
    for (let i = 0; i < board.length; i++) {
      for (let j = 0; j < board[i].length; j++) {
        const piece = board[i][j];
        if (piece) {
          const square = String.fromCharCode(97 + j) + (8 - i) as Square;
          console.log(`Piece at ${square}: ${piece.type} (${piece.color})`);
          if (piece.color === 'w') whitePieces++;
          else blackPieces++;
        }
      }
    }
    console.log(`Total pieces on board: ${whitePieces} white, ${blackPieces} black`);
    
    // Clear and recreate all 3D pieces to ensure they match the logical board
    updatePieces();
    
    // Debug: Log all 3D piece objects after updating
    setTimeout(() => {
      console.log("3D Pieces after update:");
      let white3DPieces = 0;
      let black3DPieces = 0;
      
      piecesRef.current.children.forEach((pieceObj: THREE.Object3D) => {
        console.log(`3D Piece at ${pieceObj.userData.square}: ${pieceObj.userData.pieceType} (${pieceObj.userData.color})`);
        if (pieceObj.userData.color === 'w') white3DPieces++;
        else black3DPieces++;
      });
      
      console.log(`Total 3D pieces: ${white3DPieces} white, ${black3DPieces} black`);
      
      // Verify that 3D pieces match logical board
      if (white3DPieces !== whitePieces || black3DPieces !== blackPieces) {
        console.error("MISMATCH between chess.js board and 3D pieces!");
        console.error(`Board has ${whitePieces}w/${blackPieces}b but 3D has ${white3DPieces}w/${black3DPieces}b`);
      } else {
        console.log("✓ 3D pieces match chess.js board state");
      }
    }, 100); // Small delay to ensure pieces are updated
  }, [chess, updatePieces, gameVersion]);

  useEffect(() => {
    updateHighlights();
  }, [selectedSquare, updateHighlights]);

  useEffect(() => {
    if (!handPosition) {
      // Hand tracking lost
      if (isPieceGrabbed && selectedSquare && selectedPieceRef.current) {
        // If a piece was grabbed, snap it back to original square
        const pos = getSquarePosition(selectedSquare);
        selectedPieceRef.current.position.set(pos.x, 0, pos.z);
      }
      setIsPieceGrabbed(false);
      clearHoverHighlight();
      setLastValidDropTarget(null);
      return;
    }

    const hoveredSquare = calculateSquareFromHandPosition(handPosition.x, handPosition.y);
    updateHoverHighlight(hoveredSquare); // Update hover based on hand

    // --- State Machine for Hand Interaction --- 
     // --- State 0: No piece grabbed - Waiting for pinch-to-select --- 
    if (!isPieceGrabbed) {
      if (handPosition.isPinching && hoveredSquare) {
        // Get the piece from the chess.js board
        const piece = chess.get(hoveredSquare);
        console.log(`Pinch detected at ${hoveredSquare}. Piece:`, piece, `Current turn: ${chess.turn()}`);
        
        // Force a refresh of the 3D pieces to ensure they match the chess.js board
        // This is a safety measure to ensure 3D objects are in sync with the logical board
        if (gameVersion > 0 && piecesRef.current.children.length > 0) {
          // Only log this when we're past the initial setup
          console.log(`Checking 3D piece objects for ${hoveredSquare}...`);
          
          // Log all 3D pieces for debugging
          piecesRef.current.children.forEach((p: THREE.Object3D) => {
            console.log(`Available 3D piece: ${p.userData.square} - ${p.userData.pieceType} (${p.userData.color})`);
          });
        }
        
        // Check if pinch is over a piece belonging to the current player
        if (piece && piece.color === chess.turn()) {
          console.log(`[Grab Attempt] Pinching over valid piece ${piece.type} at ${hoveredSquare}. Grabbing.`);
          setSelectedSquare(hoveredSquare); // Select the piece
          setIsPieceGrabbed(true);          // Set grabbed state
          setLastValidDropTarget(null);     // Reset last valid target

          // Find the 3D object for the selected piece - search by square
          const foundPiece = piecesRef.current.children.find(
            (p: THREE.Object3D) => p.userData.square === hoveredSquare
          );
          
          if (foundPiece) {
            console.log(`Found 3D object for ${hoveredSquare}:`, foundPiece.userData);
            selectedPieceRef.current = foundPiece;
          } else {
            console.error(`[Grab Error] Could not find 3D object for ${hoveredSquare} in piecesRef children:`, 
              piecesRef.current.children.map(p => `${p.userData.square}: ${p.userData.pieceType}`));
            
            // If we can't find the piece by square, try to recreate it
            console.log(`Attempting to recreate 3D piece for ${hoveredSquare}...`);
            updatePieces(); // Force update all pieces
            
            // Try to find the piece again after updating
            setTimeout(() => {
              const retryFoundPiece = piecesRef.current.children.find(
                (p: THREE.Object3D) => p.userData.square === hoveredSquare
              );
              
              if (retryFoundPiece) {
                console.log(`Successfully found 3D piece after update: ${hoveredSquare}`);
                selectedPieceRef.current = retryFoundPiece;
                selectedPieceRef.current.position.y = 0.5; // Elevate the piece
              } else {
                console.error(`Still could not find 3D piece after update: ${hoveredSquare}`);
                selectedPieceRef.current = null;
              }
            }, 50);
          }

          if (selectedPieceRef.current) {
            selectedPieceRef.current.position.y = 0.5; // Elevate grabbed piece
            if (camera.userData.controls) camera.userData.controls.enabled = false; // Disable camera controls
            console.log(`[Grab Success] Piece at ${hoveredSquare} selected and grabbed.`);
          } else {
            console.error(`[Grab Error] Could not find 3D object for ${hoveredSquare} after pinch.`);
            // Reset state if piece object not found
            setSelectedSquare(null);
            setIsPieceGrabbed(false);
          }
        } else {
          if (piece) {
            console.log(`[Grab Ignore] Pinch over opponent piece ${piece.type} at ${hoveredSquare}. Current turn: ${chess.turn()}, Piece color: ${piece.color}`);
          } else {
            console.log(`[Grab Ignore] Pinch over empty square (${hoveredSquare}).`);
          }
          // Pinch started over invalid square, do nothing
        }
      } else {
        // Not pinching or no hovered square - ensure pieces are grounded
        piecesRef.current.children.forEach((pieceObj: THREE.Object3D) => {
          // Ground all pieces if nothing is grabbed
          pieceObj.position.y = 0;
        });
      }
    }

    // --- State 1: Piece is grabbed by hand, moving/dropping --- 
    else if (selectedSquare && isPieceGrabbed && selectedPieceRef.current) {
      if (handPosition.isPinching) {
        // --- Pinch Held Logic --- 
        // Piece follows hand while pinch is held
        const legalMoves = chess.moves({ square: selectedSquare, verbose: true });
        const isLegalTarget = legalMoves.some(move => move.to === hoveredSquare);
        const pos = getSquarePosition(hoveredSquare || selectedSquare); // Fallback to selected square if hover is null?
        const elevation = isLegalTarget ? 0.7 : 0.5;
        selectedPieceRef.current.position.set(pos.x, elevation, pos.z);

        // Store the hovered square if it's a valid target
        if (isLegalTarget && hoveredSquare) {
          setLastValidDropTarget(hoveredSquare);
        } else {
          // If hovering over invalid square while dragging, clear the stored target
          // Optional: Or keep the last known valid one? Let's clear for now.
          setLastValidDropTarget(null);
        }
        
        // No need to update hover highlight color here, updateHoverHighlight handles it
      } else {
        // --- Pinch Released Logic --- 
        console.log(`[Drop Attempt] Pinch released. State: selected=${selectedSquare}, grabbed=${isPieceGrabbed}, hovered=${hoveredSquare}, lastValid=${lastValidDropTarget}`); 
        if (camera.userData.controls) camera.userData.controls.enabled = true; // Re-enable camera controls

        if (!selectedSquare || !selectedPieceRef.current) {
          console.error("[Drop Error] Missing selectedSquare or selectedPieceRef on drop attempt.");
          setIsPieceGrabbed(false);
          clearHoverHighlight();
          setLastValidDropTarget(null); // Reset stored target
          return; // Exit early if state is inconsistent
        }

        // Use the stored lastValidDropTarget for the move attempt
        const targetSquare = lastValidDropTarget;

        const legalMoves = chess.moves({ square: selectedSquare, verbose: true });
        const isLegalMove = targetSquare && legalMoves.some(move => move.to === targetSquare);
        console.log(`[Drop Check] Using lastValidDropTarget. Is move ${selectedSquare} -> ${targetSquare} legal? ${isLegalMove}`);

        if (isLegalMove && targetSquare) { // Ensure targetSquare is not null
          console.log(`[Drop Action] Making move: ${selectedSquare} -> ${targetSquare}`);
          const moveResult = makeMove(selectedSquare, targetSquare); // Use targetSquare
          console.log(`[Drop Result] makeMove returned:`, moveResult); // Log result

          if (moveResult) { // Check if makeMove was successful (returned a move object)
            if (soundEnabled) {
              if (moveResult.captured) captureSound.current?.play();
              else moveSound.current?.play();
            }
            console.log(`[Drop Success] Move successful. Deselecting piece.`);
            setSelectedSquare(null); // Deselect after successful move
            selectedPieceRef.current = null; // Clear ref to the piece object
          } else {
            console.warn(`[Drop Failed] makeMove returned null/false for ${selectedSquare} -> ${targetSquare}. Snapping back.`);
            // Snap back to original square if makeMove failed unexpectedly (shouldn't happen if isLegalMove was true)
            const originalPos = getSquarePosition(selectedSquare);
            selectedPieceRef.current.position.set(originalPos.x, 0, originalPos.z);
          }
        } else {
          console.log(`[Drop Invalid] Invalid drop target (lastValid=${targetSquare}, currentHover=${hoveredSquare}). Snapping back ${selectedSquare}.`);
          // Snap back to original square if drop target is invalid
          const originalPos = getSquarePosition(selectedSquare);
          selectedPieceRef.current.position.set(originalPos.x, 0, originalPos.z);
        }
        console.log(`[Drop End] Setting isPieceGrabbed to false.`);
        setIsPieceGrabbed(false); // Reset grabbed state regardless of drop success
        setLastValidDropTarget(null); // Reset stored target
        clearHoverHighlight(); // Clear specific drop highlights
      }
    }

    // State 3: No piece selected or grabbed - standard hover behavior
    else {
      // Ground all pieces if no piece is selected or grabbed, handled by updateHoverHighlight
      if (camera.userData.controls && !camera.userData.controls.enabled) {
        camera.userData.controls.enabled = true; // Ensure controls re-enabled if hand lost mid-grab
      }
    }

  }, [handPosition, selectedSquare, isPieceGrabbed, chess, updateHoverHighlight, clearHoverHighlight, setSelectedSquare, makeMove, soundEnabled, camera, getSquarePosition, calculateSquareFromHandPosition, lastValidDropTarget]);

  return null; // This component doesn't render directly, it modifies the scene
};

export default Chessboard;