'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Expand, Row } from '@/common/components/Flex';

import { IconGithub, IconLogo } from '../components/Icon';
import { kHeaderHeight, kPageMaxWidth, kPagePadding } from './sizes';
import styles from './styles.module.css';

export const Header = () => {
  const currentPath = usePathname() ?? '';
  const isHome = currentPath === '/';
  return (
    <>
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
          <Expand width="100%" justifyContent="center">
            <LinkItem href="/projects">项目</LinkItem>
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
      <div
        style={{
          height: isHome ? 0 : kHeaderHeight,
        }}
      ></div>
    </>
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
        fontWeight: active ? 'bold' : undefined,
      }}
    >
      {children}
    </Link>
  );
};
