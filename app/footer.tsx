export const Footer = () => {
  return (
    <footer
      style={{
        width: '100%',
        padding: '20px',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '14px',
        color: 'rgba(0, 0, 0, 0.4)',
      }}
    >
      © {new Date().getFullYear()} Del
    </footer>
  );
};
