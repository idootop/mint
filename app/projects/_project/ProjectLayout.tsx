import Link from 'next/link';

import { Column } from '@/common/components/Flex';
import { BaseImage } from '@/components/Images/BaseImage';
import { MDXBody } from '@/components/MDX/MDXBody';

import { getProjectContext, Project } from '.';
import styles from './styles.module.css';

export async function ProjectLayout({ path, children }: any) {
  const { current, previous, next } = await getProjectContext(path);
  if (!current) {
    return '404';
  }

  return (
    <main className={styles.page}>
      {current.cover && <BaseImage src={current.cover} />}
      <h1 className={styles.title}>{current.title}</h1>
      <p className={styles.date}>{current.createAt}</p>
      <MDXBody>{children}</MDXBody>
      <Footer previous={previous} next={next} />
    </main>
  );
}

const Footer = (props: { previous?: Project; next?: Project }) => {
  const { previous, next } = props;
  return (
    <Column
      alignItems="center"
      style={{
        width: '100%',
        padding: '24px',
        background: '#161616',
      }}
    >
      {previous && <NavItem label="Previous" project={previous} />}
      {next && <NavItem label="Next" project={next} />}
    </Column>
  );
};

const NavItem = (props: { label: string; project: Project }) => {
  const { label, project } = props;
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
      <Link href={project.path}>{project.title}</Link>
    </Column>
  );
};
