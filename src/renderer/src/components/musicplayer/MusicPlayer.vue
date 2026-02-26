<template>
    <div class="player">

        <button class="close" @click="appStore.toggleShowMusicPlayer()">
            <Icon icon="mingcute:down-line" />
        </button>

        <div class="background">
            <img :src="$imgrsz(onplay?.song.cover as string, 500)" alt="" class="base-img" v-if="onplay?.song.cover">
            <div class="backdrop-basecolor" :style="{ background: `rgb(${backdropBaseColor})` }"></div>
            <canvas class="dynamic-background" ref="dynamicBackgroundCvs"></canvas>
            <div class="mask" :style="{ opacity: backgroundGrayLevel }"></div>
        </div>

        <div class="song">
            <div class="song-info">
                <div class="basic">
                    <div class="name single-line">{{ onplay?.song.name }}</div>
                    <div class="artist">{{ onplay?.song.artists[0].name }}</div>
                </div>
            </div>

            <DropShadowImg :src="$imgrsz(onplay?.song.cover, 500)" class="cover" v-if="onplay?.song.cover"
                :key="onplay?.song.cover">
            </DropShadowImg>

            <div class="slider">
                <input type="range" name="" id="" min="0" max="1" step="0.001" v-model="audioProgress" class="sld"
                    :style="{ '--progress': audioProgress }" @click.stop>
            </div>
            <div class="tags">
                <span class="time-tag">{{ $fmtsecond(audioState.currentTime) }}</span>
                <span class="quality">{{ $fmtbr(onplay?.track.bitRate as number) }}</span>
                <span class="time-tag">{{ $fmtsecond(audioState.duration as number) }}</span>
            </div>
            <div class="control">

                <button class="control-btn" @click="playerStore.switchPlaymode">
                    <Icon icon="icon-park-outline:loop-once" v-if="playerStore.player.playMode === 'list'" />
                    <Icon icon="iconamoon:playlist-repeat-song-fill" v-if="playerStore.player.playMode === 'loop'" />
                    <Icon icon="iconamoon:playlist-shuffle-fill" v-if="playerStore.player.playMode === 'shuffle'" />
                </button>
                <button class="control-btn" @click.stop="player?.previous">
                    <Icon icon="tabler:player-track-prev-filled" />
                </button>
                <button class="control-btn ct" @click.stop="player?.control.togglePlayPause">
                    <Icon icon="line-md:play-filled" v-if="!audioState.playing" />
                    <Icon icon="mdi:pause" v-else />
                </button>

                <button class="control-btn" @click.stop="player?.next">
                    <Icon icon="tabler:player-track-next-filled" />
                </button>
                <button class="control-btn" @click="switchDisplayMode">
                    <Icon icon="tabler:playlist" v-if="infoDisplayMode === 'lyric'" />
                    <Icon icon="material-symbols:line-weight" v-else />
                </button>
            </div>
        </div>

        <div class="lyric">
            <Lyric v-if="infoDisplayMode === 'lyric' && playingLyric" :key="onplay?.song.id" :lyric="playingLyric">
            </Lyric>
            <PlaylistView v-if="infoDisplayMode === 'list'"></PlaylistView>
        </div>

        <svg style="display: none">
            <defs>
                <filter id="mix-sharp">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="30" result="blur"></feGaussianBlur>
                    <feColorMatrix in="blur" mode="matrix" values="
            1.5 0   0   0   0
            0   1.5 0   0   0
            0   0   1.5 0   0
            0   0   0   25  -12"></feColorMatrix>
                </filter>
            </defs>
        </svg>

    </div>
</template>
<script setup lang="ts">
import { useAppStore } from '@renderer/store/app';
import { usePlayerStore } from '@renderer/store/player';
import ColorThief from 'colorthief';
import { computed, getCurrentInstance, onMounted, onUnmounted, ref, watch } from 'vue';
import Lyric from './Lyric.vue';
import DynamicBackground from './dynamic_background';
import { Icon } from '@iconify/vue';
import { rgb2Hsl } from '../../utils/color';
import DropShadowImg from '../DropShadowImg.vue';
import PlaylistView from './PlaylistView.vue';

