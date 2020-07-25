<template>
    <div :class="['back2top', showClass ? 'back2top-show' : '']" v-show="show" @click="handleClick">
        <i class="el-icon-top"></i>
    </div>
</template>

<script>
let lastOffset = 0;

export default {
    name: "Common.BackToTop",
    data() {
        return {
            show: false,
            showClass: false
        }
    },
    created () {
        window.addEventListener('scroll', this.handleScroll);
    },
    destroyed () {
        window.removeEventListener('scroll', this.handleScroll);
    },
    methods: {
        handleScroll() {
            if (window.pageYOffset - lastOffset < -50) {
                if (this.show) {
                    this.showClass = false;
                    setTimeout(function() {
                        this.show = false;
                    }.bind(this), 300);
                }
                lastOffset = window.pageYOffset;
            } else if (window.pageYOffset - lastOffset > 100) {
                if (!this.show) {
                    this.show = true;
                    setTimeout(function() {
                        this.showClass = this.show;
                    }.bind(this), 0);
                    }
                lastOffset = window.pageYOffset;
            }
        },
        handleClick() {
            window.scrollTo({
                top: 0,
                behavior: "smooth"
            })
        }
    }
}
</script>