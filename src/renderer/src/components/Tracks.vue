<template>
    <div class="tracks" ref="tracksContainer">
        <div class="header">
            <span class="tag tag-song">歌曲 共{{ filterMode ? filtedTracks.length : props.tracks.length }}首</span>
            <span class="tag tag-album">专辑</span>
            <span class="tag tag-duration">时长</span>
        </div>

        <template v-if="!filterMode">
            <div class="chunk" v-for="chunk in renderChunks" :data-index="chunk.index"
                :style="{ height: chunk.height + 'rem' }" :key="chunk.index">

                <template v-for="ref in chunk.refs" v-if="chunk.render">
                    <template v-if="tracks[ref]">
                        <Song :song="tracks[ref]" @click.stop="handleTrackClick(tracks[ref])" :key="tracks[ref].id"></Song>
                    </template>
                </template>
            </div>
        </template>

        <template v-if="filterMode">

            <div class="song" v-for="song in filtedTracks" @click.stop="handleTrackClick(song)" :key="song.id">
                <img v-imglazy="$imgrsz(song.cover as string, 200)" alt="" class="song-cover">
                <div class="song-detail">
                    <div class="name single-line">{{ song.name }}</div>
                    <ArtistName :artists="song.artists"></ArtistName>
                </div>
                <div class="album single-line">{{ song.album.name }}</div>
                <div class="duration">{{ $fmtms(song.duration) }}</div>
            </div>

        </template>

    </div>
</template>
<script setup lang="ts">

import { AppTypes } from 'src/types/app';
import { computed, onMounted, onUnmounted, ref, toRef } from 'vue';
import usePlaylistRender from '@renderer/hooks/usePlaylistRender';
import ArtistName from './ArtistName.vue';
import { Icon } from '@iconify/vue';
import Song from './Song.vue';

const props = defineProps<{
    tracks:AppTypes.ISong[],
    trackLength:number,
    searchKeyword?: string | null
}>()

const emits = defineEmits<{
    playTrack: [song: AppTypes.ISong]
}>()

const searchKeyWord = toRef(props, 'searchKeyword')
const tracksContainer = ref<HTMLElement | null>(null)
const tracks = toRef(props,'tracks')

const filtedTracks = computed<AppTypes.ISong[]>(() => {
    if (!searchKeyWord.value) return []
    const keyword = searchKeyWord.value.toLowerCase()
    const pattern = keyword.split('').join('.*?')
    const regex = new RegExp(pattern, 'i')
    return tracks.value.filter(i => {
        return regex.test(i.name) ||
            i.artists.some(artist => regex.test(artist.name))
    })
})

const filterMode = computed(() => {
    if (searchKeyWord.value) {
        return true
    }
    return false
})

const { renderChunks, start, stop} = usePlaylistRender(
    props.trackLength,
    {
        renderChunkSize: 50,
        itemHeightInRem: 3.5,
        debonaceTime: 200,
        observerElementClassName: '.chunk'
    }
)

onMounted(async () => {
    if (tracksContainer.value) {
        start(tracksContainer.value)
    }
})

onUnmounted(() => {
    stop()
})

function handleTrackClick(isong: AppTypes.ISong) {
     emits('playTrack', isong)
}

</script>
<style scoped>
.tracks {
    width: 100%;
    height: fit-content;
    display: flex;
    flex-direction: column;
    --album-offset: calc(50% - 30px);
    --duration-offset: calc(100% - 50px);

}

.placeholder {
    height: 3.8rem;
    width: 100%;
    border: 1px solid blue;
}

.header {
    display: flex;
    position: relative;
    width: 100%;
    padding: 0 0 0.5rem 0;

    .tag {
        font-size: 0.85rem;
        color: var(--text-3);
        position: relative;
    }

    .tag:nth-child(2):before,
    .tag:nth-child(3):before {
        content: '';
        position: absolute;
        height: 100%;
        width: 1.1px;
        background: var(--border);
        left: -0.8rem;
    }


    .tag-song {
        margin-left: 0.4rem;
    }

    .tag-album {
        position: absolute;
        left: var(--album-offset);
    }

    .tag-duration {
        position: absolute;
        left: var(--duration-offset);
    }

}

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

    .typetip{
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

.song:hover {
    background: var(--hover);
}

.alt {
    background: var(--app-light);
}
</style>
