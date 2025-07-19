import Link from 'next/link';

import { Box } from '@/common/components/Box';
import { Column } from '@/common/components/Flex';
import { BannerImage } from '@/components/Image/BannerImage';
import { getOGMetadata } from '@/utils/metadata';
import { getPageLinkWithFrom, PageFrom } from '@/utils/page/from';

import { getProjectsPinned, type Project } from './_project';
import { ProjectSwitcher } from './_project/ProjectSwitcher';
import styles from './styles.module.css';

// @ts-ignore
export const metadata = await getOGMetadata({
  title: '精选项目',
});

export default async function Page() {
  return (
    <Box width="100%">
      {(await getProjectsPinned())
        .filter((e) => !e.hidden)
        .map((project, idx) => {
          return (
            <ProjectItem idx={idx} key={project.title} project={project} />
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
          <BannerImage marginBottom="0px" src={project.cover} />
        )}
      </Column>
    </Link>
  );
};
