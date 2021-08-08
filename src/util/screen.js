export const getScreenOrientationType = () => {
  return window.matchMedia('(orientation: portrait)').matches ? 'portrait' : 'landscape';
};
