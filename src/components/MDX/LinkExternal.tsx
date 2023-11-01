'use client';

import Link from 'next/link';

import { useLocation } from '@/core/hooks/useLocation';

export function LinkExternal(props: any) {
  const { href, children, target, ...restProps } = props;
  const location = useLocation();
  const isSelf =
    href?.startsWith('#') || href?.startsWith(location?.origin ?? '');
  return (
    <Link
      href={href ?? '#'}
      target={target ?? (isSelf ? '_self' : '_blank')}
      {...restProps}
    >
      {children}
    </Link>
  );
}
