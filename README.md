# 3D Chess Game with Hand Tracking

A modern 3D chess game that uses your camera to track hand movements, allowing you to play chess by hovering over and moving pieces with hand gestures.

![3D Chess Game](https://github.com/abrhamhabtu/3d-chess-game/assets/your-user-id/your-image-id.png)

## Features

- **3D Chess Board**: Beautiful 3D rendered chess board and pieces
- **Hand Tracking**: Play chess using hand gestures through your webcam
- **Legal Move Validation**: All chess rules are enforced
- **Visual Feedback**: Highlighting of legal moves and selected pieces
- **Game Controls**: Undo moves, reset game, and toggle sound
- **Camera Controls**: Rotate, pan, and zoom the 3D board

## Tech Stack

- **Frontend**: React with TypeScript
- **3D Rendering**: Three.js
- **Hand Tracking**: MediaPipe Hands
- **Chess Logic**: chess.js
- **Styling**: Tailwind CSS
- **Build Tool**: Vite

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- A webcam
- Modern browser with WebGL support (Chrome, Firefox, Edge, Safari)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/abrhamhabtu/3d-chess-game.git
   cd 3d-chess-game
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

## How to Play

### Using Hand Gestures

1. Click the hand icon in the top-right corner to enable hand tracking
2. Position your hand in view of the camera
3. **Select a piece**: Hover your hand over a piece and pinch your thumb and index finger together
4. **Move a piece**: While keeping the pinch, move your hand to the destination square
5. **Place a piece**: Release the pinch to place the piece on the current square
6. Only legal chess moves are allowed

### Using Mouse Controls

1. **Select a piece**: Click on a chess piece of your color
2. **Move a piece**: Click on a valid destination square
3. **Rotate the board**: Left-click and drag
4. **Pan the board**: Right-click and drag
5. **Zoom**: Use the scroll wheel

### Game Controls

- **Hand Tracking**: Toggle hand tracking on/off
- **Sound**: Toggle sound effects on/off
- **Reset**: Reset the game to the starting position
- **Info**: View game information and controls

## Project Structure

```
3d-chess-game/
├── public/               # Static assets
│   └── sounds/           # Game sound effects
├── src/
│   ├── components/       # React components
│   │   ├── ChessGame.tsx         # Main game component
│   │   ├── Chessboard.tsx        # 3D chessboard renderer
│   │   ├── HandTracker.tsx       # Hand tracking component
│   │   ├── GameControls.tsx      # Game control UI
│   │   ├── GameInfo.tsx          # Game information display
│   │   └── GestureGuide.tsx      # Hand gesture guide
│   ├── context/          # React context
│   │   └── GameContext.tsx       # Chess game state management
│   ├── utils/            # Utility functions
│   │   └── chessPieceModels.ts   # 3D chess piece models
│   ├── App.tsx           # Main App component
│   └── main.tsx          # Entry point
├── package.json          # Dependencies and scripts
└── vite.config.ts        # Vite configuration
```

## Development

### Working with the Codebase

- **Chess Logic**: The game uses chess.js for move validation and game state
- **3D Rendering**: Three.js is used for rendering the 3D board and pieces
- **Hand Tracking**: MediaPipe Hands is used for hand tracking and gesture recognition

### Available Scripts

- `npm run dev`: Start the development server
- `npm run build`: Build for production
- `npm run preview`: Preview the production build locally
- `npm run lint`: Run ESLint to check code quality

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add some amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Three.js](https://threejs.org/) for 3D rendering
- [MediaPipe](https://mediapipe.dev/) for hand tracking
- [chess.js](https://github.com/jhlywa/chess.js) for chess logic
- [Tailwind CSS](https://tailwindcss.com/) for styling
