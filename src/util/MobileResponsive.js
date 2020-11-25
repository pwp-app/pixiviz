export default {
  getCardWidth(width) {
    if (width >= 768) {
      return 280;
    } else if (width >= 414 && width < 768) {
      return 175;
    } else if (width >= 376 && width < 414) {
      return 170;
    } else if (width >= 361 && width < 376) {
      return 154;
    } else if (width >= 321 && width < 361) {
      return 144;
    } else if (width < 321) {
      return 128;
    }
  }
}