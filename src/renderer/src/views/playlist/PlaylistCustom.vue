<template>
    <div class="playlist-custom"  @dragenter="onDragEnter" @dragover="onDragOver"  @drop="onDrop"  :style="{'overflowY':dragMode ? 'hidden' : 'auto'}">

        <div class="head">
            <DropShadowImg class="" :src="playlistDetail?.cover" v-if="playlistDetail?.cover"></DropShadowImg>
            <div class="default-img" v-else>
                <Icon icon="pixelarticons:playlist" />
            </div>
            <div class="playlist-info">
                <div class="name">{{ playlistDetail?.name }}</div>
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
                    <button @click="showContextMenu($event)">
                        <Icon icon="prime:file-import" />
                    </button>
                    <button>
                        <Icon icon="material-symbols:edit-square-outline" />
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

        <div class="tracks no-track" v-if="!tracks.length">
            <span>当前歌单没有歌曲哦</span>
            <span>试着 <button @click="importLocalSongs">导入歌曲</button></span>
        </div>

        <Tracks :tracks="tracks" :track-length="tracks.length" :search-keyword="searchSongKeyword" v-if="tracks.length"
            @play-track="handlePlayTrack" :key="tracks.length">
        </Tracks>

        <div class="drag-mask" v-if="dragMode" @dragover="onDragOver" @dragleave="onDragLeave">

        </div>
        
    </div>
</template>
<script setup lang="ts">
import DropShadowImg from '@renderer/components/DropShadowImg.vue';
import Tracks from '@renderer/components/Tracks.vue';
import { usePlaylistStore } from '@renderer/store/playlist';
import { AppTypes } from 'src/types/app';
import { getCurrentInstance, onBeforeMount, onMounted, ref } from 'vue';
import { Icon } from '@iconify/vue';
import FunctionalWindows from '@renderer/components/windows';
import { URLPattern } from 'urlpattern-polyfill'
const props = defineProps<{
    id: string
}>()
const vueInstance = getCurrentInstance()
const playlistStore = usePlaylistStore()
const playlistId = ref<string>()
const playlistDetail = ref<AppTypes.IPlaylist | null>(null)
const searchSongKeyword = ref<string>('')
const tracks = ref<AppTypes.ISong[]>([])
const trackLength = ref<number>(0)

async function load(id: string) {
    playlistDetail.value = await playlistStore.getPlaylist(id)
    const trackIds = playlistDetail.value.tracks
    const songs = await playlistStore.mapTrackIdsToSongs(trackIds)
    tracks.value = songs
    trackLength.value = songs.length
}


onBeforeMount(() => {
    if (props.id) {
        playlistId.value = props.id
        load(playlistId.value)
    }

})

const dragMode = ref<boolean>(false)


function onDragEnter(event:DragEvent){

}

function onDragLeave(event:DragEvent){
    event.stopPropagation()
    dragMode.value = false
}

function onDragOver(event: DragEvent) {
    dragMode.value = true
    event.preventDefault()
    event.stopPropagation()
}

async function onDrop(event: DragEvent) {
    dragMode.value = false
    event.preventDefault()
    event.stopPropagation()
    console.log(event)
    const dataTransfer = event.dataTransfer
    if (dataTransfer) {
        console.log(dataTransfer.files)
        for (const item of dataTransfer.items) {
            const str = await new Promise<string>((resolve) => {
                item.getAsString((data) => {
                    resolve(data)
                })
            })
            console.log(str)
            const bilivp = new URLPattern('https://www.bilibili.com/video/*')
            if (bilivp.test(str)) {
                console.log(str)
                break
            }
        }
    }
}

function parseDragItem() {

}


function clearSearch() {
    searchSongKeyword.value = ''
}

function handlePlayTrack(song: AppTypes.ISong) {
    const trackIds = tracks.value.map(playlistStore.song2TrackId)
    const trackId = playlistStore.song2TrackId(song)
    window.$player?.playTrackList(trackIds, trackId)
}

async function importBiliMusic() {
    const select = await FunctionalWindows.showBiliMusicImportWindow()
    if (!select.canceled && select.song) {
        await playlistStore.importBiliMusicToPlaylist(props.id, select.song)
        await load(props.id)
    }
}
async function importLocalSongs() {
    const select = await window.appapi.showOpenDialog({
        properties: ['multiSelections', 'openFile'],
        filters: [
            { name: "音频文件", extensions: ['mp3', 'flac'] }
        ]
    })
    if (!select.canceled && select.filePaths.length) {
        await playlistStore.importLocalMusicToPlaylist(props.id, select.filePaths)
        await load(props.id)
    }
}

async function showContextMenu(event: MouseEvent) {
    FunctionalWindows.showContextMenu({
        x: event.x,
        y: event.y,
        items: [
            { label: '从BiliBili导入音频', onClick: importBiliMusic, icon: 'meteor-icons:bilibili' },
            { label: '从磁盘导入音频', onClick: importLocalSongs, icon: 'uil:hdd' }
        ]
    })
}

</script>

<style scoped>
.playlist-custom {
    height: 100%;
    overflow-y: hidden;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    position: relative;

    .head {
        width: 100%;
        height: fit-content;
        flex-shrink: 0;
        display: flex;
        flex-direction: row;
        gap: 1rem;

        .default-img {
            width: 12rem;
            height: 12rem;
            background: var(--component);
            border-radius: var(--br-2);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 8rem;
            color: var(--text-1);
        }

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

                .accent {
                    background: var(--accent);
                    color: white;
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

    .no-track {
        width: 100%;
        height: 15rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        border-top: 1px solid var(--border);

        .simg {
            width: 8rem;
            height: 8rem;
            object-fit: cover;
        }
    }

    .drag-mask{
        width: 100%;
        height: 100%;
        position:absolute;
        left: 0;
        bottom: 0;
        backdrop-filter: brightness(0.75);
        z-index: 15;
    }
}
</style>