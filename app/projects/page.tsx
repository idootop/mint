import Link from 'next/link';

import { Box } from '@/common/components/Box';
import { Column } from '@/common/components/Flex';
import { BannerImage } from '@/components/Image/BannerImage';
import { getPageLinkWithFrom, PageFrom } from '@/utils/page/from';

import { getProjectsPinned, Project } from './_project';
import { ProjectSwitcher } from './_project/ProjectSwitcher';

export default async function Page() {
  return (
    <Box width="100%">
      {(await getProjectsPinned())
        .filter(e => !e.hidden)
        .map((project, idx) => {
          return (
            <ProjectItem
              key={project.title}
              project={project}
              background={idx % 2 !== 0 ? '#fafbfc' : '#fff'}
            />
          );
        })}
      <ProjectSwitcher from={PageFrom.pinned} />
    </Box>
  );
}

const ProjectItem = async (props: { project: Project; background: string }) => {
  const { project, background } = props;
  const projectLink = getPageLinkWithFrom({
    path: project.path,
    from: PageFrom.pinned,
  });
  return (
    <Link
      href={projectLink}
      style={{
        width: '100%',
      }}
    >
      <Column
        alignItems="center"
        width="100%"
        padding="64px 20px"
        background={background}
        borderBottom="1px solid #eaeaea"
        gap="4px"
      >
        <span
          style={{
            fontSize: '32px',
            fontWeight: '600',
            color: '#000',
          }}
        >
          {project.title}
        </span>
        <span
          style={{
            fontSize: '14px',
            fontWeight: '400',
            color: '#000',
            textAlign: 'center',
          }}
        >
          {project.description}
        </span>
        <span
          style={{
            fontSize: '64px',
            fontWeight: '400',
            marginRight: '8px',
            color: '#000',
          }}
        >
          {project.emoji}
        </span>
        {project.cover && <BannerImage src={project.cover} marginTop="24px" />}
      </Column>
    </Link>
  );
};
