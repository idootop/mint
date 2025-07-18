export const CardText = (props) => {
  return (
    <h1
      {...props}
      style={{
        ...props.style,
        color: '#fff',
        background: '#000',
        padding: '10px 20px',
      }}
    />
  );
};
