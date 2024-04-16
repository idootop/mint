import { useEffect, useMemo, useRef, useState } from 'react';

import { Box } from '@/common/components/Box';
import { Image } from '@/common/components/Image';
import { Stack } from '@/common/components/Stack';
import { Position } from '@/common/components/Stack/position';
import { pickOne, randomFloat, range } from '@/common/utils/base';

import rock1 from './images/rock1.svg';
import rock2 from './images/rock2.svg';
import rock3 from './images/rock3.svg';

export function Background({ children, isMobile, height }) {
  const count = isMobile ? 40 : 100;
  const rocks = useMemo(() => {
    return [rock1, rock2, rock3].map(rock => {
      const img = new window.Image();
      img.src = rock.src;
      return img;
    });
  }, []);
  return (
    <Stack width="100%" height={height} overflow="hidden">
      <Box size="100%" />
      {range(count).map(idx => {
        return (
          <Rock
            key={idx}
            config={{
              rocks,
              depthRange: isMobile ? 50 : 50,
              moveSpeed: isMobile ? 2 : 2,
              rotateSpeed: isMobile ? 1 : 1,
            }}
          />
        );
      })}
      <Position width="100%" height="100%">
        {children}
      </Position>
    </Stack>
  );
}

interface RockContext {
  /**
   * SVG 图片
   */
  rock: HTMLImageElement;
  x: number;
  y: number;
  size: number;
  /**
   * 旋转
   */
  rotate: number;
  moveSpeed: number;
  rotateSpeed: number;
}

const Rock = (props: {
  config: {
    rocks: HTMLImageElement[];
    depthRange: number;
    moveSpeed: number;
    rotateSpeed: number;
  };
}) => {
  const { rocks, depthRange, moveSpeed, rotateSpeed } = props.config;
  const easing = x => Math.sqrt(1 - Math.pow(x - 1, 2));
  const randomX = () => randomFloat(0, 100);
  const randomY = () => randomFloat(0, 3 * 100);
  const randomZ = depth => -1 * depth * easing(Math.random());
  const [state, setState] = useState<RockContext>({
    // 变量
    x: randomX(),
    y: randomY(),
    rotate: Math.random() * Math.PI * rotateSpeed,
    // 不变量
    rock: pickOne(rocks)!,
    size: randomZ(depthRange) * 12,
    moveSpeed: Math.random() * moveSpeed,
    rotateSpeed: Math.random() * Math.PI * rotateSpeed,
  });
  const ctxRef = useRef({ ctx: state, setCtx: setState });
  ctxRef.current = { ctx: state, setCtx: setState };

  // todo 修复动效
  const animateRock = dt => {
    const { ctx, setCtx } = ctxRef.current;
    let { x, y, rotate } = ctx;
    if (y > 1.5 * 100) {
      // 飞出屏幕顶部，重新回到底部
      y = 1.5 * -100;
      x = randomX(); // 随机 x 坐标
    } else {
      // 横坐标保持不变
      y = y + dt * moveSpeed;
    }
    rotate = rotate + dt / rotateSpeed;
    setCtx({ ...ctxRef.current.ctx, x, y, rotate });
  };

  useEffect(() => {
    return;
    let requestId: number | null = null;
    const nextTick = (dt: number = 0) => {
      animateRock(dt);
      requestId = requestAnimationFrame(() => {
        nextTick(dt + 1);
      });
    };
    requestId = requestAnimationFrame(nextTick);
    return () => {
      if (requestId !== null) {
        cancelAnimationFrame(requestId);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { x, y, size, rock } = state;
  return (
    <Position left={`${x}%`} top={`${y}%`}>
      <Image src={rock.src} alt="rock" size={size} objectFit="contain" />
    </Position>
  );
};
