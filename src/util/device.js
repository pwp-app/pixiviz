export const isWeChat = () => {
  return /MicroMessenger/i.test(navigator.userAgent);
};

export const isMqq = () => {
  return /QQ\//i.test(navigator.userAgent);
};
