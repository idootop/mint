'use client';

import { useEffect } from 'react';

import { Center } from '@/common/components/Flex';
import { CardText } from '@/components/Text/CardText';
import { kBodyHeight } from '@/layouts/sizes';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Center
      cursor="pointer"
      onClick={() => reset()}
      style={{
        height: kBodyHeight,
        color: '#000',
        textDecoration: 'none',
      }}
    >
      <CardText
        style={{
          fontSize: '32px',
          marginBottom: '12px',
        }}
      >
        Error
      </CardText>
      <p>出错了，点击重试</p>
    </Center>
  );
}
