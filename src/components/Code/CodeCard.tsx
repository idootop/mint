import { Column, Row } from '@/common/components/Flex';

import styles from './styles.module.css';

export const CodeCard = ({ children }) => {
  return (
    <Column alignItems="start" className={styles.card}>
      <Row className={styles.header}>
        <div className={styles.red} />
        <div className={styles.yellow} />
        <div className={styles.green} />
      </Row>
      <pre className="hide-scrollbar">{children}</pre>
    </Column>
  );
};
