export default {
  computed: {
    dialogWidth() {
      if (this.screenWidth <= 320) {
        return '308px';
      } else if (this.screenWidth < 768) {
        return '320px';
      } else {
        return '480px';
      }
    },
  },
};
