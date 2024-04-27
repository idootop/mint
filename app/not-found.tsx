import Link from 'next/link';

import { Column } from '@/common/components/Flex';
import { CardText } from '@/components/Text/CardText';
import { kBodyHeight } from '@/layouts/sizes';

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
