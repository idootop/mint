'use client';

import { Center } from '@/core/components/Flex';
import { Spinner } from '@/core/components/Spinner';
import { useBreakpoint } from '@/core/hooks/useBreakpoint';
import { useLocation } from '@/core/hooks/useLocation';
import { useStore } from '@/core/utils/store/useStore';
import { kHeaderHeight } from '@/src/components/Layouts/sizes';
import { CardText } from '@/src/components/Texts/CardText';

import {
  Background3D,
  kBackground3DLoadedKey,
} from '../src/components/Background3D';
import styles from './styles.module.css';

export default function Index() {
  const { isMobile, isReady } = useBreakpoint();
  const domain = useLocation()?.hostname?.replace('www.', '');
  const [loaded] = useStore(kBackground3DLoadedKey);
  // 等待页面加载完毕后，再改变页面高度
  const bodyHeight = `calc(100vh - ${kHeaderHeight}px)`;
  return (
    <Background3D isMobile={isMobile} isReady={isReady}>
      <Center height={bodyHeight}>
        <CardText
          className={styles.shake}
          style={{
            opacity: loaded ? 1 : 0,
            width: loaded ? 'auto' : 0,
            height: loaded ? 'auto' : 0,
          }}
        >
          {domain}
        </CardText>
        {!loaded && (
          <Spinner color="rgba(0, 0, 0, 1)" background="rgba(0, 0, 0, 0.1)" />
        )}
      </Center>
    </Background3D>
  );
}
