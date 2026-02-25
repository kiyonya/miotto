<template>
    <div class="home">

        <div class="ncm-recommend block">
            <div class="title">云音乐推荐</div>
            <div class="line cbsongs">
                <div class="daily-song" @click="$router.push('/dailysongs')">
                    <DropShadowImg :src="ncmDailyRecommend[0].cover" v-if="ncmDailyRecommend[0]?.cover" class="cover">
                    </DropShadowImg>
                    <div class="mask">
                        <div class="tn">
                            <Icon icon="material-symbols:thumb-up" />
                            每日推荐
                        </div>
                    </div>
                </div>
                <div class="style-song">
                    <div class="subtitle">根据您的风格精选</div>
                    <HorizontalScroll>
                        <div class="gd">
                        <SongMiniCard :song="song" v-for="song in ncmRcmdStyleSongs.slice(0,12)" @click="handleNcmRecommendStyleSongPlay(song)"></SongMiniCard>
                    </div>
                    </HorizontalScroll>
                </div>
            </div>
            <div class="line playlists">
                <div class="subtitle">推荐歌单</div>

                <div class="gd">
                    <PlaylistCard :playlist="playlist" v-for="playlist in ncmRcmdPlaylists.slice(0,8)"></PlaylistCard>
                </div>





            </div>
        </div>

    </div>
</template>
<script lang="ts" setup>
import DropShadowImg from '@renderer/components/DropShadowImg.vue';
import SongMiniCard from '@renderer/components/SongMiniCard.vue';
import { AppTypes } from 'src/types/app';
import { onBeforeMount, ref } from 'vue';
import { Icon } from '@iconify/vue';
import PlaylistCard from '@renderer/components/PlaylistCard.vue';
import HorizontalScroll from '@renderer/components/HorizontalScroll.vue';
import { song2TrackId } from '@renderer/utils/dataformat';
const ncmDailyRecommend = ref<AppTypes.INCMSong[]>([])
const ncmRcmdPlaylists = ref<AppTypes.IPlaylistBrief[]>([])
const ncmRcmdStyleSongs = ref<AppTypes.INCMSong[]>([])
async function load() {
    window.ncmapi.recommendSongs().then(songs => ncmDailyRecommend.value = songs)
    window.ncmapi.recommendPlaylists().then(p => ncmRcmdPlaylists.value = p)
    window.ncmapi.recommendStyleSongs().then(s => ncmRcmdStyleSongs.value = s)
}
onBeforeMount(() => {
    load()
})
function handleNcmRecommendStyleSongPlay(song:AppTypes.ISong){
    const trackIds = ncmRcmdStyleSongs.value.map(song2TrackId)
    const trackId = song2TrackId(song)
    window.$player.playTrackList(trackIds,trackId)
}

</script>
<style scoped>
.home {
    display: flex;
    flex-direction: column;
    overflow-y: hidden;
    height: fit-content;
}

.block {
    width: 100%;
    display: flex;
    flex-direction: column;
    height: fit-content;
    gap: 0.5rem;

    .title {
        font-size: 1.8rem;
        font-weight: 500;
    }

    .subtitle {
        font-size: 1.2rem;
        font-weight: 500;
    }
}

.ncm-recommend {

    height: fit-content;

    .cbsongs {
        display: flex;
        width: 100%;
        height: 12rem;
        gap: 1rem;
    }

    .daily-song {
        aspect-ratio: 1/1;
        max-width: 20rem;
        flex-shrink: 0;
        height: 100%;
        position: relative;

        .cover {
            width: 100%;
            height: 100%;
            z-index: 10;
        }

        .mask {
            width: 100%;
            height: 50%;
            position: absolute;
            left: 0;
            bottom: 0;
            background: linear-gradient(to top, black, transparent);
            z-index: 11;
            display: flex;
            align-items: end;
            box-sizing: border-box;
            padding: 0.5rem;
            border-radius: var(--br-2);
            overflow: hidden;
            color: white;

            .tn {
                font-size: 1.5rem;
                font-weight: 500;
                display: flex;
                align-items: center;
                gap: 0.3rem;
            }

            .dt {
                position: absolute;
                transform: rotate(280deg);
                font-size: 6rem;
                right: 0rem;
                bottom: -1.5rem;
            }
        }
    }

    .style-song {
        flex-shrink: 0;
        display: flex;
        flex-direction: column;
        flex: 1;
        height: 100%;
        gap: 0.2rem;

        .gd {
            display: grid;
            flex: 1;
            width:fit-content;
            grid-template-columns: repeat(4,50%);
            grid-template-rows: repeat(3, 1fr);

        }
    }

    .playlists {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        

        .gd {
            display: grid;
            flex: 1;
            width: 100%;
            grid-template-columns: repeat(4, 1fr);
            grid-template-rows: repeat(2, 1fr);
            gap: 0.8rem;
        }

        .playlist {
            display: flex;
            flex-direction: column;
        }
    }
}
</style>