import sensitiveWords from '../resources/sensitiveWords.json';

export const getSensitiveWords = () => {
  return sensitiveWords.map((item) => decodeURIComponent(atob(item)));
};
