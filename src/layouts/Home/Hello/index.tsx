import { Center } from '@/common/components/Flex';

import styles from './styles.module.css';

export const Hello = () => {
  return (
    <Center height="100%">
      <h1 className={styles.hello}>你好</h1>
    </Center>
  );
};
