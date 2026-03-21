<template>
    <RouterLink class="album" :to="{name:'Album',params:{id:album.id}}">
        <img v-imglazy="$imgrsz(album.cover, 500)" alt="" class="album-cover">
        <div class="album-info">
            <div class="publish" v-if="album.publishTime">{{ $fmttimestamp2date(album.publishTime) }}</div>
            <div class="name">{{ album.name }}</div>
        </div>
    </RouterLink>
</template>
<script setup lang="ts">
import { AppTypes } from 'src/types/app';

const props = defineProps<{
    album: AppTypes.IAlbum | AppTypes.IAlbumBrief
}>()

</script>
<style scoped>
.album {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 0;
    flex-shrink: 0;
    gap: 0.3rem;

    .album-cover {
        width: 100%;
        aspect-ratio: 1/1;
        border-radius: var(--br-2);
    }

    .album-info {
        display: flex;
        flex-direction: column;

        .publish {
            font-size: 0.85rem;
            color: var(--text-3);
        }

        .name {
            font-size: 0.95rem;
            color: var(--text-1);
            font-weight: 500;
        }
    }
}
</style>