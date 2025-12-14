'use client';

import dynamic from 'next/dynamic';

export const PoolDuckLazy = dynamic(() => import('./PoolDuck'), {
  ssr: false,
});
