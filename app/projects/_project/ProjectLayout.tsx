import { Suspense } from 'react';

import { Row } from '@/common/components/Flex';
import { Button } from '@/components/Button';
import { IconGithub } from '@/components/Icon/IconGithub';
import { BaseImage } from '@/components/Image/BaseImage';
import { MDXBody } from '@/components/MDX/MDXBody';
import { PageFrom } from '@/utils/page/from';

import { getProject, getProjectContext } from '.';
import { Footer } from './Footer';
import styles from './styles.module.css';

export async function ProjectLayout({ path, children }) {
  const page = await getProject(path);
  if (!page) {
    return '404';
  }

  const ctx = {
    all: await getProjectContext(path, { from: PageFrom.all }),
    pinned: await getProjectContext(path, { from: PageFrom.pinned }),
  };

  return (
    <main className={styles.page}>
      {page.cover && (
        <BaseImage src={page.cover} marginTop="10px" marginBottom="0" />
      )}
      <h1 className={styles.title}>{page.title}</h1>
      <p className={styles.date}>{page.createAt}</p>
      <Row width="100%" justifyContent="center" gap="20px" padding="20px">
        <Button secondary url={page.source} disabled={!page.source}>
          <IconGithub />
          源代码
        </Button>
        <Button url={page.preview} disabled={!page.preview}>
          👀 预览
        </Button>
      </Row>
      <MDXBody>{children}</MDXBody>
      <Suspense>
        <Footer ctx={ctx} />
      </Suspense>
    </main>
  );
}
