import Link from 'next/link';

import { Box } from '@/common/components/Box';
import { Column } from '@/common/components/Flex';
import { BannerImage } from '@/components/Image/BannerImage';

import styles from './styles.module.css';

export function AnnualSummary({
  items,
}: {
  items: {
    name: string;
    path: string;
    cover: string;
  }[];
}) {
  return (
    <Box width="100%">
      {items.map((e) => (
        <Item
          cover={e.cover}
          idx={0}
          key={e.path}
          name={e.name}
          path={e.path}
        />
      ))}
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
        <BannerImage marginBottom="0px" src={cover} />
      </Column>
    </Link>
  );
};
