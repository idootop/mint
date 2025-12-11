import { MDXBody } from '@/components/MDX/MDXBody';
import { getOGMetadata } from '@/utils/metadata';

import Content from './content.mdx';
import styles from './styles.module.css';

// @ts-expect-error
export const metadata = await getOGMetadata({
  title: '关于',
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
