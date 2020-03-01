<template>
    <div class="pic-related">
        <div class="pic-related-title">
            <span>相关作品</span>
        </div>
        <div class="pic-related-content">
            <div class="waterfall-wrapper">
                <Waterfall ref="waterfall"
                    :images="images" @card-clicked="handleCardClicked"
                    :cardWidth="200" imageType="squareMedium" :squaredImage="true"/>
            </div>
        </div>
    </div>
</template>

<script>
import Waterfall from '../../components/common/Waterfall';

export default {
    name: 'Pic.Related',
    props: ['images'],
    components: {
        Waterfall
    },
    methods: {
        handleCardClicked() {

        }
    }
}
</script>