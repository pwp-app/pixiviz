<template>
    <div class="landing-container">
        <div class="landing">
            <Banner class="landing-card"/>
            <SearchBox class="landing-card"/>
            <Rank/>
        </div>
    </div>
</template>

<script>
import Banner from '../components/landing/Banner';
import SearchBox from '../components/landing/SearchBox';
import Rank from '../components/landing/Rank';

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
        Rank
    }
}
</script>