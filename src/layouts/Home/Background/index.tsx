'use client';

import Link from 'next/link';
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
  appear: number;
}

const kRockStates: Record<number, RockContext> = {};

const kFrameDuration = 1000 / 60; // 60fps 的帧间隔，用于把真实帧间隔换算成帧数
const kAppearFrames = 6 * 5; // 石头出现动画时长（帧，约 500ms）

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
                baseSpeed: 0.8, // 石头上升速度（1 约等于 60fps 下每帧移动 1% 画布高度）
                spacing: 0.5,
              }}
              key={idx}
            />
          );
        })}
      <Position height="100%" width="100%">
        <Link
          href="/projects"
          style={{ width: '100%', height: '100%', display: 'block' }}
        />
      </Position>
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
        appear: 0,
      };
      kRockStates[idx].x = getSafeX(kRockStates[idx].y, kRockStates[idx].size);

      const animateRock = (dt) => {
        const speed = kRockStates[idx].speed;
        let { x, y, size, appear } = kRockStates[idx];
        const rock = document.getElementById(`${idx}`);
        // 出场动画：从画布中心滑到自己的位置（用 dt 换算，任何刷新率下时长一致）
        appear = Math.min(1, appear + dt / kAppearFrames);
        // appear 结束后渲染位置才等于计算位置，此时回收必定在画布外，不会看到瞬移
        if (y > 1 + spacing && appear >= 1) {
          // 完整移出画布顶部后，重新回到底部
          y = -spacing;
          size = randomSize();
          x = getSafeX(y, size);
        } else {
          // 横坐标保持不变
          y = y + (dt * speed) / 100;
        }
        kRockStates[idx] = { ...kRockStates[idx], x, y, size, appear };
        if (rock) {
          // 出场动画：从画布中心（0, 0）渐出到目标位置
          const progress = 1 - (1 - appear) ** 3;
          x = (x - 0.5) * progress; // 以屏幕原点为中心点
          y = -1 * (y - 0.5) * progress; // 以屏幕原点为中心点，并反转移动方向
          x = x * document.body.clientWidth; // % 转 px
          y = y * document.body.clientHeight; // % 转 px
          rock.style.width = `${size}px`;
          rock.style.height = `${size}px`;
          // 位置直接写入，不能使用 CSS transition：transition 每帧都会被重设，
          // 实际渲染位置会永远滞后于计算位置（刷新率越高滞后越多，Firefox 上
          // 又会把过渡放到合成线程、读不到真实位置），石头就会在还没完整移出
          // 画布时被回收瞬移，看起来像突然消失。
          rock.style.transform = `translate(${x}px, ${y}px) translateZ(0)`;
        }
      };

      let lastTime = 0;
      const nextTick = (time) => {
        if (isDisposed()) {
          return;
        }
        // 按真实时间推进，保证不同刷新率（60Hz / 120Hz / 低刷）下速度一致
        const dt = lastTime
          ? Math.min((time - lastTime) / kFrameDuration, 5)
          : 1;
        lastTime = time;
        animateRock(dt);
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
            transform: `translate(0, 0) translateZ(0)`,
          }}
        />
      )}
    </Position>
  );
};
