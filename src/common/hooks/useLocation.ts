import { useEffect, useState } from 'react';

export function useLocation(): Location | undefined {
  const [location, setLocation] = useState<any>();
  useEffect(() => {
    setLocation(window.location);
  }, []);
  return location;
}
