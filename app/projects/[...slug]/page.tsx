import { allProjects, Project } from 'contentlayer/generated';
import { Metadata } from 'next';
import Link from 'next/link';

import { Column } from '@/core/components/Flex';
import { MDXBody } from '@/src/components/MDX/MDXBody';
import { getOGMetadata } from '@/src/utils/site-metadata';

import {
  getNextProject,
  getProject,
  ProjectProps,
} from '../allProjectsByCategory';
import styles from './styles.module.css';

export async function generateMetadata({ params }): Promise<Metadata> {
  const project = await getProject(params);
  if (!project) return {};
  return {
    title: project.title,
    description: project.description,
    ...(await getOGMetadata({
      title: project.title,
      description: project.description,
      image: project.cover,
    })),
  };
}

export async function generateStaticParams() {
  return allProjects.map(project => ({
    slug: project.slugAsParams.split('/'),
  }));
}

export default function ProjectPage({ params }: ProjectProps) {
  const { project, previous, next } = getNextProject(params);

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>{project.title}</h1>
      <p className={styles.date}>{project.date}</p>
      <MDXBody>{project.body.code}</MDXBody>
      <ProjectFooter previous={previous} next={next} />
    </main>
  );
}

const ProjectFooter = (props: { previous?: Project; next?: Project }) => {
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
      <Link href={project.slug}>{project.title}</Link>
    </Column>
  );
};
