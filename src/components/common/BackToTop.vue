<template>
    <div :class="['back2top', showClass ? 'back2top-show' : '']" v-show="show" @click="handleClick">
        <i class="el-icon-top"></i>
    </div>
</template>

<script>
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
    beforeDestroy () {
        window.removeEventListener('scroll', this.handleScroll)
    },
    methods: {
        handleScroll() {
            if (this.show && window.pageYOffset < 300) {
                this.showClass = false;
                setTimeout(function() {
                    this.show = false;
                }.bind(this), 300);
            } else {
                this.show = window.pageYOffset > 300;
                setTimeout(function() {
                    this.showClass = this.show;
                }.bind(this), 0);
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