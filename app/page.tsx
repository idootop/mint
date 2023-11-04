'use client';

import { Center } from '@/core/components/Flex';
import { useBreakpoint } from '@/core/hooks/useBreakpoint';
import { useLocation } from '@/core/hooks/useLocation';
import { kBodyHeight, kHeaderHeight } from '@/src/components/Layouts/sizes';

import { Background3D } from '../src/components/Background3D';
import styles from './styles.module.css';

export default function Index() {
  const { isMobile } = useBreakpoint();
  const bodyHeight = isMobile
    ? `calc(100vh - ${kHeaderHeight}px)`
    : kBodyHeight;
  const domain = useLocation()?.hostname?.replace('www.', '');
  return (
    <Background3D isMobile={isMobile}>
      <Center height={bodyHeight}>
        <h1
          className={styles.shake}
          style={{
            color: '#fff',
            background: '#000',
            padding: '10px 20px',
            boxShadow: '0px 10px 10px 0px rgba(0, 0, 0, 0.20)',
          }}
        >
          {domain}
        </h1>
      </Center>
    </Background3D>
  );
}
