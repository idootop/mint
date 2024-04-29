import { BoxProps } from '@/common/components/Box';

import { getIconProps } from '.';

export function IconOpenLink(p: BoxProps) {
  const props = getIconProps(p);
  return (
    <svg {...props} fill="none" viewBox="0 0 48 48">
      <path
        d="M28 6H42V20"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M42 29.4737V39C42 40.6569 40.6569 42 39 42H9C7.34315 42 6 40.6569 6 39V9C6 7.34315 7.34315 6 9 6L18 6"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M25.7998 22.1999L41.0998 6.8999"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
