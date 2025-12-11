import Link from 'next/link';

import { Column } from '@/common/components/Flex';
import { getOGMetadata } from '@/utils/metadata';
import { PageFrom } from '@/utils/page/from';

import {
  getProjectCategoryName,
  getProjectsGroupedByCategory,
  type Project,
} from '../_project';
import { ProjectSwitcher } from '../_project/ProjectSwitcher';
import styles from './styles.module.css';

// @ts-expect-error
export const metadata = await getOGMetadata({
  title: '全部项目',
});

export default async function Page() {
  return (
    <Column className={styles.page}>
      {(await getProjectsGroupedByCategory()).map((e) => {
        const projects = e.projects.filter((e) => !e.hidden);
        return (
          projects.length > 0 && (
            <GroupedProject
              group={e.category}
              key={e.category}
              projects={projects}
            />
          )
        );
      })}
      <ProjectSwitcher from={PageFrom.all} />
    </Column>
  );
}

const GroupedProject = (props: { group: string; projects: Project[] }) => {
  const { group, projects } = props;
  if (projects.length < 1) return;
  const groupName = getProjectCategoryName(group);
  return (
    <Column alignItems="start" className={styles.group}>
      <span className={styles.groupTitle} id={group}>
        {groupName}
      </span>
      {projects.map((project) => {
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
      <span>
        <span className={styles.title}>
          {project.emoji} {project.title}
        </span>
        <span className={styles.date}>{projectDate}</span>
        <br />
        <span className={styles.description}>{project.description}</span>
      </span>
    </Link>
  );
};
