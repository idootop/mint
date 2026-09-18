'use client';

import { useEffect, useRef } from 'react';

// @ts-expect-error
import duck from './assets/duck.glb';
import sky from './assets/sky.webp';
import tiles from './assets/tiles.webp';
import { Application } from './gl/app';

export default function PoolDuck() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let app: Application | null = null;
    let cancelled = false;

    const run = async () => {
      try {
        const instance = new Application({
          duckModel: duck.src,
          tiles: tiles.src,
          sky: sky.src,
          canvas,
        });
        app = instance;

        // init() 返回 false 表示环境不支持（例如缺少可渲染的浮点纹理），
        // 此时页面保留 CSS 的纯色背景即可，不当作错误。
        const ready = await instance.init();
        if (cancelled || !ready) {
          instance.stop();
          return;
        }
        instance.start();
      } catch (error) {
        // 兜底：任何意外都不应该让整页崩掉，降级为纯色背景
        console.error('[PoolDuck] 初始化失败:', error);
      }
    };

    run();

    return () => {
      cancelled = true;
      app?.stop();
      app = null;
    };
  }, []);

  return (
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
  );
}
