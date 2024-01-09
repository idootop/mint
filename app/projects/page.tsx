import { Project } from 'contentlayer/generated';
import Link from 'next/link';

import { Box } from '@/core/components/Box';
import { Column } from '@/core/components/Flex';
import { processImage } from '@/scripts/rehype-image-process';
import { BannerImage } from '@/src/components/Images/BannerImage';

import { allProjectsSorted } from './allProjectsByCategory';

export default function Page() {
  return (
    <Box width="100%">
      {allProjectsSorted.map((project, idx) => {
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
      href={project.slug}
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
        {project.cover && (
          <BannerImage
            {...await processImage(project.cover)}
            marginTop="24px"
          />
        )}
      </Column>
    </Link>
  );
};
