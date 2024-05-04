import { Suspense } from 'react';

import { Button } from '@/components/Button';
import { IconGithub } from '@/components/Icon/IconGithub';
import { IconOpenLink } from '@/components/Icon/IconOpenLink';
import { BaseImage } from '@/components/Image/BaseImage';
import { MDXBody } from '@/components/MDX/MDXBody';
import { PageFrom } from '@/utils/page/from';

import { getProject, getProjectCategoryName, getProjectContext } from '.';
import { Footer } from './Footer';
import styles from './styles.module.css';

export async function ProjectLayout({ path, children }) {
  const project = await getProject(path);
  if (!project) {
    return '404';
  }

  const ctx = {
    all: await getProjectContext(path, { from: PageFrom.all }),
    pinned: await getProjectContext(path, { from: PageFrom.pinned }),
  };

  const category = getProjectCategoryName(project.category);

  const buttons =
    !!project.preview && !!project.source ? (
      <>
        <Button
          id={styles.button}
          url={project.preview}
          width="100%"
          height="48px"
          color="#fff"
        >
          <IconOpenLink size="20px" color="#fff" />
          查看
        </Button>
        <Button
          id={styles.button}
          secondary
          url={project.source}
          width="100%"
          height="48px"
          color="#000"
        >
          <IconGithub size="20px" />
          源码
        </Button>
      </>
    ) : project.preview ? (
      <Button
        id={styles.button}
        secondary
        url={project.preview}
        width="100%"
        height="48px"
        color="#000"
      >
        <IconOpenLink size="20px" />
        查看
      </Button>
    ) : project.source ? (
      <Button
        id={styles.button}
        secondary
        url={project.source}
        width="100%"
        height="48px"
        color="#000"
      >
        <IconGithub size="20px" />
        源码
      </Button>
    ) : undefined;

  return (
    <main className={styles.page}>
      <MDXBody>
        <>
          {project.cover && <BaseImage src={project.cover} marginBottom="0" />}
          <p className={styles.title}>{project.title}</p>
          <p className={styles.date}>
            {project.createAt}｜{category}
          </p>
          <blockquote className={styles.description}>
            {project.description}
          </blockquote>
          {buttons}
          {children}
        </>
      </MDXBody>
      <Suspense>
        <Footer ctx={ctx} />
      </Suspense>
    </main>
  );
}
