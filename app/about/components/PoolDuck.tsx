'use client';

import { useEffect, useRef } from 'react';

import { Application } from './app';
// @ts-expect-error
import duck from './assets/duck.glb';
import sky from './assets/sky.jpg';
import tiles from './assets/tiles.jpg';
import styles from './styles.module.css';

function initStyles() {
  document.getElementById('header')!.classList.add(styles.header);
  document.getElementById('footer')!.classList.add(styles.footer);
  document.getElementById('about-box')!.classList.add(styles.box);
  document.getElementById('about-bg')!.classList.add(styles.bg);
}

function removeStyles() {
  document.getElementById('header')!.classList.remove(styles.header);
  document.getElementById('footer')!.classList.remove(styles.footer);
}

export default function PoolDuck() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    initStyles();
    return () => {
      removeStyles();
    };
  }, []);

  useEffect(() => {
    const app = new Application({
      duckModel: duck.src,
      canvas: canvasRef.current!,
    });
    app.start();
    return () => {
      app.stop();
    };
  }, []);

  return (
    <>
      <canvas
        id="canvas"
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 0,
        }}
      />
      <img id="tiles" src={tiles.src} style={{ display: 'none' }} />
      <img id="sky" src={sky.src} style={{ display: 'none' }} />
    </>
  );
}
