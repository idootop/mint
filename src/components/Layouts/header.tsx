'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Expand, Row } from '@/core/components/Flex';

import { IconGithub, IconLogo } from '../Icons';
import { kHeaderHeight, kPageMaxWidth, kPagePadding } from './sizes';
import styles from './styles.module.css';

export const Header = () => {
  return (
    <header className={styles.header}>
      <Row
        style={{
          margin: '0 auto',
          padding: `0 ${kPagePadding}px`,
          height: kHeaderHeight,
          maxWidth: kPageMaxWidth,
        }}
      >
        <Link href="/">
          <IconLogo
            style={{
              borderRadius: '50%',
            }}
          />
        </Link>
        <Expand width="100%" alignItems="center" justifyContent="center">
          <LinkItem href="/">首页</LinkItem>
          <LinkItem href="/posts">博客</LinkItem>
          <LinkItem href="/about">关于</LinkItem>
        </Expand>
        <Link
          className={styles.github}
          href="https://github.com/idootop"
          target="_blank"
        >
          <IconGithub />
        </Link>
      </Row>
    </header>
  );
};

const LinkItem = (props: { href: string; children: any }) => {
  const { href, children } = props;
  const currentPath = usePathname() ?? '';
  const active =
    href === '/' ? currentPath === '/' : currentPath.startsWith(href);
  return (
    <Link
      className={styles.link}
      href={href}
      style={{
        fontSize: '16px',
        color: !active ? 'rgba(0, 0, 0, 0.3)' : undefined,
        fontWeight: active ? '500' : undefined,
      }}
    >
      {children}
    </Link>
  );
};
