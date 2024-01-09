import { BaseImage } from './BaseImage';
import styles from './styles.module.css';

export const BannerImage = props => {
  return (
    <div className={styles.outer}>
      <div className={styles.inner}>
        <BaseImage
          {...props}
          style={{
            ...props.style,
            maxHeight: '576px',
          }}
        />
      </div>
    </div>
  );
};
