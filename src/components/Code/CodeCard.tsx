import { Column, Row } from '@/core/components/Flex';

import styles from './styles.module.css';

export const CodeCard = ({ children }) => {
  return (
    <Column className={styles.card} alignItems="start">
      <Row className={styles.header}>
        <div className={styles.red} />
        <div className={styles.yellow} />
        <div className={styles.green} />
      </Row>
      <pre>{children}</pre>
    </Column>
  );
};
