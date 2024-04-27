import Link from 'next/link';

import { Column, Expand, Row } from '@/common/components/Flex';

import {
  getProjectCategoryName,
  getProjectsGroupedByCategory,
  Project,
} from '../_project';
import styles from './styles.module.css';

export default async function Page() {
  return (
    <Column className={styles.page}>
      {(await getProjectsGroupedByCategory()).map(e => {
        const projects = e.projects.filter(e => !e.hidden);
        return (
          projects.length > 0 && (
            <GroupedProject
              key={e.category}
              group={getProjectCategoryName(e.category)}
              projects={projects}
            />
          )
        );
      })}
    </Column>
  );
}

const GroupedProject = (props: { group: string; projects: Project[] }) => {
  const { group, projects } = props;
  if (projects.length < 1) return;
  return (
    <Column
      className={styles.year}
      alignItems="start"
      style={{
        width: '100%',
        padding: '20px',
        background: '#fff',
        borderRadius: '2px',
        boxShadow: '0 1px 2px -1px rgba(0, 0, 0, 0.08)',
      }}
    >
      <span
        style={{
          fontSize: '18px',
          fontWeight: '600',
          color: 'rgba(0, 0, 0, 0.3)',
        }}
      >
        {group}
      </span>
      {projects.map(project => {
        return <ProjectItem key={project.path} project={project} />;
      })}
    </Column>
  );
};

const ProjectItem = (props: { project: Project }) => {
  const { project } = props;
  const projectLink = project.path;
  const projectDate = project.createAt;
  return (
    <Link
      className={styles.project}
      href={projectLink}
      style={{
        width: '100%',
      }}
    >
      <Row alignItems="center" width="100%">
        <Expand marginRight="10px">
          <span
            className={styles.title}
            style={{
              fontSize: '18px',
              color: '#000',
            }}
          >
            {project.title}
          </span>
        </Expand>
        <span
          style={{
            fontSize: '15px',
            fontWeight: '400',
            color: 'rgba(0, 0, 0, 0.3)',
          }}
        >
          {projectDate}
        </span>
      </Row>
    </Link>
  );
};
