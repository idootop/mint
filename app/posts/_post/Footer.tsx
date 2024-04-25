'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { Column } from '@/common/components/Flex';
import { PageFrom } from '@/utils/page/type';

import type { Post, PostContext } from '.';
import styles from './styles.module.css';

export const Footer = ({
  ctx,
}: {
  ctx: {
    all: PostContext;
    pinned: PostContext;
  };
}) => {
  let from: any = useSearchParams().get('from');
  if (!Object.values(PageFrom).includes(from)) {
    from = PageFrom.all;
  }
  const { previous, next } = ctx[from];
  if (!previous && !next) {
    return; // 当前页面是隐藏页面，或不存在
  }
  return (
    <Column
      alignItems="center"
      style={{
        width: '100%',
        padding: '24px',
        background: '#161616',
      }}
    >
      {previous && <NavItem label="Previous" post={previous} from={from} />}
      {next && <NavItem label="Next" post={next} from={from} />}
    </Column>
  );
};

const NavItem = (props: { label: string; post: Post; from: PageFrom }) => {
  const { label, post, from } = props;
  return (
    <Column
      className={styles.link}
      style={{
        textAlign: 'center',
      }}
    >
      <span
        style={{
          marginBottom: '6px',
          fontSize: '12px',
          color: 'rgba(255, 255, 255, 0.4)',
          textTransform: 'uppercase',
          letterSpacing: '2px',
        }}
      >
        {label}
      </span>
      <Link href={`${post.path}?from=${from}`}>{post.title}</Link>
    </Column>
  );
};
