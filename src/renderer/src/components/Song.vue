<template>
    <div class="song" :style="songStyle" v-bind="$attrs">
        <img v-imglazy="$imgrsz(song.cover as string, 200)" alt="" class="song-cover">
        <div class="song-detail">
            <div class="name single-line">{{ song.name }}</div>
            <ArtistName :artists="song.artists"></ArtistName>
        </div>
        <div class="album single-line">{{ song.album.name }}</div>
        <div class="duration">{{ $fmtms(song.duration) }}</div>
    </div>
</template>
<script setup lang="ts">
import { AppTypes } from 'src/types/app';
import { computed } from 'vue';
import ArtistName from './ArtistName.vue';
const props = defineProps<{
    song: AppTypes.ISong
    albumOffset?: number | string
    durationOffset?: number | string
    index?:number,
}>()
defineOptions({
    inheritAttrs: false
})

const songStyle = computed(() => {
    const style: Record<string, string> = {}
    if (props.albumOffset !== undefined) {
        style['--album-offset'] = typeof props.albumOffset === 'number' 
            ? `${props.albumOffset}px` 
            : props.albumOffset
    }
    if (props.durationOffset !== undefined) {
        style['--duration-offset'] = typeof props.durationOffset === 'number' 
            ? `${props.durationOffset}px` 
            : props.durationOffset
    }
    return style
})

</script>
<style scoped>
.song {
    height: 3.5rem;
    width: 100%;
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 0.4rem;
    box-sizing: border-box;
    padding: 0.4rem;
    border-radius: var(--br-1);
    cursor: pointer;
    columns: 4;
    position: relative;
    --album-offset: calc(50% - 30px);
    --duration-offset: calc(100% - 50px);

    .song-cover {
        height: 100%;
        aspect-ratio: 1/1;
        object-fit: cover;
        border-radius: var(--br-1);
    }

    .song-detail {
        display: flex;
        flex-direction: column;

        .name {
            font-size: 1rem;
            color: var(--text-1);
            max-width: 18rem;
        }

        .artist {
            font-size: 0.9rem;
            color: var(--text-3);
        }
    }

    .album {
        position: absolute;
        left: var(--album-offset);
        font-size: 0.85rem;
        color: var(--text-3);
        max-width: 18rem;
    }

    .typetip {
        margin-left: auto;
        margin-right: 3.6rem;
    }

    .duration {
        position: absolute;
        left: var(--duration-offset);
        font-size: 0.85rem;
        color: var(--text-3);
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    }
}

.song:hover{
    background: var(--hover);
}

.song:focus{
    background: transparent !important;
    outline: 1.5px solid var(--accent);
    outline-offset: -1.5px;
}
</style>