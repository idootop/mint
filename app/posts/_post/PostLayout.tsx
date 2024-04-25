import { Suspense } from 'react';

import { BaseImage } from '@/components/Image/BaseImage';
import { MDXBody } from '@/components/MDX/MDXBody';
import { PageFrom } from '@/utils/page/type';

import { getPost, getPostContext } from '.';
import { Footer } from './Footer';
import styles from './styles.module.css';

export async function PostLayout({ path, children }) {
  const page = await getPost(path);
  if (!page) {
    return '404';
  }

  const ctx = {
    all: await getPostContext(path, { from: PageFrom.all }),
    pinned: await getPostContext(path, { from: PageFrom.pinned }),
  };

  return (
    <main className={styles.page}>
      {page.cover && <BaseImage src={page.cover} />}
      <h1 className={styles.title}>{page.title}</h1>
      <p className={styles.date}>{page.createAt}</p>
      <MDXBody>{children}</MDXBody>
      <Suspense>
        <Footer ctx={ctx} />
      </Suspense>
    </main>
  );
}
