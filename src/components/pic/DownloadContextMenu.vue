<template>
    <context-menu
        class="context-menu context-menu-download"
        :target="target"
        :show="contextMenuVisible"
        @update:show="(show) => contextMenuVisible = show"
    >
        <div class="context-menu-item" @click="download">
            <span>下载原图</span>
        </div>
        <div class="context-menu-item" @click="downloadAll" v-if="all">
            <span>下载所有</span>
        </div>
    </context-menu>
</template>

<script>
import { component as VueContextMenu } from '@xunlei/vue-context-menu'
import CONFIG from '@/config.json';

export default {
    props: ['target', 'showAll'],
    components: {
        'context-menu': VueContextMenu
    },
    data() {
        return {
            contextMenuVisible: false,
        }
    },
    methods: {
        download() {
            this.$emit('download');
            this.contextMenuVisible = false;
        },
        downloadAll() {
            this.$emit('download-all');
            this.contextMenuVisible = false;
        }
    }
}
</script>