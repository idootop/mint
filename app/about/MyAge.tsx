'use client';

import { useEffect, useState } from 'react';

const kMyBirthday = new Date(1999, 7 - 1, 14).getTime();
const kOneYear = 365 * 24 * 60 * 60 * 1000;
const myAge = () => (Date.now() - kMyBirthday) / kOneYear;

export const MyAge = () => {
  const [age, setAge] = useState(Math.floor(myAge()));
  useEffect(() => {
    const timer = setInterval(() => {
      setAge(myAge());
    }, 100);
    return () => {
      clearInterval(timer);
    };
  }, []);
  return <span>{age.toFixed(12)}</span>;
};
