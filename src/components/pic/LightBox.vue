<template>
    <div class="lightbox" @click="handleClick">
        <img :class="['lightbox-content', isLanding ? 'lightbox-content-landing' : null]" :src="src">
    </div>
</template>

<script>
export default {
    name: 'Pic.LightBox',
    props: ['src', 'isLanding'],
    methods: {
        handleClick() {
            this.$emit('close');
        }
    }
}
</script>