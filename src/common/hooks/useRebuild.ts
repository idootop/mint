import { useRef, useState } from 'react';

export const useRebuild = () => {
  const [flag, setFlag] = useState(false);
  return () => setFlag(!flag);
};

export const useRebuildRef = () => {
  const ref = useRef<VoidFunction>(() => 0);
  ref.current = useRebuild();
  return ref;
};
