'use client';

import { Center } from '@/core/components/Flex';
import { Spinner } from '@/core/components/Spinner';
import { useBreakpoint } from '@/core/hooks/useBreakpoint';
import { useLocation } from '@/core/hooks/useLocation';
import { useStore } from '@/core/utils/store/useStore';
import { kBodyHeight, kHeaderHeight } from '@/src/components/Layouts/sizes';

import {
  Background3D,
  kBackground3DLoadedKey,
} from '../src/components/Background3D';
import styles from './styles.module.css';

export default function Index() {
  const { isMobile, isReady } = useBreakpoint();
  const bodyHeight = isMobile
    ? `calc(100vh - ${kHeaderHeight}px)`
    : kBodyHeight;
  const domain = useLocation()?.hostname?.replace('www.', '');
  const [loaded] = useStore(kBackground3DLoadedKey);
  return (
    <Background3D isMobile={isMobile} isReady={isReady}>
      <Center height={bodyHeight}>
        <h1
          className={[styles.shake, 'ease500'].join(' ')}
          style={{
            color: '#fff',
            background: '#000',
            padding: '10px 20px',
            boxShadow: '0px 10px 10px 0px rgba(0, 0, 0, 0.20)',
            opacity: loaded ? 1 : 0,
            width: loaded ? 'auto' : 0,
            height: loaded ? 'auto' : 0,
          }}
        >
          {domain}
        </h1>
        {!loaded && (
          <Spinner color="rgba(0, 0, 0, 1)" background="rgba(0, 0, 0, 0.1)" />
        )}
      </Center>
    </Background3D>
  );
}