const vueInstance = getCurrentInstance()
const player = window.$player

const appStore = useAppStore()
const playerStore = usePlayerStore()
const onplay = computed(() => {
    return playerStore.onplay
})
const audioState = computed(() => {
    return playerStore.audioState
})
const playingLyric = computed(() => playerStore.lyric)

const audioProgress = computed<number>({
    get: () => {
        let duration = playerStore.audioState.duration
        let currentTime = playerStore.audioState.currentTime
        let progress = currentTime / (duration || 0) || 0
        return progress
    },
    set: (value: number) => {
        const duration = playerStore.audioState.duration || 0
        const seek = duration * +value
        player?.control.seek(seek)
    }
})

const backdropBaseColor = ref<number[]>([0, 0, 0])
const dynamicBackgroundCvs = ref<HTMLCanvasElement | null>(null)
let dynamicBackground: DynamicBackground | null
const backgroundGrayLevel = ref<number>(0.5)

const infoDisplayMode = ref<"lyric" | "list">('lyric')


onMounted(() => {
    const colorThief = new ColorThief()

    if (dynamicBackgroundCvs.value) {
        dynamicBackground = new DynamicBackground(dynamicBackgroundCvs.value)
        dynamicBackground.start()
    }

    watch(onplay, (newValue, _) => {
        Promise.resolve().then(() => {
            if (newValue) {
                let img: null | HTMLImageElement = new Image()
                img.crossOrigin = 'anonymous'
                const url = newValue?.song.cover
                if (!url) { return }
                img.src = vueInstance?.appContext.config.globalProperties.$imgrsz(url as string, 200) || url
                img.onload = (e) => {
                    const colors = colorThief.getPalette(e.target as HTMLImageElement, 10, 5)
                    let matchColor = [255, 255, 255];
                    const suitableColor = colors.find(rgbArr => {
                        const [_, s, __] = rgb2Hsl(rgbArr);
                        return s > 0.4;
                    });
                    if (suitableColor) {
                        matchColor = suitableColor;
                    }
                    const [r, g, b] = matchColor
                    dynamicBackground?.setColors(matchColor)
                    backdropBaseColor.value = [r, g, b]
                    let grayLevel = (0.3 * r + 0.59 * g + 0.11 * b) / 255
                    backgroundGrayLevel.value = grayLevel
                }
            }
        })
    }, {
        immediate: true
    })
})

onUnmounted(() => {
    if (dynamicBackground) {
        dynamicBackground.unmount()
        dynamicBackground = null
    }
    // window.gc()
})

function switchDisplayMode() {
    if (infoDisplayMode.value === 'list') {
        infoDisplayMode.value = 'lyric'
    }
    else {
        infoDisplayMode.value = 'list'
    }
}
</script>
<style scoped>
.player {
    width: 100vw;
    height: 100vh;
    position: fixed;
    z-index: 1100;
    background: var(--component);
    overflow: hidden;
    display: flex;
    flex-direction: row;
    box-sizing: border-box;
    padding: 3.5rem 3.6rem;


    .close {
        background: none;
        border: none;
        width: 2.5rem;
        height: 2.5rem;
        position: absolute;
        font-size: 2rem;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1300;
        right: 1.75rem;
        top: 1.75rem;
        border-radius: 0.4rem;
        -webkit-app-region: no-drag;
    }

    .close:hover {
        backdrop-filter: brightness(1.4);
    }
}

