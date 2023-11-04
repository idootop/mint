import Link from 'next/link';

import { Column } from '@/core/components/Flex';
import { kBodyHeight } from '@/src/components/Layouts/sizes';

import styles from './styles.module.css';

export default function NotFound() {
  return (
    <Link
      href="/"
      style={{
        color: '#000',
        textDecoration: 'none',
      }}
    >
      <Column style={{ height: kBodyHeight, justifyContent: 'center' }}>
        <p
          className={styles.shake}
          style={{
            fontSize: '64px',
            marginBottom: '12px',
          }}
        >
          ❓
        </p>
        <p>找不到对象，回首页</p>
      </Column>
    </Link>
  );
}
