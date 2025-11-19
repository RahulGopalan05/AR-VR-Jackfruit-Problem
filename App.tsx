
import React, { useState, useCallback } from 'react';
import Scene from './components/Scene';
import Instructions from './components/Instructions';
import * as THREE from 'three';
import type { Triplet } from '@react-three/cannon';

const INITIAL_RUG_WIDTH = 4;
const INITIAL_RUG_HEIGHT = 6;
const RUG_SEGMENTS = 30;

export interface RugPieceData {
  id: string;
  geometry: THREE.BufferGeometry;
  initialImpulse?: {
    impulse: Triplet;
    position: Triplet;
  };
}

// Helper to create the initial rug geometry
const createInitialGeometry = (): THREE.BufferGeometry => {
  const geom = new THREE.PlaneGeometry(INITIAL_RUG_WIDTH, INITIAL_RUG_HEIGHT, RUG_SEGMENTS, RUG_SEGMENTS);
  geom.rotateX(-Math.PI / 2);
  return geom;
};

const createInitialPiece = (): RugPieceData => ({
  id: THREE.MathUtils.generateUUID(),
  geometry: createInitialGeometry(),
});


const App: React.FC = () => {
  const [pieces, setPieces] = useState<RugPieceData[]>([createInitialPiece()]);
  const [key, setKey] = useState(0); // Key to force re-mounting the scene and physics world
  const [isCutMode, setIsCutMode] = useState(false);

  const handleReset = useCallback(() => {
    setPieces([createInitialPiece()]);
    setIsCutMode(false); // Also reset cut mode
    setKey(prevKey => prevKey + 1); 
  }, []);

  const handleCut = useCallback((pieceIdToReplace: string, newPieces: RugPieceData[]) => {
    setPieces(currentPieces => [
      ...currentPieces.filter(p => p.id !== pieceIdToReplace),
      ...newPieces,
    ]);
    setIsCutMode(false); // Exit cut mode after a successful cut
  }, []);

  return (
    <div className="w-screen h-screen bg-gray-900 text-white flex flex-col">
      <header className="p-4 bg-gray-800/50 backdrop-blur-sm z-10 flex justify-between items-center shadow-lg">
        <h1 className="text-xl md:text-2xl font-bold text-cyan-400">Interactive Mesh Cutter</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsCutMode(prev => !prev)}
            className={`px-4 py-2 rounded-md font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 ${
              isCutMode 
                ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' 
                : 'bg-cyan-600 hover:bg-cyan-700 focus:ring-cyan-500'
            }`}
          >
            {isCutMode ? 'Cancel Cut' : 'Enter Cut Mode'}
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-md font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Reset
          </button>
        </div>
      </header>
      <main className="flex-grow relative">
        <Scene key={key} pieces={pieces} onCut={handleCut} isCutMode={isCutMode} />
        <Instructions />
      </main>
    </div>
  );
};

export default App;
