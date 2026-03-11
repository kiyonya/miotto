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
                            每日<br>推荐
                        </div>
                    </div>
                </div>
                <div class="style-song">
                    <HorizontalScrollGrid :col="2" :row="3" :gap="0.5" class="g2">
                        <SongMiniCard :song="song" v-for="song in ncmRcmdStyleSongs.slice(0,12)" @click="handleNcmRecommendStyleSongPlay(song)"></SongMiniCard>
                    </HorizontalScrollGrid>

                </div>
            </div>

            <div class="playlists">
                <div class="title">雷达歌单</div>
                <HorizontalScrollGrid :col="4" :row="1" :gap="0.8">
                     <PlaylistCard :playlist="playlist" v-for="playlist in ncmRadioPlaylists"></PlaylistCard>
                </HorizontalScrollGrid>
            </div>



            <div class="line playlists">
                <div class="title">来听听这些歌单</div>

                <HorizontalScrollGrid :col="4" :row="1" :gap="0.8">
                     <PlaylistCard :playlist="playlist" v-for="playlist in ncmRcmdPlaylists.slice(1)"></PlaylistCard>
                </HorizontalScrollGrid>

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
import HorizontalScrollGrid from '@renderer/components/HorizontalScrollGrid.vue';
const ncmDailyRecommend = ref<AppTypes.INCMSong[]>([])
const ncmRcmdPlaylists = ref<AppTypes.IPlaylistBrief[]>([])
const ncmRcmdStyleSongs = ref<AppTypes.INCMSong[]>([])
const ncmRadioPlaylists = ref<AppTypes.IPlaylist[]>([])
const radioPlaylists = [3136952023, 5320167908, 5300458264, 5362359247, 5327906368, 5341776086]
async function load() {
    window.ncmapi.recommendSongs().then(songs => ncmDailyRecommend.value = songs)
    window.ncmapi.recommendPlaylists().then(p => ncmRcmdPlaylists.value = p)
    window.ncmapi.recommendStyleSongs().then(s => ncmRcmdStyleSongs.value = s)
    ncmRadioPlaylists.value = await loadRadioPlaylist()
}
async function loadRadioPlaylist() {
    const loadPromises = radioPlaylists.map(i=>window.ncmapi.playlistDetail(i,true))
    const playlists = await Promise.all(loadPromises)
    return playlists
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
    padding: 1rem 2rem;
    gap: 0.5rem;
}

.block {
    width: 100%;
    display: flex;
    flex-direction: column;
    height: fit-content;
    gap: 0.8rem;

    .title {
        font-size: 1.5rem;
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
        gap: 2rem;
    }

    .daily-song {
        aspect-ratio: 4/3.05;
        max-width: 22rem;
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
                font-size: 2rem;
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

        .g2 {
            display: grid;
            flex: 1;
        }
    }

    .playlists {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        --cc:4;

        .gd {
            display: grid;
            flex: 1;
            width: 100%;
            grid-auto-columns: calc((100% - 0.8rem * var(--cc)) / 4);
            grid-auto-flow: column;
            grid-template-rows: auto;
            gap: 0.8rem;
            overflow-x: auto;
            
        }

        .playlist {
            display: flex;
            flex-direction: column;
        }
    }
}
</style>