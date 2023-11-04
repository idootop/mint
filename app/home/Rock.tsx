// Small Platformer Kit by J-Toastie [CC-BY] via Poly Pizza
// https://poly.pizza/bundle/Small-Platformer-Kit-RkxaHLeCfO
import { useGLTF } from '@react-three/drei';
import React from 'react';

export function LargeRock(props) {
  const { nodes, materials } = useGLTF('/objs/rock.glb') as any;
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Large_Rock_Icosphere001.geometry}
        material={materials.Material}
      />
    </group>
  );
}

useGLTF.preload('/objs/rock.glb');
