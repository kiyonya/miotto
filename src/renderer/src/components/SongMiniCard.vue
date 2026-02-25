<template>
    <div class="song" :class="{playing:song.id === playingTrack?.id && song.type === playingTrack.platform}">
        <img v-imglazy="$imgrsz(song.cover as string, 200)" alt="" class="cover">
        <div class="song-info">
            <div class="name single-line">{{ song.name }}</div>
            <ArtistName :artists="song.artists"></ArtistName>
        </div>
    </div>
</template>
<script setup lang="ts">
import { AppTypes } from 'src/types/app';
import ArtistName from './ArtistName.vue';
import { usePlayerStore } from '@renderer/store/player';
import { computed } from 'vue';
const playerStore= usePlayerStore()
const playingTrack = computed(()=>playerStore.onplay?.trackId)

const props = defineProps<{
    song: AppTypes.ISong
}>()
</script>

<style scoped>
.song {
    width: 100%;
    height: 100%;
    display: flex;
    gap: 0.3rem;
    box-sizing: border-box;
    padding: 0.3rem;
    overflow: hidden;
    border-radius: var(--br-1);


    .song-info {
        flex: 1;

        .name {
            width: 100%;
            display: inline-block;
            -webkit-box-orient: vertical;
            overflow: hidden;
            text-overflow: ellipsis;
            vertical-align: middle;
        }
    }

    .cover {
        width: 2.8rem;
        height: 2.8rem;
        border-radius: var(--br-1);
    }


}

.song:hover {
    background: var(--hover);
}

.playing{
    outline: 1.5px solid var(--accent);
    outline-offset: -1.5px;
}
</style>
