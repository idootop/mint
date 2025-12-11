import { Hello } from '@/layouts/Home/Hello';
import { getOGMetadata } from '@/utils/metadata';

import { Background } from '../src/layouts/Home/Background';

// @ts-expect-error
export const metadata = await getOGMetadata({
  title: 'Del Wang',
  description: '技术极客，致力于让科技充满爱（AI）',
});

export default function Index() {
  return (
    <Background>
      <Hello />
    </Background>
  );
}
