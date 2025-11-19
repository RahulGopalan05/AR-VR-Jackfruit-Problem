
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTrimesh } from '@react-three/cannon';
import type { Triplet } from '@react-three/cannon';
import * as THREE from 'three';
import { Line } from '@react-three/drei';
import { cutMesh } from '../services/meshCutter';
import type { RugPieceData } from '../App';

interface RugPieceProps {
  pieceData: RugPieceData;
  onCut: (pieceIdToReplace: string, newPieces: RugPieceData[]) => void;
  totalPieces: number;
  isCutMode: boolean;
}

const RugPiece: React.FC<RugPieceProps> = ({ pieceData, onCut, totalPieces, isCutMode }) => {
  const { geometry, id, initialImpulse } = pieceData;
  const [isCutting, setIsCutting] = useState(false);
  const [cutPoints, setCutPoints] = useState<THREE.Vector3[]>([]);
  const isAlreadyCut = useRef(false);

  // Using useTrimesh for a more accurate physics representation of the non-convex rug pieces.
  // This prevents the "flapping" issue caused by inaccurate convex hull physics bodies.
  const [ref, api] = useTrimesh(() => {
    const vertices = geometry.attributes.position.array as Float32Array;
    const indices = geometry.index!.array as Uint16Array | Uint32Array;
    return {
      // Set mass to 0 for the initial single piece to keep it static until cut
      mass: totalPieces > 1 ? (vertices.length / 3) / 50 : 0, 
      args: [vertices, indices],
      friction: 0.9,
      restitution: 0.1,
    };
  }, [geometry, totalPieces]);


  const rugTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext('2d')!;
    context.fillStyle = '#5a3d2b';
    context.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 8000; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        const shade = 80 + Math.random() * 60;
        const r = shade + Math.random() * 20;
        const g = (shade * 0.8) + Math.random() * 20;
        const b = (shade * 0.6) + Math.random() * 20;
        context.fillStyle = `rgb(${r}, ${g}, ${b})`;
        context.fillRect(x, y, Math.random() * 2 + 1, Math.random() * 2 + 1);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 6);
    return texture;
  }, []);

  const handlePointerDown = (e: any) => {
    // Only allow cutting if in "Cut Mode"
    if (!isCutMode || e.button !== 0 || isAlreadyCut.current) return;
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setIsCutting(true);
    // Initialize cut points slightly above the rug for visibility
    setCutPoints([e.point.clone().setY(0.02)]);
  };

  const handlePointerMove = (e: any) => {
    if (!isCutting) return;
    e.stopPropagation();
    setCutPoints(prev => [...prev, e.point.clone().setY(0.02)]);
  };

  const handlePointerUp = (e: any) => {
    if (!isCutting || isAlreadyCut.current) return;
    e.stopPropagation();
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    setIsCutting(false);
    
    if (cutPoints.length > 1) {
        isAlreadyCut.current = true;
        const localCutPoints = cutPoints.map(p => {
          const localPoint = (ref.current as THREE.Mesh).worldToLocal(p.clone());
          return new THREE.Vector2(localPoint.x, localPoint.z);
        });
        
        const newGeometries = cutMesh(geometry, localCutPoints);

        if (newGeometries.length > 1) {
            const startPoint = localCutPoints[0];
            const endPoint = localCutPoints[localCutPoints.length - 1];
            const cutVec = new THREE.Vector2().subVectors(endPoint, startPoint).normalize();
            const normalVec = new THREE.Vector2(-cutVec.y, cutVec.x);

            const impulseStrength = 3;

            const newPieces: RugPieceData[] = newGeometries.map((geo, index) => {
              const impulseDirection = index === 0 ? normalVec : normalVec.clone().negate();
              geo.computeBoundingSphere();
              const center = geo.boundingSphere.center;
              
              return {
                id: THREE.MathUtils.generateUUID(),
                geometry: geo,
                initialImpulse: {
                  impulse: [impulseDirection.x * impulseStrength, 1.5, impulseDirection.y * impulseStrength],
                  position: [center.x, center.y, center.z]
                }
              };
            });
            onCut(id, newPieces);
        } else {
           isAlreadyCut.current = false; // Cut failed, allow retry
        }
    }
    setCutPoints([]);
  };

  useEffect(() => {
    if (initialImpulse) {
      api.applyImpulse(initialImpulse.impulse as Triplet, initialImpulse.position as Triplet);
    }
  }, [api, initialImpulse]);
  
  // Disable camera controls while the user is actively drawing a cut line
  useFrame(({ controls }) => {
    if (controls) {
      (controls as any).enabled = !isCutting;
    }
  });

  return (
    <>
      {/* Visual indicator for the cut path */}
      {isCutting && cutPoints.length > 1 && (
        <Line
          points={cutPoints}
          color="red"
          lineWidth={5}
        />
      )}
      <mesh
        ref={ref as React.Ref<THREE.Mesh>}
        geometry={geometry}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerOut={handlePointerUp}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          map={rugTexture}
          side={THREE.DoubleSide}
          roughness={0.9}
          metalness={0.0}
        />
      </mesh>
    </>
  );
};

export default RugPiece;
