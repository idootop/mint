'use client';

import { useEffect, useRef } from 'react';

import { Center } from '@/common/components/Flex';
import { sleep } from '@/common/utils/base';

import { hellos } from './hello';
import styles from './styles.module.css';

export const Hello = () => {
  const initRef = useRef(0);
  useEffect(() => {
    initRef.current = initRef.current + 1;
    const currentInit = initRef.current;

    let timer;
    let languageIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    async function type() {
      if (initRef.current !== currentInit) {
        return;
      }
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
