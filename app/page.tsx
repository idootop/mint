'use client';

import { useXState } from 'xsta';

import { Center } from '@/core/components/Flex';
import { Spinner } from '@/core/components/Spinner';
import { useBreakpoint } from '@/core/hooks/useBreakpoint';

import {
  Background3D,
  kBackground3DLoadedKey,
} from '../src/components/Background3D';

export default function Index() {
  const { isMobile, isReady } = useBreakpoint();
  const [loaded] = useXState(kBackground3DLoadedKey);
  const bodyHeight = `100%`;
  return (
    <>
      <Background3D isMobile={isMobile} isReady={isReady} height={bodyHeight}>
        <Center height={bodyHeight}>
          <h1
            style={{
              opacity: loaded ? 1 : 0,
              width: loaded ? 'auto' : 0,
              height: loaded ? 'auto' : 0,
              fontSize: '48px',
              fontWeight: '600',
            }}
          >
            你好
          </h1>
          {!loaded && (
            <Spinner color="rgba(0, 0, 0, 1)" background="rgba(0, 0, 0, 0.1)" />
          )}
        </Center>
      </Background3D>
    </>
  );
}
