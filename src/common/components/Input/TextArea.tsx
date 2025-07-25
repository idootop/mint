import { forwardRef, useEffect, useRef } from 'react';

import { clamp } from '../../utils/base';
import { type BoxProps, getBoxProps } from '../Box';
import styles from './style.module.css';

interface TextAreaProps {
  rows?: number;
  maxLines?: number;
  lineHeight?: number;
  value?: string;
  hint?: string;
  onChange?: (input: string) => void;
  onSubmit?: (input: string) => void;
}

const TextArea = forwardRef((props: BoxProps & TextAreaProps, ref: any) => {
  const {
    value = '',
    hint = '',
    rows = 1,
    maxLines,
    lineHeight = 20,
    onChange,
    onSubmit,
  } = props ?? {};

  const boxProps = getBoxProps({
    ...props,
    style: {
      ...props.style,
      lineHeight: `${lineHeight}px`,
    },
    excludes: [
      'rows',
      'maxLines',
      'lineHeight',
      'value',
      'hint',
      'onChange',
      'onSubmit',
    ],
  });

  const _ref = useRef<HTMLTextAreaElement>(null);
  const inputRef = ref ?? _ref;

  const updateInputHeight = () => {
    if (!maxLines) return;
    if (!inputRef.current) return;
    const minHeight = rows * lineHeight;
    const maxHeight = maxLines * lineHeight;
    if (inputRef.current.value === '\n') {
      inputRef.current.value = '';
      inputRef.current.style.height = 'auto';

      return;
    }
    inputRef.current.style.height = 'auto';
    const height = inputRef.current.scrollHeight;
    inputRef.current.style.height = `${clamp(height, minHeight, maxHeight)}px`;
  };

  useEffect(() => {
    const timer = setInterval(() => {
      updateInputHeight();
    }, 100);

    return clearInterval(timer);
  }, [updateInputHeight]);

  return (
    <textarea
      ref={inputRef}
      rows={1}
      {...boxProps}
      className={styles['text-area']}
      onChange={(event: any) => {
        updateInputHeight();
        const str = event.target.value;
        onChange?.(str);
      }}
      onKeyDown={(event: any) => {
        if (event.key === 'Enter') {
          updateInputHeight();
          const str = event.target.value;
          onSubmit?.(str);
        }
      }}
      placeholder={hint}
      value={value === '\n' ? '' : value}
    />
  );
});

TextArea.displayName = 'TextArea';

export { TextArea };
