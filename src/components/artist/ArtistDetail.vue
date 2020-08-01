<template>
    <div class="artist-detail">
        <div class="artist-overview">
            <div class="artist-overview-avatar">
                <div id="avatar" :style="{backgroundImage: `url(${this.avatar})`}"></div>
            </div>
            <div class="artist-overview-content">
                <div class="artist-overview-content-name">
                    <span>{{name}}</span>
                </div>
                <div class="artist-overview-content-data">
                    <div class="overview-data">
                        <div class="overview-data-name">
                            <span>插画</span>
                        </div>
                        <div class="overview-data-number">
                            <span>{{totalIllusts}}</span>
                        </div>
                    </div>
                    <div class="overview-data">
                        <div class="overview-data-name">
                            <span>漫画</span>
                        </div>
                        <div class="overview-data-number">
                            <span>{{totalManga}}</span>
                        </div>
                    </div>
                    <div class="overview-data">
                        <div class="overview-data-name">
                            <span>小说</span>
                        </div>
                        <div class="overview-data-number">
                            <span>{{totalNovel}}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="artist-comment">
            <pre>{{comment}}</pre>
        </div>
    </div>
</template>

<script>
import CONFIG from '../../config.json';

export default {
    name: 'Artist.ArtistDetail',
    props: ['artistId'],
    data() {
        return {
            artist: null,
            name: '',
            comment: '',
            totalIllusts: 0,
            totalManga: 0,
            totalNovel: 0,
        };
    },
    mounted() {
        this.fetchDetail();
    },
    computed: {
        avatar() {
            if (this.artist) {
                return this.artist.user.profile_image_urls.medium.replace('i.pximg.net', CONFIG.IMAGE_PROXY_HOST);
            } else {
                return '';
            }
        }
    },
    methods: {
        fetchDetail() {
            if (window.pixiviz && window.pixiviz.artistMap && window.pixiviz.artistMap[this.artistId]) {
                this.artist = window.pixiviz.artistMap[this.artistId];
                this.afterLoad();
                return;
            }
            this.axios.get(`${CONFIG.OWN_API}/user/detail`, {
                params: {
                    id: this.artistId,
                },
            }).then(res => {
                if (res.status !== 200 || !res.data) {
                    this.$emit('failed');
                    return;
                }
                this.artist = res.data;
                if (window.pixiviz && window.pixiviz.artistMap) {
                    window.pixiviz.artistMap[this.artistId] = this.artist;
                }
                this.afterLoad();
            });
        },
        afterLoad() {
            // 拆解
            const profile = this.artist.profile;
            this.totalIllusts = profile.total_illusts;
            this.totalManga = profile.total_manga;
            this.totalNovel = profile.total_novels;
            const user = this.artist.user;
            this.name = user.name;
            this.comment = user.comment;
            // 触发事件
            this.$emit('loaded', this.name);
        }
    }
}
</script>