.background {
    width: 100%;
    height: 100%;
    position: absolute;
    left: 0;
    bottom: 0;
    z-index: 1101;

    .base-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        filter: blur(50px);
    }

    .backdrop-basecolor {
        width: 100%;
        height: 100%;
        position: absolute;
        left: 0;
        top: 0;
        z-index: 1102;
        opacity: 0.2;
        filter: saturate(2);
    }

    .dynamic-background {
        position: absolute;
        left: 0;
        top: 0;

        filter: url(#mix-sharp) saturate(1) brightness(0.6) contrast(1.2) blur(60px);
        transform: scale(1.2);

        transition: .5s;
        opacity: 0;
    }

    .mask {
        width: 100%;
        height: 100%;
        position: absolute;
        left: 0;
        top: 0;
        background: rgba(0, 0, 0, 0.6);
    }
}

.lyric {
    width: 50%;
    height: 100%;
    overflow-y: hidden;
    margin-left: auto;
    z-index: 1200;
    overscroll-behavior: none;
}

.song {
    width: fit-content;
    height: 100%;
    z-index: 1200;
    display: flex;
    flex-direction: column;
    gap: 0.8rem;

    .song-info {

        display: flex;
        color: white;

        .basic {
            display: flex;
            flex-direction: column;

            .name {
                font-size: 1.4rem;
                font-weight: 500;
                max-width: 22rem;
            }

            .artist {
                font-size: 0.9rem;
                color: rgba(255, 255, 255, 0.75);
            }
        }

    }

    .cover {
        width: 23rem;
        height: 23rem;
        box-shadow: rgba(100, 100, 111, 0.2) 0px 7px 29px 0px;
        margin-bottom: 0.6rem;
        position: relative;

        .layer-1,
        .layer-2 {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            border-radius: 0.5rem;
        }
    }

    .control {
        width: 100%;
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: center;
        gap: 0.5rem;

        .control-btn {
            background: none;
            border: none;
            color: white;
            font-size: 2rem;
            padding: 0.5rem;
            width: fit-content;
            height: fit-content;
            aspect-ratio: 1/1;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            border-radius: 0.5rem;
        }

        .ct {
            font-size: 2.5rem;
            color: rgb(34, 34, 34);
            background: rgb(255, 255, 255);
            border-radius: 50%;
            margin: 0 0.8rem;
        }

        .control-btn:nth-child(1) {
            font-size: 1.4rem;
            margin-right: 0.3rem;
        }

        .control-btn:nth-child(5) {
            font-size: 1.4rem;
            margin-left: 0.3rem;
        }

        .control-btn:hover {
            backdrop-filter: brightness(1.2);
        }
    }

    .tags {
        display: flex;
        width: 100%;
        justify-content: space-between;
        color: white;
        margin-top: -0.3rem;

        .time-tag {
            width: 2rem;
            color: rgba(255, 255, 255, 0.7);
            font-size: 0.82rem;
        }

        .quality {
            font-size: 0.8rem;
            background: rgba(255, 255, 255, 0.1);
            box-sizing: border-box;
            padding: 0.1rem 0.3rem;
            border-radius: 3px;
        }
    }
}

.slider {
    width: 99%;
    display: flex;
    gap: 1rem;
    height: fit-content;
    align-items: center;
    z-index: 1003;

    .sld {
        --height: 7px;
        --track: white;
        --track-bg: rgba(255, 255, 255, 0.324);
        flex: 1;
        -webkit-appearance: none;
        appearance: none;
        height: var(--height);
        background: transparent;
        outline: none;
    }

    .sld::-webkit-slider-runnable-track {
        width: 100%;
        height: var(--height);
        background: linear-gradient(to right,
                var(--track) 0%,
                var(--track) calc(var(--progress, 0.5) * 100%),
                var(--track-bg) calc(var(--progress, 0.5) * 100%),
                var(--track-bg) 100%);
        border-radius: 4px;
        cursor: pointer;
    }

    .sld::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 0;
        height: 0;
        opacity: 0;
    }


}

.coverfade-leave-active {
    transition: .3s;
    position: absolute;
    width: 23rem;
    height: 23rem;
    margin-bottom: 0rem;
}

.coverfade-leave-from {
    opacity: 1
}

.coverfade-leave-to {
    opacity: 0;
}
</style>