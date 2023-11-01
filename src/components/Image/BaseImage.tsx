/* eslint-disable @next/next/no-img-element */

import { isNotEmpty } from '@/core/utils/is';

import styles from './styles.module.css';

interface ImageProps {
  src?: string;
  alt?: string;
}

export const BaseImage = (props: ImageProps) => {
  const { src, alt } = props;

  return (
    <>
      <img src={src} alt={alt} className={styles.center_image} />
      {isNotEmpty(alt) && <span className={styles.center_label}>{alt}</span>}
      <p />
    </>
  );
};
