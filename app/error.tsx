'use client';

import { useEffect } from 'react';

import { Center } from '@/core/components/Flex';
import { kBodyHeight } from '@/src/components/Layouts/sizes';

import styles from './styles.module.css';

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
      style={{
        height: kBodyHeight,
        color: '#000',
        textDecoration: 'none',
      }}
      onClick={() => reset()}
      cursor="pointer"
    >
      <p
        className={styles.shake}
        style={{
          fontSize: '64px',
          marginBottom: '12px',
        }}
      >
        ❌
      </p>
      <p>出错了，点击重试</p>
    </Center>
  );
}
