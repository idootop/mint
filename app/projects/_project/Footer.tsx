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
    <Column alignItems="center" className={styles.footer}>
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
    <Column className={styles.footerLink}>
      <span className={styles.footerLabel}>{label}</span>
      <Link href={pageLink}>{project.title}</Link>
    </Column>
  );
};
