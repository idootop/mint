import Link from 'next/link';

import { Box } from '@/common/components/Box';
import { Column } from '@/common/components/Flex';
import { BannerImage } from '@/components/Image/BannerImage';
import { getOGMetadata } from '@/utils/metadata';

import freedom from './images/freedom.png';
import future from './images/future.png';
import trending from './images/trending.png';
import styles from './styles.module.css';

// @ts-ignore
export const metadata = await getOGMetadata({
  title: '请回答 2024',
  description: '我的 2024 年度总结',
});

export default function Page() {
  return (
    <Box width="100%">
      <Item
        idx={0}
        name="PART 1 #自由"
        cover={freedom.src}
        path="/posts/2024/freedom"
      />
      <Item
        name="PART 2 #趋势"
        cover={trending.src}
        path="/posts/2024/trending"
        background="#fafbfc"
      />
      <Item name="PART 3 #未来" cover={future.src} path="/posts/2024/future" />
    </Box>
  );
}

const Item = (props: {
  idx?: number;
  path: string;
  cover: string;
  name?: string;
  background?: string;
}) => {
  const { path, cover, name, background, idx } = props;
  return (
    <Link href={path}>
      <Column
        background={background}
        className={[styles.item, idx === 0 ? styles.itemFirst : undefined]}
      >
        <span className={styles.itemTitle}>{name}</span>
        <BannerImage src={cover} marginBottom="0px" />
      </Column>
    </Link>
  );
};
