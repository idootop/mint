import { AnnualSummary } from '@/layouts/AnnualSummary';
import { getOGMetadata } from '@/utils/metadata';

import cover from './2025.webp';

// @ts-expect-error
export const metadata = await getOGMetadata({
  path: '/2025',
  title: '请回答 2025',
  description: '我的 2025 年度总结',
  image: cover.src,
});

export default function Page() {
  return (
    <AnnualSummary
      items={[
        {
          name: 'PART 1 #动荡',
          path: '/posts/2025/year-end-review',
          cover: cover.src,
        },
      ]}
    />
  );
}
