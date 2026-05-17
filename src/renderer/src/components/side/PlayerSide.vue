<template>
    <div class="player-side">

        <div class="backgroud" :style="{ background: `rgb(${matchColor})` }"></div>

        <div class="song-info" v-if="onplay">
            <div class="name">{{ onplay?.song.name }}</div>
            <ArtistName :artists="onplay?.song.artists"></ArtistName>
        </div>
        <div class="cover">
            <img :src="onplay?.song.cover" alt="" class="song-cover" v-if="onplay?.song.cover">
        </div>

        <div class="lyric">
            <SideLyric :lyric="playingLyric" v-if="playingLyric" :key="onplay?.song.id"></SideLyric>
        </div>

    </div>

</template>
<script setup lang="ts">
import { usePlayerStore } from '@renderer/store/player';
import { computed, onMounted, ref, watch } from 'vue';
import ArtistName from '../ArtistName.vue';
import VueSlider from 'vue-slider-component';
import ColorThief from 'colorthief';
import { rgb2Hsl } from '@renderer/utils/color';
import Lyric from '../musicplayer/Lyric.vue';
import SideLyric from './SideLyric.vue';

const playerStore = usePlayerStore()
const playingLyric = computed(() => playerStore.lyric)
const progress = computed<number>({
    get: () => {
        let duration = playerStore.audioState.duration
        let currentTime = playerStore.audioState.currentTime
        let progress = currentTime / (duration || 0) || 0
        return progress
    },
    set: (value: number) => {
        const duration = playerStore.audioState.duration || 0
        const seek = duration * +value
        window.$player.control.seek(seek)
    }
})
const onplay = computed(() => {
    return playerStore.onplay
})
const audioState = computed(() => {
    return playerStore.audioState
})
const playMode = computed(() => playerStore.player.playMode)
const playingSongCover = computed(() => playerStore.onplay?.song.cover)
const matchColor = ref<number[]>()
onMounted(() => {
    const colorThief = new ColorThief()
    watch(playingSongCover, (cover, _) => {
        Promise.resolve().then(() => {
            if (cover) {
                let img: null | HTMLImageElement = new Image()
                img.crossOrigin = 'anonymous'
                const url = cover
                if (!url) { return }
                img.src = window.$util.$imgrsz(url as string, 200) || url
                img.onload = (e) => {
                    const colors = colorThief.getPalette(e.target as HTMLImageElement, 10, 5)
                    const suitableColor = colors.find(rgbArr => {
                        const [_, s, __] = rgb2Hsl(rgbArr);
                        return s > 0.4;
                    });
                    if (suitableColor) {
                        matchColor.value = suitableColor;
                    }
                    else {
                        matchColor.value = [255, 255, 255]
                    }
                }
            }
        })
    }, {
        immediate: true
    })
})
</script>
<style scoped>
.player-side {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    padding: 3rem 2rem;
    align-items: center;
    position: relative;
    gap: 0.5rem;
    overflow: hidden;
}

.backgroud {
    position: absolute;
    width: 100%;
    height: 100%;
    left: 0;
    top: 0;
    z-index: 1;
    filter: brightness(0.7);
}

.cover {
    display: flex;
    width: 100%;
    z-index: 2;

    .song-cover {
        width: 100%;
        aspect-ratio: 1/1;
        border-radius: var(--br-2);
    }
}

.song-info {
    width: 100%;
    max-width: 100%;
    height: fit-content;
    z-index: 2;

    .name {
        font-size: 1.3rem;
        color: white;
        font-weight: 500;
    }
}
.lyric{
    flex: 1;
    overflow: hidden;
}
</style>