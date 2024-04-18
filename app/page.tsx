import { Hello } from '@/layouts/Home/Hello';

import { Background } from '../src/layouts/Home/Background';

export default function Index() {
  return (
    <Background>
      <Hello />
    </Background>
  );
}
