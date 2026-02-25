import { AnnualSummary } from '@/layouts/AnnualSummary';
import { getOGMetadata } from '@/utils/metadata';

import freedom from './images/freedom.png';
import future from './images/future.png';
import trending from './images/trending.png';

// @ts-expect-error
export const metadata = await getOGMetadata({
  path: '/2024',
  title: '请回答 2024',
  description: '我的 2024 年度总结',
});

export default function Page() {
  return (
    <AnnualSummary
      items={[
        {
          name: 'PART 1 #自由',
          path: '/posts/2024/freedom',
          cover: freedom.src,
        },
        {
          name: 'PART 2 #趋势',
          path: '/posts/2024/trending',
          cover: trending.src,
        },
        {
          name: 'PART 3 #未来',
          path: '/posts/2024/future',
          cover: future.src,
        },
      ]}
    />
  );
}
