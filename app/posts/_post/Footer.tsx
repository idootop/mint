'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { Column } from '@/common/components/Flex';
import { getPageLinkWithFrom, PageFrom } from '@/utils/page/from';

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
    <Column alignItems="center" className={styles.footer}>
      {previous && <NavItem from={from} label="Previous" post={previous} />}
      {next && <NavItem from={from} label="Next" post={next} />}
    </Column>
  );
};

const NavItem = (props: { label: string; post: Post; from: PageFrom }) => {
  const { label, post, from } = props;
  const pageLink = getPageLinkWithFrom({ path: post.path, from });
  return (
    <Column className={styles.footerLink}>
      <span className={styles.footerLabel}>{label}</span>
      <Link href={pageLink}>{post.title}</Link>
    </Column>
  );
};
