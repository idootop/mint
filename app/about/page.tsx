import { kBodyHeight } from '@/layouts/sizes';
import { getOGMetadata } from '@/utils/metadata';

import { PoolDuckLazy } from './components/PoolDuckLazy';
import bio from './images/bio.svg';
import del from './images/del.svg';
import styles from './styles.module.css';

// @ts-expect-error
export const metadata = await getOGMetadata({
  path: '/about',
  title: '关于',
});

const Page = () => {
  return (
    <main className={styles.page}>
      <PoolDuckLazy />
      <div className={styles.bg} id="about-bg" />
      <div
        className={styles.box}
        id="about-box"
        style={{ height: kBodyHeight }}
      >
        <img id="bio" src={bio.src} />
        <img id="del" src={del.src} />
      </div>
      {/* <MDXBody>
        <Content />
      </MDXBody> */}
    </main>
  );
};

export default Page;
