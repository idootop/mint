import { useEffect, useRef, useState } from 'react';

import { Box } from '@/common/components/Box';
import { Stack } from '@/common/components/Stack';
import { Position } from '@/common/components/Stack/position';
import { pickOne, randomFloat, range } from '@/common/utils/base';

import { Rock1, Rock2, Rock3 } from './Rock';

export function Background({ children, isMobile, height }) {
  const count = isMobile ? 50 : 50;
  return (
    <Stack width="100%" height={height} overflow="hidden">
      <Box size="100%" />
      {range(count).map(idx => {
        return (
          <Rock
            key={idx}
            config={{
              idx,
              speed: isMobile ? 1 : 10,
              spacing: isMobile ? 0.5 : 0.5,
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
  Rock: any;
  x: number;
  y: number;
  size: number;
  speed: number;
}

const Rock = (props: {
  config: { idx: number; speed: number; spacing: number };
}) => {
  const { spacing, speed } = props.config;
  const randomX = () => randomFloat(-spacing * 100, (1 + spacing) * 100);
  const randomY = () => randomFloat(-spacing * 100, (1 + spacing) * 100);
  const [state, setState] = useState<RockContext | undefined>();
  const requestRef = useRef<number | null>(null);
  const ctxRef = useRef<{ ctx; setCtx } | undefined>({
    ctx: state,
    setCtx: setState,
  });
  if (ctxRef.current) {
    ctxRef.current.ctx = state;
    ctxRef.current.setCtx = setState;
  }

  useEffect(() => {
    ctxRef.current = { ctx: state, setCtx: setState };
    const animateRock = dt => {
      const { ctx, setCtx } = ctxRef.current!;
      if (!ctx) {
        setCtx({
          x: randomX(),
          y: randomY(),
          size: randomFloat(64, 128),
          speed: Math.random() * speed,
          Rock: pickOne([Rock1, Rock2, Rock3])!,
        });
        return;
      }
      let { x, y } = ctx;
      if (y > (1 + spacing) * 100) {
        // 飞出屏幕顶部，重新回到底部
        y = -spacing * 100;
        // 随机 x 坐标
        // todo 元素不要重叠
        x = randomX();
      } else {
        // 横坐标保持不变
        y = y + dt * speed;
      }
      setCtx({ ...ctx, x, y });
    };

    const nextTick = () => {
      if (!ctxRef.current) {
        return;
      }
      animateRock(1);
      requestRef.current = requestAnimationFrame(nextTick);
    };
    requestRef.current = requestAnimationFrame(nextTick);
    return () => {
      ctxRef.current = undefined;
      cancelAnimationFrame(requestRef.current!);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { x, y, size, Rock: RockWidget } = state ?? {};
  return (
    <Position left={`${x}%`} bottom={`${y}%`}>
      {RockWidget && (
        <RockWidget style={{ width: `${size}px`, objectFit: 'contain' }} />
      )}
    </Position>
  );
};
