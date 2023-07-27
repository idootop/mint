import { BaseImage } from './BaseImage';
import styles from './styles.module.css';

export const BannerImage = (props: { src: string; alt?: string }) => {
  const { src, alt } = props;

  return (
    <div className={styles.outer}>
      <div className={styles.inner}>
        <BaseImage src={src} alt={alt} />
      </div>
    </div>
  );
};
