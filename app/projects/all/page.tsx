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
    <Column className={styles.group} alignItems="start">
      <span className={styles.groupTitle}>{group}</span>
      {projects.map(project => {
        return <ProjectItem key={project.path} project={project} />;
      })}
    </Column>
  );
};

const ProjectItem = (props: { project: Project }) => {
  const { project } = props;
  const projectLink = project.path;
  const projectDate = project.createAt.replaceAll('-', '.');
  return (
    <Link className={styles.item} href={projectLink}>
      <Row alignItems="center" width="100%">
        <Expand marginRight="10px">
          <span className={styles.title}>{project.title}</span>
        </Expand>
        <span className={styles.date}>{projectDate}</span>
      </Row>
    </Link>
  );
};
