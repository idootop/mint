import Link from 'next/link';

import { kFooterHeight, kPageMaxWidth } from './sizes';

export const Footer = () => {
  return (
    <footer
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        margin: '0 auto',
        maxWidth: kPageMaxWidth,
        height: kFooterHeight,
        fontSize: '14px',
        textAlign: 'center',
        color: 'rgba(0, 0, 0, 0.4)',
      }}
    >
      <p>
        © 2017-{new Date().getFullYear()}&nbsp;
        <Link href="/" style={{ color: 'rgba(0, 0, 0, 0.4)' }}>
          Del Wang
        </Link>
        . All rights reserved.
      </p>
    </footer>
  );
};
