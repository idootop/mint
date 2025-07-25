'use client';

import { useCallback, useRef } from 'react';

import { Box } from '@/common/components/Box';
import { Stack } from '@/common/components/Stack';
import { Position } from '@/common/components/Stack/position';
import { useBreakpoint } from '@/common/hooks/useBreakpoint';
import { useEffectSafely } from '@/common/hooks/useEffectSafely';
import { randomFloat, range } from '@/common/utils/base';
import { kFooterHeight } from '@/layouts/sizes';

import { Rock1, Rock2, Rock3 } from './Rock';

interface RockContext {
  x: number;
  y: number;
  size: number;
  speed: number;
}

const kRockStates: Record<number, RockContext> = {};

export function Background({ children }) {
  const { isMobile, isReady } = useBreakpoint();
  const bodyHeight = `calc(100% - ${kFooterHeight}px)`;

  return (
    <Stack height={bodyHeight} overflow="hidden" width="100%">
      <Box size="100%" />
      <Position height="100%" width="100%">
        {children}
      </Position>
      {isReady &&
        range(30).map((idx) => {
          return (
            <Rock
              config={{
                idx,
                minSize: 64,
                maxSize: 128,
                count: isMobile ? 40 : 50,
                baseSize: isMobile ? 1 / 2 : 1,
                baseSpeed: isMobile ? 1 / 2 : 1 / 2,
                spacing: 0.5,
              }}
              key={idx}
            />
          );
        })}
    </Stack>
  );
}

const Rock = (props: {
  config: {
    idx: number;
    count: number;
    minSize: number;
    maxSize: number;
    baseSize: number;
    baseSpeed: number;
    spacing: number;
  };
}) => {
  const { idx, count, minSize, maxSize, baseSize, baseSpeed, spacing } =
    props.config;
  const requestRef = useRef<number | null>(null);
  const noTransition = '0ms';
  const defaultTransition = 'transform 300ms';
  const hidden = idx > count - 1;
  const RockWidget = [Rock1, Rock2, Rock3][(idx + 1) % 3];
  const randomX = () => randomFloat(-spacing, 1 + spacing);
  const randomY = () => randomFloat(-spacing, 1 + spacing);
  const randomSize = useCallback(
    () => randomFloat(minSize, maxSize) * baseSize,
    [baseSize, maxSize, minSize],
  );

  useEffectSafely(
    (isDisposed) => {
      if (hidden) {
        return;
      }

      const getSafeX = (_y, size) => {
        const y = _y * document.body.clientHeight;
        const otherRocks = Object.entries(kRockStates)
          .filter(([key, _]) => key !== `${idx}`)
          .map((e) => ({
            size: e[1].size,
            x: e[1].x * document.body.clientWidth,
            y: e[1].y * document.body.clientHeight,
          }));

        const fullRange = {
          start: -spacing * document.body.clientWidth,
          end: (1 + spacing) * document.body.clientWidth,
        };
        let validRanges = [fullRange];

        for (const rock of otherRocks) {
          if (Math.abs(rock.y - y) >= (rock.size + size) / 2) {
            // y 坐标足够远,不需要处理该物体
            // 注意，rock 的 size 是以中心点为原点计算
            continue;
          }

          const left = rock.x - (rock.size + size) / 2;
          const right = rock.x + (rock.size + size) / 2;

          validRanges = validRanges.flatMap((range) => {
            const leftRange = {
              start: range.start,
              end: Math.min(range.end, left),
            };
            const rightRange = {
              start: Math.max(range.start, right),
              end: range.end,
            };
            // 确保返回的范围是有效的
            return [
              ...(leftRange.start < leftRange.end ? [leftRange] : []),
              ...(rightRange.start < rightRange.end ? [rightRange] : []),
            ];
          });
        }

        if (validRanges.length === 0) {
          // 没有合适的范围，无法找到安全的 x 坐标
          return randomX();
        }

        const safeRange = validRanges.sort(
          (a, b) => b.end - b.start - (a.end - a.start),
        )[0];
        return (
          randomFloat(safeRange.start, safeRange.end) /
          document.body.clientWidth
        );
      };

      kRockStates[idx] = {
        x: 0,
        y: randomY(),
        size: randomSize(),
        speed: baseSpeed,
      };
      kRockStates[idx].x = getSafeX(kRockStates[idx].y, kRockStates[idx].size);

      const animateRock = (dt) => {
        let transition = '0s';
        const speed = kRockStates[idx].speed;
        let { x, y, size } = kRockStates[idx];
        if (y > 1 + spacing) {
          // 飞出屏幕顶部，重新回到底部
          y = -spacing;
          size = randomSize();
          x = getSafeX(y, size);
          transition = noTransition;
        } else {
          // 横坐标保持不变
          y = y + (dt * speed) / 100;
          transition = defaultTransition;
        }
        kRockStates[idx] = { ...kRockStates[idx], x, y, size };
        const rock = document.getElementById(`${idx}`);
        if (rock) {
          x = x - 0.5; // 以屏幕原点为中心点
          y = y - 0.5; // 以屏幕原点为中心点
          y = -1 * y; // 变换移动方向
          x = x * document.body.clientWidth; // % 转 px
          y = y * document.body.clientHeight; // % 转 px
          rock.style.width = `${size}px`;
          rock.style.height = `${size}px`;
          rock.style.transition = transition;
          rock.style.transform = `translate(${x}px, ${y}px) translateZ(0)`;
        }
      };

      const nextTick = () => {
        if (isDisposed()) {
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
    },
    [baseSize, baseSpeed, idx, hidden, maxSize, randomSize, spacing],
  );

  return (
    <Position align="center">
      {RockWidget && (
        <RockWidget
          id={`${idx}`}
          style={{
            width: '0px',
            height: '0px',
            objectFit: 'contain',
            opacity: hidden ? '0' : '1',
            transition: defaultTransition,
            transform: `translate(0, 0) translateZ(0)`,
          }}
        />
      )}
    </Position>
  );
};
