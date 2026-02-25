<template>
    <div class="playlist-view">

        <div class="head">
            <div class="title">正在播放 {{ playlistIds.length }} 首歌曲</div>
            <button class="switch">
                <Icon icon="solar:infinity-bold" />
            </button>
        </div>

        <div class="list" ref="tracksContainer">

            <div class="chunk" v-for="chunk in renderChunks" :data-index="chunk.index"
                :style="{ height: chunk.height + 'rem' }" :key="chunk.index">

                <template v-for="ref in chunk.refs" v-if="chunk.render">
                    <template v-if="tracks[ref]">
                        <div class="song" :key="tracks[ref].id" :data-refindex="ref"
                            :class="{ playing: isTrackPlaying(tracks[ref]), dragOver: dragItem?.to === ref, dragging: startDrag }"
                            @click.stop="playTrack(tracks[ref])" draggable="true"
                            @dragstart="handleDragStart($event, ref)" @dragover="handleDragOver($event, ref)"
                            @drop="handleDrop($event)">
                            <div class="drag-tip" v-if="startDrag">
                                <Icon icon="hugeicons:drag-drop-horizontal" />
                            </div>
                            <img v-imglazy="$imgrsz(tracks[ref].cover as string, 200)" alt="" class="song-cover">
                            <div class="song-detail">
                                <div class="name single-line">{{ tracks[ref].name }}</div>
                                <span class="artist">
                                    {{ tracks[ref].artists[0].name }}
                                </span>
                            </div>
                            <div class="duration">{{ $fmtms(tracks[ref].duration) }}</div>
                        </div>
                    </template>
                </template>
            </div>
        </div>
    </div>
</template>
<script lang="ts" setup>
import { usePlayerStore } from '@renderer/store/player';
import { computed, onMounted, watch, ref, getCurrentInstance, onUnmounted, nextTick, WatchHandle } from 'vue';
import { Icon } from '@iconify/vue';
import { AppTypes } from 'src/types/app';
import usePlaylistRender from '@renderer/hooks/usePlaylistRender';
import { scrollCenterDistance } from '@renderer/hooks/useScroll';
import { usePlaylistStore } from '@renderer/store/playlist';

const vueInstance = getCurrentInstance()
const playerStore = usePlayerStore()
const playlistStore = usePlaylistStore()


const playlistIds = computed(() => {
    return playerStore.playlist
})
const onplay = computed(() => {
    return playerStore.onplay
})
const playMode = computed(() => {
    return playerStore.player.playMode
})

const firstScreenSize = 50

const tracksContainer = ref<HTMLElement | null>(null)

const tracksMap = ref<Map<AppTypes.ITrackId['id'], AppTypes.ISong>>(new Map())
const tracks = computed(() => {
    return playlistIds.value
        .map(idObj => tracksMap.value.get(idObj.id))
        .filter(Boolean) as AppTypes.ISong[]
})

async function load() {
    tracksMap.value.clear()
    const firstScreenIds = playlistIds.value.slice(0, firstScreenSize)
    const firstScreenResults = await playlistStore.mapTrackIdsToSongs(firstScreenIds)
    for (const song of firstScreenResults) {
        tracksMap.value.set(song.id, song)
    }
    const lastIds = playlistIds.value.slice(firstScreenSize)
    const lastSongs = await playlistStore.mapTrackIdsToSongs(lastIds)
    for (const song of lastSongs) {
        tracksMap.value.set(song.id, song)
    }
}

const { renderChunks, start, stop, updateTrackLength, forceLoadItem } = usePlaylistRender(
    playlistIds.value.length,
    {
        renderChunkSize: 50,
        itemHeightInRem: 3.6,
        debonaceTime: 200,
        observerElementClassName: '.chunk'
    }
)

function focusPlayingSong() {
    const currentPlayingIndex = playerStore.getIndex()
    if (currentPlayingIndex) {
        forceLoadItem(currentPlayingIndex)
        nextTick().then(() => {
            if (tracksContainer.value) {
                const item = tracksContainer.value.querySelector(`[data-refindex="${currentPlayingIndex}"]`) as HTMLElement
                const scrollDistance = scrollCenterDistance(item, tracksContainer.value)
                tracksContainer.value.scrollTo({
                    top: scrollDistance,
                    behavior: 'smooth'
                })
            }
        })
    }
}

