import { BoxProps } from '@/core/components/Box';

import { BaseImage } from './BaseImage';
import styles from './styles.module.css';

export const BannerImage = (
  props: { outerStyle?: any; innerStyle?: any } & BoxProps,
) => {
  const { outerStyle, innerStyle, ...imgProps } = props as any;
  return (
    <div className={styles.outer} style={{ ...outerStyle }}>
      <div
        className={styles.inner}
        style={{ maxWidth: '960px', ...innerStyle }}
      >
        <BaseImage
          {...imgProps}
          style={{
            maxHeight: '540px',
            ...imgProps.style,
          }}
        />
      </div>
    </div>
  );
};
