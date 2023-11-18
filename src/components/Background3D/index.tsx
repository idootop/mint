'use client';

import { Detailed, useProgress } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useRef, useState } from 'react';
import * as THREE from 'three';
import { useXState } from 'xsta';

import { Row } from '@/core/components/Flex';
import { Stack } from '@/core/components/Stack';
import { Position } from '@/core/components/Stack/position';
import { range } from '@/core/utils/base';

import { LargeRock } from './Rock';
import styles from './styles.module.css';

const easing = x => Math.sqrt(1 - Math.pow(x - 1, 2));
const randomZ = depth =>
  -1 * Math.round(easing(THREE.MathUtils.randFloatSpread(1)) * depth);

export const kBackground3DLoadedKey = 'kBackground3DLoaded';

export function Background3D({ children, isMobile, isReady }) {
  const count = isMobile ? 40 : 100;
  const depth = isMobile ? 50 : 50;
  const speed = isMobile ? 2 : 2;
  const { active: loading } = useProgress();
  const [loaded, setLoaded] = useXState('kBackground3DLoaded');
  if (!loading && !loaded) {
    setTimeout(() => {
      setLoaded(true);
    }, 100);
  }
  return (
    <Stack>
      {children}
      <Position
        width="100%"
        height="100%"
        opacity={loaded ? 1 : 0}
        transition="all 500ms ease"
      >
        <Canvas
          gl={{ preserveDrawingBuffer: true }}
          dpr={[2, 3]}
          camera={{
            position: [0, 0, 10],
            fov: 20,
            near: 0.01,
            far: depth + 15,
          }}
        >
          <ambientLight intensity={1} />
          <directionalLight
            color="#fff"
            position={[5, 5, 5]}
            castShadow
            receiveShadow
          />
          {Array.from({ length: count }, (_, i) => (
            <Model key={i} index={i} z={randomZ(depth)} speed={speed} />
          ))}
        </Canvas>
      </Position>
      <Position
        bottom="0"
        width="100%"
        opacity={loaded ? 1 : 0}
        transition="all 500ms ease"
      >
        {isReady && loaded && <Cite isMobile={isMobile} />}
      </Position>
    </Stack>
  );
}

function Model({ index, z, speed = 2 }) {
  const ref = useRef<any>();
  const { viewport, camera } = useThree();
  const { width, height } = viewport.getCurrentViewport(camera, [0, 0, z]);

  const randomX = () => THREE.MathUtils.randFloatSpread(1 * width);
  const randomY = () => THREE.MathUtils.randFloatSpread(2 * height);

  const [data] = useState({
    x: randomX(),
    y: randomY(),
    z: z,
    spin: THREE.MathUtils.randFloat(10, 20),
    rX: Math.random() * Math.PI,
    rZ: Math.random() * Math.PI,
  });

  useFrame((state, dt) => {
    if (dt < 0.1) {
      ref.current.position.set(
        data.x, // x 坐标不变
        (data.y += dt * speed), // 向上飞
        data.z, // z 坐标不变
      );
    }
    if (data.y > height) {
      // 飞出屏幕顶部，重新回到底部
      data.y = -height;
      data.x = randomX(); // 随机 x 坐标
    }
    ref.current.rotation.set(
      (data.rX += dt / data.spin),
      Math.sin(index * 1000 + state.clock.elapsedTime / 10) * Math.PI,
      (data.rZ += dt / data.spin),
    );
  });

  return (
    <Detailed ref={ref} distances={[0, 50, 100]}>
      {range(3).map(i => (
        <LargeRock key={i} />
      ))}
    </Detailed>
  );
}

const Cite = ({ isMobile }) => {
  return (
    <Row
      className={
        isMobile
          ? [styles.poly_pizza, styles.poly_pizza_mobile].join(' ')
          : styles.poly_pizza
      }
    >
      <a
        href="https://poly.pizza/bundle/Small-Platformer-Kit-RkxaHLeCfO"
        target="_blank"
      >
        *Small Platformer Kit
      </a>
      {' by '}
      <a href="https://poly.pizza/u/J-Toastie" target="_blank">
        J-Toastie
      </a>
      {' ['}
      <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank">
        CC-BY
      </a>
      {'] via '}
      <a href="https://poly.pizza" target="_blank">
        Poly Pizza
      </a>
    </Row>
  );
};
