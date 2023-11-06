import { kFooterHeight, kPageMaxWidth } from './sizes';

export const Footer = () => {
  return (
    <footer
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        margin: '0 auto',
        maxWidth: kPageMaxWidth,
        height: kFooterHeight,
        fontSize: '14px',
        color: 'rgba(0, 0, 0, 0.4)',
      }}
    >
      © {new Date().getFullYear()} 乂乂又又. All rights reserved.
    </footer>
  );
};
