export const isWeChat = () => {
  return /MicroMessenger/i.test(window.navigator.userAgent);
};
