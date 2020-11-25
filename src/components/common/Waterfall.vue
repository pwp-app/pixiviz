<template>
  <div class="waterfall-container" ref="container" :style="{
			height: `${maxHeight || 0}px`,
		}">
    <ImageCard class="waterfall-item"
      v-for="item in displayImages"
			:key="item.index" :image="item"
      :cardWidth="cardWidth" :imageType="imageType"
			:position="positionMap[item.index]"
      @clicked="handleCardClicked"/>
  </div>
</template>

<script>
import ImageCard from './ImageCard';

// 瀑布流可视区额外距离
const ADDITIONAL_DISTANCE = 500;

export default {
  name: 'Common.Waterfall',
  props: {
    images: {
      type: Array,
    },
    cardWidth: {
      type: Number,
    },
    imageType: {
      type: String,
    },
    squaredImage: {
      type: Boolean,
      default: false
		},
		gap: {
			type: Number,
			default: 16,
		},
		rowsPerSection: {
			type: Number,
			default: 3,
		},
  },
  components: {
    ImageCard,
	},
	data() {
		return {
			positionMap: {},
			widthStore: {},
			heightStore: {},
			sections: [{}],
			sectionsIdx: 0,
			displayImages: [],
			storedImagesLength: 0,
			currentSectionCount: 0,
			containerWidth: 0,
			maxHeight: 0,
			screenWidth: document.documentElement.clientWidth,
			screenHeight: document.documentElement.clientHeight,
			scrollTop: document.documentElement.scrollTop,
			containerOffset: 0,
		};
	},
	computed: {
		columns() {
			return Math.floor(
				(this.containerWidth + this.gap) / (this.cardWidth + this.gap)
			);
		},
	},
	watch: {
		images: 'imagesChanged',
		columns: 'columnsChanged',
		cardWidth: 'cardWidthChanged',
		screenWidth(value) {
			if (this.resizeTimer) {
				clearTimeout(this.resizeTimer)
			}
			this.resizeTimer = setTimeout(() => {
				this.screenWidthChanged(value);
			}, 300);
		},
		scrollTop: 'pageScrolled',
	},
	created() {
		this.resetWidthStore();
		this.resetHeightStore();
		this.resetPositionMap();
		window.addEventListener('resize', this.handleWindowResize);
		window.addEventListener('scroll', this.handleScroll, true);
	},
	mounted() {
		this.containerWidth = this.getContainerWidth();
		this.containerOffset = this.getContainerOffset();
	},
	updated() {
		this.containerWidth = this.getContainerWidth();
	},
	destroyed() {
		window.removeEventListener('resize', this.handleWindowResize);
		window.removeEventListener('scroll', this.handleScroll);
	},
  methods: {
		// waterfall container
		getContainerWidth() {
			if (this.$refs.container) {
				return this.$refs.container.offsetWidth;
			} else {
				return 0;
			}
		},
		getContainerOffset() {
			const bodyRect = document.documentElement.getBoundingClientRect();
			const elRect = this.$refs.container.getBoundingClientRect();
    	return elRect.top - bodyRect.top;
		},
		// waterfall items
		imagesChanged() {
			if (this.images.length < this.storedImagesLength) {
				this.renderWaterfall();
			} else {
				this.computePosition();
				this.setMaxHeight();
				this.setDisplay();
			}
			this.storedImagesLength = this.images.length;
		},
		columnsChanged() {
			this.renderWaterfall();
		},
		cardWidthChanged() {
			this.renderWaterfall();
		},
		screenWidthChanged() {
			this.containerWidth = this.getContainerWidth();
		},
		pageScrolled() {
			this.setDisplay();
		},
		renderWaterfall() {
			this.resetSections();
			this.resetWidthStore();
			this.resetHeightStore();
			this.resetPositionMap();
			this.setMaxHeight();
			this.setDisplay();
		},
		setDisplay() {
			const countPerSection = this.columns * this.rowsPerSection;
			let list = [];
			for (let i = 0; i < this.sections.length; i++) {
				const section = this.sections[i];
				const { head, tail } = section;
				// console.log('index', i, 'head', head, 'tail', tail);
				// console.log('scrollTop', this.scrollTop, 'cond', head <= this.scrollTop + this.screenHeight + ADDITIONAL_DISTANCE && tail > this.scrollTop - ADDITIONAL_DISTANCE);
				const showCondHead = this.scrollTop + this.screenHeight + ADDITIONAL_DISTANCE;
				const showCondTail = this.scrollTop - ADDITIONAL_DISTANCE;
				if (head <= showCondHead && tail > showCondTail) {
					list = list.concat(this.images.slice(i * countPerSection, (i + 1) * countPerSection));
				}
				if (head > showCondHead) {
					// 有序数据，后面的都不会显示出来没必要遍历了
					break;
				}
			}
			window.requestAnimationFrame(() => {
				this.$set(this, 'displayImages', list);
				this.$forceUpdate();
			});
		},
		resetWidthStore() {
			this.widthStore = {};
			for (let i = 0; i < this.columns; i++) {
				this.widthStore[i] = (this.cardWidth + this.gap) * i;
			}
		},
		resetHeightStore() {
			this.heightStore = {};
			for (let i = 0; i < this.columns; i++) {
				this.heightStore[i] = 0;
			}
		},
		resetPositionMap() {
			this.positionMap = {};
			this.computePosition();
		},
		resetSections() {
			this.sections = [{}];
			this.currentSectionCount = 0;
		},
		computePosition() {
			if (!this.widthStore || !this.heightStore || !this.columns) {
				return;
			}
			const countPerSection = this.columns * this.rowsPerSection;
			this.images.forEach((image, index) => {
				// ignore computed
				const mapKey = index;
				image.index = index;
				if (this.positionMap[mapKey]) {
					return;
				}
				this.$set(this.positionMap, mapKey, {});
				// compute load height
				const h = this.squaredImage ? this.cardWidth : this.getLoadHeight(image);
				this.$set(this.positionMap[mapKey], 'height', h);
				// compute position
				let left;
				let top;
				let storeIdx;
				if (index < this.columns) {
					left = this.widthStore[index];
					top = 0;
					storeIdx = index;
				} else {
					const minHeightIdx = this.getMinHeightCol();
					left = this.widthStore[minHeightIdx];
					top = this.heightStore[minHeightIdx];
					storeIdx = minHeightIdx;
				}
				// check section count
				if (this.currentSectionCount < countPerSection) {
					this.currentSectionCount += 1;
				} else {
					this.currentSectionCount = 1;
					this.sections.push({});
				}
				// set position
				this.$set(this.positionMap[mapKey], 'left', left);
				this.$set(this.positionMap[mapKey], 'top', top);
				this.heightStore[storeIdx] += (h + this.gap);
				// console.log('index', index, 'top', top);
				// console.log('heightStore', this.heightStore);
				// set group position
				const sectionIdx = this.sections.length - 1;
				// console.log('sectionIdx', sectionIdx);
				const { head, tail } = this.sections[sectionIdx];
				if (typeof head === 'undefined' || top < head) {
					this.sections[sectionIdx].head = top;
				}
				const bottom = top + h;
				if (typeof tail === 'undefined' || bottom > tail) {
					this.sections[sectionIdx].tail = bottom;
				}
			});
		},
		getLoadHeight(image) {
      return Math.floor(image.height / (image.width / this.cardWidth));
		},
		getMinHeightCol() {
			let min = Number.MAX_VALUE;
			let minIndex = 0;
			for (let i = 0; i < this.columns; i++) {
				if (this.heightStore[i] < min) {
					min = this.heightStore[i];
					minIndex = i;
				}
			}
			return minIndex;
		},
		getMaxHeight() {
			let max = 0;
			for (let i = 0; i < this.columns; i++) {
				if (this.heightStore[i] > max) {
					max = this.heightStore[i];
				}
			}
			return max;
		},
		setMaxHeight() {
			this.maxHeight = this.getMaxHeight();
		},
		// card event
		handleCardClicked(imageId) {
      this.$emit('card-clicked', imageId);
		},
		// window event handler
		handleWindowResize() {
			this.screenWidth = document.documentElement.clientWidth;
			this.screenHeight = document.documentElement.clientHeight;
			this.containerOffset = this.getContainerOffset();
		},
		handleScroll(timeout = false) {
			if (!timeout && this.lastScroll && Date.now() - this.lastScroll < 200) {
        return;
      }
			if (!timeout) {
				if (this.scrollTimer) {
					clearTimeout(this.scrollTimer);
				}
				this.scrollTimer = setTimeout(() => {
					this.handleScroll.apply(this, [ true ]);
				}, 200);
			}
      this.lastScroll = Date.now();
			this.containerOffset = this.getContainerOffset();
			this.scrollTop = document.documentElement.scrollTop - this.containerOffset;
		},
  }
}
</script>