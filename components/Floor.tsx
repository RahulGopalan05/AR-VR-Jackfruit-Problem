
import React from 'react';
import { usePlane } from '@react-three/cannon';

const Floor: React.FC = () => {
  const [ref] = usePlane(() => ({
    rotation: [-Math.PI / 2, 0, 0],
    position: [0, -0.01, 0],
  }));

  return (
    <mesh ref={ref} receiveShadow>
      <planeGeometry args={[100, 100]} />
      <shadowMaterial opacity={0.4} />
    </mesh>
  );
};

export default Floor;