const watchHandles: WatchHandle[] = []
onMounted(() => {
    load().then(focusPlayingSong)
    tracksContainer.value && start(tracksContainer.value)
    watchHandles.push(
        watch(playlistIds, () => {
            updateTrackLength(playlistIds.value.length)
        })
    )
    watchHandles.push(watch(playMode, focusPlayingSong))
})
onUnmounted(() => {
    stop()
    for (const watchHandle of watchHandles) {
        watchHandle.stop()
    }
})

function isTrackPlaying(song: AppTypes.ISong): boolean {
    const playingSong = onplay.value?.song
    if (song.id === playingSong?.id && song.type === playingSong.type) {
        return true
    }
    return false
}

function playTrack(song: AppTypes.ISong) {
    vueInstance?.appContext.config.globalProperties.$player.playTrack(playlistStore.song2TrackId(song))
}

const dragItem = ref<{ from: number, to: number } | null>(null)
const startDrag = ref<boolean>(false)

function handleDragStart(_: DragEvent, fromIndex: number) {

    startDrag.value = true
    if (!dragItem.value) {
        dragItem.value = {
            from: fromIndex,
            to: -1,
        }
    }
}
function handleDragOver(event: DragEvent, toIndex: number) {
    event.preventDefault()
    if (!dragItem.value) { return }
    if (dragItem.value.from === toIndex) { return }
    if (dragItem.value.to !== toIndex) {
        dragItem.value.to = toIndex
    }
}

function handleDrop(event: DragEvent) {
    console.log("丢了")
    event.preventDefault()
    startDrag.value = false
    if (dragItem.value) {
        const from = dragItem.value.from
        const to = dragItem.value.to
        if (from !== undefined && to !== undefined && from !== to) {
            playerStore.movePlaylistItem(from, to)
        }
    }
    dragItem.value = null
}

</script>
<style scoped>
.playlist-view {
    width: 100%;
    height: 100%;
    overflow-y: hidden;
    overflow-x: hidden;
    display: flex;
    flex-direction: column;
    gap: 1rem;

    .list {
        width: 100%;
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
        overscroll-behavior: contain;

    }

    .list::-webkit-scrollbar {
        background: transparent;
        width: 3px;
    }

    .list::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.7);
        border-radius: 1.5px;
    }

    .playing {
        background: rgba(255, 255, 255, 0.2);
    }

    .dragOver {
        outline: 1.5px dotted white;
        outline-offset: -1.5px;
    }

    .dragging {
        padding-left: 0.8rem;
    }
}

.head {
    display: flex;
    flex-direction: row;
    color: rgba(255, 255, 255, 0.9);
    align-items: center;

    .title {
        font-size: 1.3rem;
        font-weight: 500;
    }

    .switch {
        background: none;
        border: none;
        color: white;
        font-size: 1.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-left: auto;
        padding: 0.3rem;
        border-radius: var(--br-1);
    }

    .switch:hover {
        background: rgba(255, 255, 255, 0.2);
    }
}

.song {
    display: flex;
    flex-direction: row;
    color: white;
    padding: 0.3rem 0.5rem;
    box-sizing: border-box;
    gap: 0.5rem;
    align-items: center;
    height: 3.6rem;
    transition: background 0.1s, padding 0.2s;
    border-radius: var(--br-1);
    cursor: pointer;

    .song-cover {
        width: 3rem;
        height: 3rem;
        border-radius: var(--br-1);
        object-fit: cover;
    }

    .song-detail {
        display: flex;
        flex-direction: column;

        .name {
            font-size: 1rem;
            max-width: 20rem;
        }

        .artist {
            font-size: 0.85rem;
            color: rgba(255, 255, 255, 0.7);
        }

    }

    .duration {
        font-size: 0.85rem;
        color: rgba(255, 255, 255, 0.7);
        margin-left: auto;
    }
}

.song:hover {
    background: rgba(255, 255, 255, 0.2);
}

.placeholder {
    width: 100%;
    height: 0.5rem;
    background-color: rgba(255, 255, 255, 0.2);
}
</style>