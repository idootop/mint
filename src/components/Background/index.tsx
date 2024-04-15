import { useEffect, useRef } from 'react';

import { Stack } from '@/common/components/Stack';
import { Position } from '@/common/components/Stack/position';
import { useBoxSize } from '@/common/hooks/useBoxSize';
import { pickOne, randomFloat, range } from '@/common/utils/base';

import rock1 from './images/rock1.svg';
import rock2 from './images/rock2.svg';
import rock3 from './images/rock3.svg';

export function Background({ children, isMobile, height }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvas = canvasRef.current;

  useEffect(() => {
    if (canvas) {
      startRockAnimation(canvas, isMobile);
    }
  }, [canvas, isMobile]);

  const { boxRef, width: boxWidth, height: boxHeight } = useBoxSize();

  useEffect(() => {
    if (canvas) {
      canvas.width = boxWidth;
      canvas.height = boxHeight;
    }
  }, [boxWidth, boxHeight, canvas]);

  return (
    <Stack ref={boxRef} width="100%" height={height}>
      <canvas ref={canvasRef} />
      <Position width="100%" height="100%">
        {children}
      </Position>
    </Stack>
  );
}

interface Rock {
  /**
   * SVG 图片
   */
  rock: string;
  x: number;
  y: number;
  size: number;
  /**
   * 旋转
   */
  rotate: number;
}

const startRockAnimation = (canvas: HTMLCanvasElement, isMobile) => {
  const count = isMobile ? 40 : 100;
  const depthRange = isMobile ? 50 : 50;
  const moveSpeed = isMobile ? 2 : 2;
  const rotateSpeed = isMobile ? 1 : 1;

  let states: Rock[] = range(count).map(_ => ({}) as any);

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const drawRock = (ctx: CanvasRenderingContext2D, rock: Rock) => {
    const img = new Image();
    img.src = rock.rock;
    ctx.save();
    ctx.translate(rock.x, rock.y);
    ctx.rotate(rock.rotate);
    ctx.drawImage(img, -rock.size / 2, -rock.size / 2, rock.size, rock.size);
    ctx.restore();
  };

  const drawRocks = () => {
    // 清除画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // 重新绘制
    states.forEach(state => drawRock(ctx, state));
  };

  const nextTick = (dt: number = 0) => {
    // 更新状态
    states = states.map(state =>
      animateRock({ ...state, dt, canvas, depthRange, moveSpeed, rotateSpeed }),
    );
    // 绘制
    drawRocks();
    // 下一帧
    requestAnimationFrame(() => {
      nextTick(dt + 1);
    });
  };

  return requestAnimationFrame(nextTick);
};

type RockContext = Rock & {
  moveSpeed: number;
  rotateSpeed: number;
};

// todo 修复动效
const animateRock = (
  props: Partial<Rock> & {
    dt: number;
    canvas: HTMLCanvasElement;
    depthRange: number;
    moveSpeed: number;
    rotateSpeed: number;
  },
): RockContext => {
  const { dt, canvas, depthRange, moveSpeed, rotateSpeed } = props;
  const { width, height } = canvas;
  const easing = x => Math.sqrt(1 - Math.pow(x - 1, 2));
  const randomX = () => randomFloat(0, 1 * width);
  const randomY = () => randomFloat(0, 3 * height);
  const randomZ = depth => -1 * depth * easing(Math.random());

  if (!props.rock) {
    // 初始化参数
    const depth = randomZ(depthRange);
    const _rock = pickOne([rock1, rock2, rock3])!;
    return {
      // 变量
      x: randomX(),
      y: randomY(),
      rotate: Math.random() * Math.PI * rotateSpeed,
      // 不变量
      rock: _rock.src,
      size: depth,
      moveSpeed: Math.random() * moveSpeed,
      rotateSpeed: Math.random() * Math.PI * rotateSpeed,
    };
  }
  let { x, y, rotate } = props as any;
  if (y > 1.5 * height) {
    // 飞出屏幕顶部，重新回到底部
    y = 1.5 * -height;
    x = randomX(); // 随机 x 坐标
  } else {
    // 横坐标保持不变
    y = y + dt * moveSpeed;
  }
  rotate = rotate + dt / rotateSpeed;
  return { ...props, x, y, rotate } as any;
};
