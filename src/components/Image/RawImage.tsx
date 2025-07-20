import type { ComponentPropsWithoutRef } from 'react';

export const RawImage = (props: ComponentPropsWithoutRef<'img'>) => {
  return props.src && <img {...props} />;
};
