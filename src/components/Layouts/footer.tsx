import Link from 'next/link';

import { kFooterHeight, kPageMaxWidth } from './sizes';

export const Footer = () => {
  return (
    <footer
      style={{
        textAlign: 'center',
        width: '100%',
        maxWidth: kPageMaxWidth,
        height: kFooterHeight,
        fontSize: '14px',
        color: 'rgba(0, 0, 0, 0.4)',
      }}
    >
      © 2017-{new Date().getFullYear()}&nbsp;
      <Link href="/" style={{ color: 'rgba(0, 0, 0, 0.4)' }}>
        Del.Wang
      </Link>
      . All rights reserved.
    </footer>
  );
};
