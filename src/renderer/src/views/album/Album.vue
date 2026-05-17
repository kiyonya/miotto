<template>
    <div class="album">
        <div class="left">
            <DropShadowImg :src="albumInfo?.cover" v-if="albumInfo?.cover" class="cover"
                style="width: 100%;height: auto;"></DropShadowImg>
            <div class="album-info">
                <div class="name single-line">{{ albumInfo?.name }}</div>
                <ArtistName :artists="albumInfo?.artists" v-if="albumInfo"></ArtistName>
                <div class="info">
                    <span>©{{ albumInfo?.company }}</span>
                    <span>音轨{{ albumSongs.length }}条</span>
                    <span v-if="totalTime">总时长 {{ $fmtsecond(totalTime) }}</span>
                </div>
                <div class="desc">
                    {{ albumInfo?.description }}
                </div>
            </div>
            <div class="action">
                <button class="play" style="font-size: 1rem;">播放专辑</button>
                <button>
                    <Icon icon="fluent:collections-16-regular" />
                </button>
                <button>
                    <Icon icon="fluent:more-16-filled" />
                </button>
            </div>
        </div>
        <div class="div"></div>
        <div class="songs">
            <div class="head">
                <span>#</span>
                <span class="title">标题</span>
                <span class="dt">时长</span>
            </div>
            <div class="list">
                <SongNoCover v-for="(song,index) in albumSongs" :song="song" :key="song.id" :index="index+1" @play="handlePlay"></SongNoCover>
            </div>
            
        </div>
    </div>
</template>
<script lang="ts" setup>
import { Icon } from '@iconify/vue';
import ArtistName from '@renderer/components/ArtistName.vue';
import DropShadowImg from '@renderer/components/DropShadowImg.vue';
import SongNoCover from '@renderer/components/SongNoCover.vue';
import { song2TrackId } from '@renderer/utils/dataformat';
import { AppTypes } from 'src/types/app';
import { onBeforeMount, ref } from 'vue';

const props = defineProps<{ id: number }>()
const albumInfo = ref<AppTypes.IAlbum>()
const albumSongs = ref<AppTypes.ISong[]>([])
const totalTime = ref<number>(0)
async function load() {
    const data = await window.ncmapi.album(props.id)
    console.log(data)
    albumInfo.value = data.album
    albumSongs.value = data.songs
    for (const song of data.songs) {
        totalTime.value += song.duration
    }
}
onBeforeMount(() => {
    load()
})

function handlePlay(song:AppTypes.ISong){
    const trackIds = albumSongs.value.map(song2TrackId)
    const trackId = song2TrackId(song)
    window.$player.playTrackList(trackIds,trackId)
}
</script>
<style scoped>
.album {
    height: 100%;
    overflow-y: auto;
    display: flex;
    flex-direction: row;
    gap: 0.9rem;


    .div{
        width: 1px;
        height: 100%;
        background: var(--border);
    }
    .left {

        width: 42%;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        gap: 0.7rem;
        flex-shrink: 0;

        .cover {
            width: 100%;
        }

        .album-info {
            display: flex;
            flex-direction: column;
            flex: 1;

            .desc {
                
                margin-top: 0.5rem;
                display: flex;
                flex-direction: column;
                justify-content: center;
                color: var(--text-3);
                font-size: 0.85rem;
                display: -webkit-box;
                -webkit-line-clamp: 4;
                -webkit-box-orient: vertical;
                overflow: hidden;
            }

            .name {
                font-size: 1.35rem;
                font-weight: 500;
            }

            .info {
                display: flex;
                flex-direction: row;
                gap: 0.7rem;
                color: var(--text-3);
                font-size: 0.9rem;
            }
        }

        .action {
            display: flex;
            flex-direction: row;
            height: 2.4rem;
            width: 100%;
            gap: 0.5rem;
            margin-top: auto;

            button {
                height: 100%;
                width: fit-content;
                border: none;
                color: var(--text-1);
                background: var(--component);
                box-sizing: border-box;
                display: flex;
                font-size: 1.2rem;
                align-items: center;
                justify-content: center;
                aspect-ratio: 1/1;
                border-radius: var(--br-2);
            }

            .play {
                flex: 1;
                border-radius: var(--br-2);
                background: var(--accent);
            }
        }
    }


    .songs {
        flex: 1;
        height: 100%;
        display: flex;
        flex-direction: column;

        .head{
            display: flex;
            width: 100%;
            color: var(--text-3);
            font-size: 0.9rem;
            padding-bottom: 0.3rem;
            border-bottom: 1px solid var(--border);
            margin-bottom: 0.3rem;
            .title{
                margin-left: 1.2rem;
            }
            .dt{
                margin-left: auto;
                margin-right: 3.65rem;
            }
        }

        .list{
            width: 100%;
            flex: 1;
            overflow-y: auto;
        }
    }

}
</style>