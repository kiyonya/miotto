<template>
    <div class="playlist">
        <div class="head">
            <DropShadowImg class="" :src="playlistDetail?.cover" v-if="playlistDetail?.cover"></DropShadowImg>
            <div class="playlist-info">
                <div class="name">{{ playlistDetail?.name }}</div>

                <div class="creator" v-if="playlistDetail?.creator?.nickname">
                    <span>由</span>
                    <span>{{ playlistDetail?.creator?.nickname }}</span>
                    <span>创建</span>
                </div>

                <span class="update" v-if="playlistDetail?.updateTime">
                    更新于{{ $fmttimestamp2date(playlistDetail?.updateTime) }}
                </span>

                <span v-if="playlistDetail?.description" class="desc">
                    {{ playlistDetail?.description }}
                </span>

                <div class="actions">
                    <button class="playbtn">
                        <Icon icon="material-symbols:play-arrow" />播放
                    </button>
                    <button >
                        <Icon icon="material-symbols:more-vert" />
                    </button>

                    <div class="search" :class="{ onSearch: Boolean(searchSongKeyword) }">
                        <Icon icon="material-symbols:search-rounded" />
                        <input type="text" v-model="searchSongKeyword" class="search-input" placeholder="搜索歌曲或歌手">
                        <Icon icon="material-symbols:close" v-if="searchSongKeyword" @click="clearSearch"
                            style="cursor: pointer;" />
                    </div>

                </div>
            </div>
        </div>
        <Tracks :tracks="tracks" :track-length="trackIds.length" v-if="trackIds.length"
            :search-keyword="searchSongKeyword" @play-track="handlePlayTrack"></Tracks>
    </div>
</template>
<script setup lang="ts">
import { Icon } from '@iconify/vue';
import Tracks from '@renderer/components/Tracks.vue';
import DropShadowImg from '@renderer/components/DropShadowImg.vue';
import { AppTypes } from 'src/types/app';
import { getCurrentInstance, onMounted, ref } from 'vue';
import pLimit from 'p-limit';
import { song2TrackId } from '@renderer/utils/quickplay';

const batchSize = 500
const firstScreenSize = 50

const props = defineProps<{
    id: number | string
}>()

const vueInstance = getCurrentInstance()
const playlistDetail = ref<AppTypes.IPlaylist>()
const searchSongKeyword = ref<string>('')
const tracks = ref<AppTypes.ISong[]>([])
let trackIds: AppTypes.ITrackId[] = []

async function loadBatch(ids: AppTypes.ITrackId[]) {
    return await window.ncmapi.songDetail(ids.map(i => Number(i.id)), true)
}

async function load(trackIds: AppTypes.ITrackId[]) {
    const firstScreenIds = trackIds.slice(0, firstScreenSize)
    const firstScreen = await loadBatch(firstScreenIds)
    tracks.value = []
    tracks.value.push(...firstScreen)

    const limit = pLimit(1)
    const batchPromise: Promise<AppTypes.ISong[]>[] = []
    for (let i = firstScreenSize; i < trackIds.length; i += batchSize) {
        const ids = trackIds.slice(i, i + batchSize)
        batchPromise.push(limit(() => loadBatch(ids)))
    }
    const songs = await Promise.all(batchPromise)
    tracks.value.push(...songs.flat(1))
}

onMounted(async () => {
    if (props.id) {
        const playlist = await window.ncmapi.playlistDetail(Number(props.id), true)
        playlistDetail.value = playlist
        trackIds = playlist.tracks
        await load(trackIds)
    }
})

function handlePlayTrack(song: AppTypes.ISong) {
    if (trackIds && trackIds.length) {
        window.$player?.playTrackList(trackIds, song2TrackId(song))
    }
}

function clearSearch() {
    searchSongKeyword.value = ''
}

</script>
<style scoped>
.playlist {
    height: 100%;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;

    .head {
        width: 100%;
        height: fit-content;
        flex-shrink: 0;
        display: flex;
        flex-direction: row;
        gap: 1rem;

        .playlist-info {
            display: flex;
            flex-direction: column;
            flex: 1;

            .desc {
                font-size: 0.9rem;
                color: var(--text-2);
                flex: 0.618;
                display: flex;
                flex-direction: column;
                justify-content: center;
            }

            .update {
                font-size: 0.85rem;
                color: var(--text-2);
            }

            .name {
                font-size: 1.6rem;
                font-weight: 500;
            }

            .creator {
                font-size: 1.2rem;
                font-weight: 500;
                color: var(--accent);
                display: flex;
                gap: 0;
                transition: .2s;
            }

            .creator:hover {
                gap: 0.5rem
            }

            .actions {
                display: flex;
                gap: 1rem;
                margin-top: auto;
                margin-bottom: 0;
                width: 100%;

                .playbtn {
                    background: var(--accent);
                }

                button {
                    font-size: 0.95rem;
                    background: var(--component);
                    border-radius: var(--br-2);
                    padding: 0.4rem 0.8rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.1rem;
                    color: var(--text-1);
                    cursor: pointer;
                    border: 0.5px solid var(--border);

                    svg {
                        font-size: 1.2rem;
                    }
                }


                .search {
                    display: flex;
                    margin-left: auto;
                    align-items: center;
                    background: var(--component);
                    box-sizing: border-box;
                    padding: 0.2rem 0.5rem;
                    border-radius: 1rem;
                    gap: 0.2rem;
                    transition: .2s;

                    .search-input {
                        background: none;
                        border: none;
                        outline: none;
                        color: var(--text-1);
                    }
                }

                .onSearch {
                    gap: 0.5rem;
                }
            }
        }
    }


}
</style>
