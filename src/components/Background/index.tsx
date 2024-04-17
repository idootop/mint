'use client';

import { useCallback, useEffect, useRef } from 'react';

import { Box } from '@/common/components/Box';
import { Stack } from '@/common/components/Stack';
import { Position } from '@/common/components/Stack/position';
import { useBreakpoint } from '@/common/hooks/useBreakpoint';
import { randomFloat, range } from '@/common/utils/base';

import { Rock1, Rock2, Rock3 } from './Rock';

interface RockContext {
  x: number;
  y: number;
  size: number;
  speed: number;
}

const kRockStates: Record<number, RockContext> = {};

export function Background({ children, height }) {
  const { isMobile, isReady } = useBreakpoint();
  const count = isMobile ? 20 : 30;

  return (
    <Stack width="100%" height={height} overflow="hidden">
      <Box size="100%" />
      {isReady &&
        range(30).map(idx => {
          return (
            <Rock
              key={idx}
              config={{
                idx,
                count,
                speed: isMobile ? 1 / 2 : 1 / 2,
                spacing: isMobile ? 0.5 : 0.5,
                baseSize: isMobile ? 1 / 2 : 1,
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

const Rock = (props: {
  config: {
    idx: number;
    count: number;
    speed: number;
    spacing: number;
    baseSize: number;
  };
}) => {
  const { idx, count, speed, spacing, baseSize } = props.config;
  const RockWidget = [Rock1, Rock2, Rock3][(idx + 1) % 3];
  const isHidden = idx > count - 1;
  const requestRef = useRef<number | null>(null);
  const randomX = useCallback(
    () => randomFloat(-spacing * 100, (1 + spacing) * 100),
    [spacing],
  );
  const randomY = useCallback(
    () => randomFloat(-spacing * 100, (1 + spacing) * 100),
    [spacing],
  );
  const randomSpeed = useCallback(() => Math.random() * speed, [speed]);
  const randomSize = useCallback(
    () => randomFloat(64, 128) * baseSize,
    [baseSize],
  );

  useEffect(() => {
    if (isHidden) {
      return;
    }
    kRockStates[idx] = {
      x: randomX(),
      y: randomY(),
      size: randomSize(),
      speed: randomSpeed(),
    };
    const animateRock = dt => {
      let transition = '0s';
      let { x, y, size } = kRockStates[idx];
      if (y > (1 + spacing) * 100) {
        // 飞出屏幕顶部，重新回到底部
        y = -spacing * 100;
        // todo no overlap
        x = randomX();
        size = randomSize();
        transition = '0s';
      } else {
        // 横坐标保持不变
        y = y + dt * speed;
        transition = 'transform 300ms';
      }
      kRockStates[idx] = { ...kRockStates[idx], x, y, size };
      const rock = document.getElementById(`${idx}`);
      if (rock) {
        x = x - 50; // 以屏幕原点为中心点
        y = y - 50; // 以屏幕原点为中心点
        y = -1 * y; // 变换移动方向
        rock.style.width = `${size}px`;
        rock.style.height = `${size}px`;
        rock.style.transition = transition;
        rock.style.transform = `translate(${x}vw, ${y}vh) translateZ(0)`;
      }
    };

    const nextTick = () => {
      if (!kRockStates[idx]) {
        return;
      }
      animateRock(1);
      requestRef.current = requestAnimationFrame(nextTick);
    };
    requestRef.current = requestAnimationFrame(nextTick);

    return () => {
      delete kRockStates[idx];
      cancelAnimationFrame(requestRef.current!);
    };
  }, [
    idx,
    isHidden,
    randomSize,
    randomSpeed,
    randomX,
    randomY,
    spacing,
    speed,
  ]);

  return (
    <Position align="center">
      {RockWidget && (
        <RockWidget
          id={`${idx}`}
          style={{
            width: '0px',
            height: '0px',
            objectFit: 'contain',
            opacity: isHidden ? '0' : '1',
          }}
        />
      )}
    </Position>
  );
};
