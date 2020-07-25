<template>
    <i @click="handleClick">
        <svg t="1595694914242" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="3867" width="200" height="200"><path d="M426.666667 384V213.333333l-298.666667 298.666667 298.666667 298.666667v-174.933334c213.333333 0 362.666667 68.266667 469.333333 217.6-42.666667-213.333333-170.666667-426.666667-469.333333-469.333333z" p-id="3868" fill="#da7a85"></path></svg>
    </i>
</template>

<script>
export default {
    methods: {
        handleClick() {
            this.$emit('action', 'back');
        }
    }
}
</script>