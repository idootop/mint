'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { Column } from '@/common/components/Flex';
import { getPageLinkWithFrom, PageFrom } from '@/utils/page/from';

import type { Project, ProjectContext } from '.';
import styles from './styles.module.css';

export const Footer = ({
  ctx,
}: {
  ctx: {
    all: ProjectContext;
    pinned: ProjectContext;
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
      {previous && <NavItem label="Previous" project={previous} from={from} />}
      {next && <NavItem label="Next" project={next} from={from} />}
    </Column>
  );
};

const NavItem = (props: {
  label: string;
  project: Project;
  from: PageFrom;
}) => {
  const { label, project, from } = props;
  const pageLink = getPageLinkWithFrom({ path: project.path, from });
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
      <Link href={pageLink}>{project.title}</Link>
    </Column>
  );
};