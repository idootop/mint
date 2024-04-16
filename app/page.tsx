'use client';

import { Center } from '@/common/components/Flex';
import { useBreakpoint } from '@/common/hooks/useBreakpoint';
import { kFooterHeight } from '@/components/Layouts/sizes';

import { Background } from '../src/components/Background';

export default function Index() {
  const { isMobile } = useBreakpoint();
  const bodyHeight = `calc(100% - ${kFooterHeight}px)`;
  return (
    <Background isMobile={isMobile} height={bodyHeight}>
      <Center height="100%">
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
  );
}
