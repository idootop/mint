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
          color="#fff"
          height="48px"
          id={styles.button}
          url={project.preview}
          width="100%"
        >
          <IconOpenLink color="#fff" size="20px" />
          查看
        </Button>
        <Button
          color="#000"
          height="48px"
          id={styles.button}
          secondary
          url={project.source}
          width="100%"
        >
          <IconGithub size="20px" />
          源码
        </Button>
      </>
    ) : project.preview ? (
      <Button
        color="#000"
        height="48px"
        id={styles.button}
        secondary
        url={project.preview}
        width="100%"
      >
        <IconOpenLink size="20px" />
        查看
      </Button>
    ) : project.source ? (
      <Button
        color="#000"
        height="48px"
        id={styles.button}
        secondary
        url={project.source}
        width="100%"
      >
        <IconGithub size="20px" />
        源码
      </Button>
    ) : undefined;

  return (
    <main className={styles.page}>
      <MDXBody>
        {project.cover && <BaseImage marginBottom="0" src={project.cover} />}
        <p className={styles.title}>{project.title}</p>
        <p className={styles.date}>
          {project.createAt}｜{category}
        </p>
        <blockquote className={styles.description}>
          {project.description}
        </blockquote>
        {buttons}
        {children}
      </MDXBody>
      <Suspense>
        <Footer ctx={ctx} />
      </Suspense>
    </main>
  );
}
