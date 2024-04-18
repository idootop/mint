export const CardText = props => {
  return (
    <h1
      {...props}
      style={{
        ...props.style,
        color: '#fff',
        background: '#000',
        padding: '10px 20px',
        boxShadow: '0px 10px 10px 0px rgba(0, 0, 0, 0.20)',
        transition: 'opacity 500ms ease',
      }}
    />
  );
};
