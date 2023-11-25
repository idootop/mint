import Link from 'next/link';

import { Column } from '@/core/components/Flex';
import { kBodyHeight } from '@/src/components/Layouts/sizes';
import { CardText } from '@/src/components/Texts/CardText';

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
        <CardText
          className={styles.breathing}
          style={{
            fontSize: '32px',
            marginBottom: '12px',
          }}
        >
          404
        </CardText>
        <p>找不到对象，回首页</p>
      </Column>
    </Link>
  );
}
