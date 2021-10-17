export default {
  getCardWidth(width) {
    if (width >= 768) {
      return 280;
    } else {
      return (document.documentElement.clientWidth - 64) / 2;
    }
  },
};
