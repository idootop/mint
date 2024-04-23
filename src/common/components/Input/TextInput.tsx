import { forwardRef } from 'react';

import { BoxProps, getBoxProps } from '../Box';
import styles from './style.module.css';

interface TextInputProps {
  value?: string;
  hint?: string;
  onChange?: (input: string) => void;
  onSubmit?: (input: string) => void;
}

const TextInput = forwardRef((props: BoxProps & TextInputProps, ref: any) => {
  const { value, hint = '', onChange, onSubmit } = props ?? {};

  const boxProps = getBoxProps({
    ...props,
    excludes: ['value', 'hint', 'onChange', 'onSubmit'],
  });

  return (
    <input
      ref={ref}
      {...boxProps}
      className={styles['text-input']}
      value={value}
      placeholder={hint}
      onKeyDown={(event: any) => {
        if (event.key === 'Enter') {
          const str = event.target.value;
          onSubmit?.(str);
        }
      }}
      onChange={(event: any) => {
        const str = event.target.value;
        onChange?.(str);
      }}
    />
  );
});

TextInput.displayName = 'TextInput';

export { TextInput };
