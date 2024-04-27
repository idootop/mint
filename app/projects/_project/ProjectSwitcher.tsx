import { Row } from '@/common/components/Flex';
import { PageFrom } from '@/utils/page/from';

import styles from './styles.module.css';

export const ProjectSwitcher = ({ from }: { from: PageFrom }) => {
  return (
    <Row className={styles.switcher}>
      <a
        href="/projects"
        className={styles.switcherOption}
        style={{
          color: from === PageFrom.pinned ? '#fff' : '#000',
          background: from === PageFrom.pinned ? '#000' : 'transparent',
        }}
      >
        Pinned
      </a>
      <a
        href="/projects/all"
        className={styles.switcherOption}
        style={{
          color: from === PageFrom.all ? '#fff' : '#000',
          background: from === PageFrom.all ? '#000' : 'transparent',
        }}
      >
        All
      </a>
    </Row>
  );
};
