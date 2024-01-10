// Small Platformer Kit by J-Toastie [CC-BY] via Poly Pizza
// https://poly.pizza/bundle/Small-Platformer-Kit-RkxaHLeCfO
import { useGLTF } from '@react-three/drei';
import React, { forwardRef } from 'react';

export const LargeRock = forwardRef((props: any, ref: any) => {
  const { nodes, materials } = useGLTF('/objs/rock.glb') as any;
  return (
    <group ref={ref} {...props}>
      <mesh
        geometry={nodes.Large_Rock_Icosphere001.geometry}
        material={materials.Material}
      />
    </group>
  );
});

useGLTF.preload('/objs/rock.glb');
