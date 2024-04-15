'use client';

import { Center } from '@/common/components/Flex';
import { useBreakpoint } from '@/common/hooks/useBreakpoint';

import { Background } from '../src/components/Background';

export default function Index() {
  const { isMobile } = useBreakpoint();
  const bodyHeight = `100%`;
  return (
    <>
      <Background isMobile={isMobile} height={bodyHeight}>
        <Center height={bodyHeight}>
          <h1
            style={{
              fontSize: '48px',
              fontWeight: '600',
            }}
          >
            你好
          </h1>
        </Center>
      </Background>
    </>
  );
}
