import Link from 'next/link';

import { Box } from '@/common/components/Box';
import { Column } from '@/common/components/Flex';
import { BannerImage } from '@/components/Image/BannerImage';
import { getPageLinkWithFrom, PageFrom } from '@/utils/page/from';

import { getProjectsPinned, Project } from './_project';
import { ProjectSwitcher } from './_project/ProjectSwitcher';
import styles from './styles.module.css';

export default async function Page() {
  return (
    <Box width="100%">
      {(await getProjectsPinned())
        .filter(e => !e.hidden)
        .map((project, idx) => {
          return (
            <ProjectItem key={project.title} idx={idx} project={project} />
          );
        })}
      <ProjectSwitcher from={PageFrom.pinned} />
    </Box>
  );
}

const ProjectItem = async (props: { project: Project; idx: number }) => {
  const { project, idx } = props;
  const background = idx % 2 !== 0 ? '#fafbfc' : '#fff';
  const projectLink = getPageLinkWithFrom({
    path: project.path,
    from: PageFrom.pinned,
  });
  return (
    <Link href={projectLink}>
      <Column
        background={background}
        className={[
          styles.project,
          idx === 0 ? styles.projectFirst : undefined,
        ]}
      >
        <span className={styles.projectTitle}>
          {project.emoji} {project.title}
        </span>
        <span className={styles.projectDescription}>{project.description}</span>
        {project.cover && (
          <BannerImage src={project.cover} marginBottom="0px" />
        )}
      </Column>
    </Link>
  );
};
