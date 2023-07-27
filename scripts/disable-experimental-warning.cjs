/* eslint-disable */
// https://stackoverflow.com/a/73525885
const originalEmit = process.emit;
process.emit = (event, error) => {
  if (
    event === 'warning' &&
    error.name === 'ExperimentalWarning' &&
    error.message.includes('Custom ESM Loaders')
  ) {
    return false;
  }
  return originalEmit.apply(process, arguments);
};
