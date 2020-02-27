<template>
    <div class="landing-container">
        <div class="landing">
            <Banner class="landing-card"/>
            <SearchBox class="landing-card"/>
            <RankBox/>
        </div>
    </div>
</template>

<script>
import Banner from '../components/landing/Banner';
import SearchBox from '../components/landing/SearchBox';
import RankBox from '../components/landing/RankBox';

export default {
    name: 'Landing',
    data() {
        return {
            bannerExpanded: false
        }
    },
    components: {
        Banner,
        SearchBox,
        RankBox
    }
}
</script>