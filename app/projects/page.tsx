import Link from 'next/link';

import { Box } from '@/common/components/Box';
import { Column } from '@/common/components/Flex';
import { BannerImage } from '@/components/Images/BannerImage';

import { getProjectsSortedByCategory, Project } from './_project';

export default async function Page() {
  return (
    <Box width="100%">
      {(await getProjectsSortedByCategory()).map((project, idx) => {
        return (
          <ProjectItem
            key={project.title}
            project={project}
            background={idx % 2 !== 0 ? '#fafbfc' : '#fff'}
          />
        );
      })}
    </Box>
  );
}

const ProjectItem = async (props: { project: Project; background: string }) => {
  const { project, background } = props;
  return (
    <Link
      href={project.path}
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
