import { kBodyHeight } from '@/layouts/sizes';
import { getOGMetadata } from '@/utils/metadata';

import PoolDuck from './components/PoolDuck';
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
      {/* 原生 WebGL2 引擎只有 ~13KB，直接随路由 chunk 加载，
          不再走 next/dynamic，避免引擎要等 hydration 才开始下载 */}
      <PoolDuck />
      <div className={styles.bg} />
      <div className={styles.box} style={{ height: kBodyHeight }}>
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
