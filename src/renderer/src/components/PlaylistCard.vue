<template>
    <RouterLink class="playlist" :to="{name:playlist.type === 'custom' ? 'PlaylistCustom' : 'PlaylistNcm' ,params:{id:playlist.id}}">
        <div class="imgarea">
            <img :src="playlist.cover" v-if="playlist.cover" alt="" class="cover">
            <div class="mask">
                 <button class="playbtn">
                <Icon icon="fluent:play-12-filled" />
            </button>
            </div>
           
        </div>
        <span class="name single-line">{{ playlist.name }}</span>
        <span class="count">{{ playlist.trackCount }}首歌曲</span>


    </RouterLink>
</template>
<script setup lang="ts">
import { AppTypes } from 'src/types/app';
import DropShadowImg from './DropShadowImg.vue';
import { Icon } from '@iconify/vue';
import { getCurrentInstance } from 'vue';
const props = defineProps<{
    playlist: AppTypes.IPlaylistBrief | AppTypes.IPlaylist
}>()

function onPlaylistClick(){
    const vinst = getCurrentInstance()
    const router = vinst?.appContext.config.globalProperties.$router
    const playlist = props.playlist
    if(playlist.type === 'custom'){
        router?.push({name:"PlaylistCustom",params:{id:playlist.id}})
    }
    else if(playlist.type === 'ncm'){
        router?.push({name:"PlaylistNcm",params:{id:playlist.id}})
    }
}

</script>

<style scoped>
.playlist {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    width: 100%;
    flex-shrink: 0;
    min-width: 0;
    position: relative;
    text-decoration: none;
    scroll-snap-align: start;

    .imgarea {
        width: 100%;
        aspect-ratio: 1/1;
        height: auto;
        position: relative;
    }

    .mask{
        position: absolute;
        width: 100%;
        height: 60%;
        bottom: 0;
        left: 0;
        z-index: 11;
        background: linear-gradient(to top,rgba(0, 0, 0, 0.3),transparent);
        border-radius: var(--br-2);
        opacity: 0;
        transition: .1s;
    }

    .playbtn{
        position: absolute;
        right: 0.5rem;
        bottom: 0.5rem;
        font-size: 1.7rem;
        padding: 0.5rem;
        z-index: 12;

        display: flex;
        align-items: center;
        justify-content: center;
        height: fit-content;
        width: fit-content;
        aspect-ratio: 1/1;

        background: none;
        border: none;
        color: rgb(255, 255, 255);
        background: rgba(255, 255, 255, 0.4);
        backdrop-filter: blur(4px);
        border-radius: 50%;

        cursor: pointer;
    }

    .cover {
        width: 100%;
        aspect-ratio: 1/1;
        height: auto;
        z-index: 11;
        border-radius: var(--br-1);
    }

    .name {
        font-size: 1rem;
        color: var(--text-1);
        width: 100%;
        font-weight: 500;
        margin-top: 0.1rem;
    }

    .count {
        font-size: 0.85rem;
        color: var(--text-3);
    }
}
.playlist:hover{
    .mask{
        opacity: 1;
    }
}
</style>
