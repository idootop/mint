import { MDXBody } from '@/components/MDX/MDXBody';
import { getOGMetadata } from '@/utils/metadata';

import Content from './content.mdx';
import me from './me.webp';
import styles from './styles.module.css';

// @ts-ignore
export const metadata = await getOGMetadata({
  title: '关于｜Del Wang',
  description: '热爱当下，创造未来',
  image: me.src,
});

const Page = () => {
  return (
    <main className={styles.page}>
      <MDXBody>
        <Content />
      </MDXBody>
    </main>
  );
};

export default Page;
