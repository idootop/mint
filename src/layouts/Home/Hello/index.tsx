'use client';

import { Center } from '@/common/components/Flex';
import { useEffectSafely } from '@/common/hooks/useEffectSafely';
import { sleep } from '@/common/utils/base';

import { hellos } from './hello';
import styles from './styles.module.css';

export const Hello = () => {
  useEffectSafely(isDisposed => {
    let timer;
    let languageIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    async function type() {
      const text = hellos[languageIndex];
      const speed = isDeleting ? 50 : 150;

      if (!isDeleting && charIndex === text.length) {
        setTimeout(() => {
          isDeleting = true;
        }, 1000);
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        languageIndex = (languageIndex + 1) % hellos.length;
        await sleep(200);
      }

      if (isDisposed()) {
        return;
      }

      const e = document.getElementsByClassName(styles['hello'])[0].children[0];
      e.textContent = isDeleting
        ? text.substring(0, charIndex - 1)
        : text.substring(0, charIndex + 1);

      charIndex += isDeleting ? -1 : 1;
      timer = setTimeout(type, speed);
    }

    type();

    return () => {
      clearTimeout(timer);
    };
  }, []);
  return (
    <Center height="100%">
      <div className={styles.hello}>
        <span />
        <div />
      </div>
    </Center>
  );
};
