export default {
  methods: {
    updateSuggestionTranslate() {
      if (this.suggestionTranslate < 0) {
        this.suggestionTranslate = 0;
      }
      if (
        this.suggestionTranslate >
        this.$refs.suggestionItems.scrollWidth - this.$refs.suggestionItems.clientWidth
      ) {
        this.suggestionTranslate =
          this.$refs.suggestionItems.scrollWidth - this.$refs.suggestionItems.clientWidth;
      }
      this.$refs.suggestionItems.setAttribute(
        'style',
        `transform: translateX(-${this.suggestionTranslate}px)`,
      );
    },
    scrollSuggesion(e) {
      e.preventDefault();
      e.stopPropagation();
      if (!this.$refs.suggestionItems) {
        return;
      }
      this.suggestionTranslate += e.deltaY * 2.5;
      this.updateSuggestionTranslate();
    },
    enterSuggesion() {
      if (!this.$refs.suggestions) {
        return;
      }
      if (this.$refs.suggestions.scrollWidth > this.$refs.suggestions.clientWidth) {
        window.addEventListener('mousewheel', this.scrollSuggesion, {
          passive: false,
        });
      }
    },
    leaveSuggestion() {
      window.removeEventListener('mousewheel', this.scrollSuggesion, {
        passive: false,
      });
    },
    suggestionTouchStart(e) {
      this.suggestionTouchX = e.touches[0].pageX;
      e.preventDefault();
      e.stopPropagation();
    },
    suggestionTouchMove(e) {
      const diff = this.suggestionTouchX - e.touches[0].pageX;
      this.suggestionTranslate += diff * 1.625;
      this.updateSuggestionTranslate();
      this.suggestionTouchX = e.touches[0].pageX;
      e.preventDefault();
      e.stopPropagation();
    },
  },
};
