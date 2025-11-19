
import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Physics } from '@react-three/cannon';
import RugPiece from './RugPiece';
import Floor from './Floor';
import type { RugPieceData } from '../App';

interface SceneProps {
  pieces: RugPieceData[];
  onCut: (pieceIdToReplace: string, newPieces: RugPieceData[]) => void;
  isCutMode: boolean;
}

const Scene: React.FC<SceneProps> = ({ pieces, onCut, isCutMode }) => {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 5, 8], fov: 50 }}
      className="w-full h-full"
    >
      <ambientLight intensity={0.6} />
      <directionalLight
        castShadow
        position={[10, 20, 15]}
        intensity={1.5}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      <Suspense fallback={null}>
        <Physics gravity={[0, -9.81, 0]}>
          <Floor />
          {pieces.map((piece) => (
            <RugPiece
              key={piece.id}
              pieceData={piece}
              onCut={onCut}
              isCutMode={isCutMode}
              totalPieces={pieces.length}
            />
          ))}
        </Physics>
      </Suspense>
      <OrbitControls enableRotate={!isCutMode} />
    </Canvas>
  );
};

export default Scene;
