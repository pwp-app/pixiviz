<template>
    <div :class="['banner-wrapper', expanded ? 'banner-expanded' : '', clearMarginBottom ? 'clear-margin-bottom' : '']" @dblclick="handleDblClick" v-touch:doubletap="handleDoubleTap" v-lazy:background-image="bannerBG">
        <div class="banner">
            <div :class="['banner-title', titleUp ? 'banner-title-up' : '']">
                <span>Pixiv C</span>
            </div>
            <div :class="['about', aboutShow ? 'about-show' : '']" v-show="expanded">
                <div class="about-borrow">
                    <div class="about-borrow-title">
                        <span>借物</span>
                    </div>
                    <div class="about-borrow-item">
                        <span>API: <a target="_blank" class="about-borrow-link" href="https://pixivic.com">Pixivic.com (CheerFun)</a></span>
                    </div>
                    <div class="about-borrow-item">
                        <span>主页背景: <a>Pixiv - 63139897</a></span>
                    </div>
                </div>
                <div class="about-copyright">
                    <div class="about-copyright-item">
                        <span>Copyright &copy; 2020 pwp.app. Developed by BackRunner.</span>
                    </div>
                    <div class="about-copyright-item">
                        <span>Frontend based on Vue</span>
                    </div>
                    <div class="about-copyright-item">
                        <svg t="1582719754601" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2107" width="200" height="200"><path d="M512 12.64c-282.752 0-512 229.216-512 512 0 226.208 146.72 418.144 350.144 485.824 25.6 4.736 35.008-11.104 35.008-24.64 0-12.192-0.48-52.544-0.704-95.328-142.464 30.976-172.512-60.416-172.512-60.416-23.296-59.168-56.832-74.912-56.832-74.912-46.464-31.776 3.52-31.136 3.52-31.136 51.392 3.616 78.464 52.768 78.464 52.768 45.664 78.272 119.776 55.648 148.992 42.56 4.576-33.088 17.856-55.68 32.512-68.48-113.728-12.928-233.28-56.864-233.28-253.024 0-55.904 20-101.568 52.768-137.44-5.312-12.896-22.848-64.96 4.96-135.488 0 0 43.008-13.76 140.832 52.48a491.296 491.296 0 0 1 128.16-17.248c43.488 0.192 87.328 5.888 128.256 17.248 97.728-66.24 140.64-52.48 140.64-52.48 27.872 70.528 10.336 122.592 5.024 135.488 32.832 35.84 52.704 81.536 52.704 137.44 0 196.64-119.776 239.936-233.792 252.64 18.368 15.904 34.72 47.04 34.72 94.816 0 68.512-0.608 123.648-0.608 140.512 0 13.632 9.216 29.6 35.168 24.576C877.472 942.624 1024 750.784 1024 524.64c0-282.784-229.248-512-512-512z" p-id="2108" fill="#f8f8f8"></path></svg>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: "Landing.Banner",
    data() {
        return {
            bannerBG: require('@/assets/images/landing.jpg'),
            expanded: false,
            expandLock: false,
            titleUp: false,
            aboutShow: false,
            clearMarginBottom: false
        }
    },
    methods: {
        handleDblClick() {
            // Banner Anim
            if (!this.expandLock) {
                this.expandLock = true;
                if (!this.expanded) {
                    this.expanded = true;
                    // Hide scrollbar
                    document.body.className += ' no-scrollbar';
                    this.$bus.emit('banner-changed', this.expanded);
                    setTimeout(() => {
                        this.clearMarginBottom = true;
                    }, 200);
                    setTimeout(() => {
                        this.titleUp = true;
                        setTimeout(() => {
                            this.aboutShow = true;
                            setTimeout(() => {
                                this.expandLock = false;
                                // Reverse hiding scrollbar
                                document.body.className = document.body.className.replace(' no-scrollbar', '');
                            }, 500);
                        }, 350);
                    }, 350);
                } else {
                    this.aboutShow = false;
                    this.clearMarginBottom = false;
                    // Hide scrollbar
                    document.body.className += ' no-scrollbar';
                    setTimeout(() => {
                        this.titleUp = false;
                        setTimeout(() => {
                            this.expanded = false;
                            this.$bus.emit('banner-changed', this.expanded);
                            setTimeout(() => {
                                this.expandLock = false;
                                // Reverse hiding scrollbar
                                document.body.className = document.body.className.replace(' no-scrollbar', '');
                            }, 500);
                        }, 350)
                    }, 350)
                }
            }
        },
        handleDoubleTap() {
            handleDblClick()
        }
    }
}
</script>