<template>
    <div class="tray" v-if="onplay">

        <div class="song" @click="songCardClick">
            <img :src="$imgrsz(onplay.song.cover, 200)" alt="" class="cover" v-if="onplay.song.cover">
            <div class="info">
                <div class="name single-line">{{ onplay.song.name }}</div>
                <ArtistName :artists="onplay.song.artists"></ArtistName>
            </div>
        </div>

        <div class="control">
           
            <div class="buttons">
                <button>
                    <Icon icon="fluent:arrow-shuffle-20-filled" v-if="playMode === 'shuffle'"/>
                    <Icon icon="fluent:arrow-repeat-all-20-filled" v-if="playMode === 'listloop'" />
                    <Icon icon="fluent:arrow-repeat-1-20-filled" v-if="playMode === 'loop'"/>
                    <Icon icon="fluent:text-column-one-20-filled" v-if="playMode === 'list'"/>
                </button>
                <button @click="previous">
                    <Icon icon="fluent:previous-16-filled" />
                </button>
                <button @click="togglePlay">
                    <Icon icon="fluent:play-12-filled" v-if="!audioState.playing" />
                    <Icon icon="fluent:pause-12-filled" v-else />
                </button>
                <button @click="next">
                    <Icon icon="fluent:next-16-filled" />
                </button>
                <button @click.stop="appStore.openSidePlaylist">
                    <Icon icon="fluent:navigation-play-20-filled" />
                </button>
            </div>

             <div class="slider">
                <span class="time-tag">{{ $fmtsecond(audioState.currentTime) }}</span>
                <input type="range" name="" id="" min="0" max="1" step="0.001" v-model="progress" class="sld"
                    :style="{ '--progress': progress }">
                <span class="time-tag">{{ $fmtsecond(audioState.duration || 0) }}</span>
            </div>
        </div>

        <div class="action">
            <button @click="FunctionalWindows.showEqualizerWindow">
                <Icon icon="fluent:device-eq-20-filled" />
            </button>
        </div>
    </div>
</template>
<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { useAppStore } from '@renderer/store/app';
import { usePlayerStore } from '@renderer/store/player';
import { computed, getCurrentInstance, onMounted, ref, watch } from 'vue';
import ArtistName from './ArtistName.vue';
import FunctionalWindows from './windows';



const appStore = useAppStore()
const vueInstance = getCurrentInstance()
const accentColor = ref<string>('rgba(0,0,0,0)')
const playerStore = usePlayerStore()
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
        vueInstance?.appContext.config.globalProperties.$player.control.seek(seek)
    }
})
const onplay = computed(() => {
    return playerStore.onplay
})
const audioState = computed(() => {
    return playerStore.audioState
})
const playMode = computed(()=>playerStore.player.playMode)
function togglePlay() {
    vueInstance?.appContext.config.globalProperties.$player.control.togglePlayPause()
}
function next() {
    vueInstance?.appContext.config.globalProperties.$player.next()
}
function previous() {
    vueInstance?.appContext.config.globalProperties.$player.previous()
}
function songCardClick() {
    appStore.toggleShowMusicPlayer()
}
onMounted(() => {
})

</script>
<style scoped>
.mask {
    width: 100%;
    height: 120%;
    position: absolute;
    z-index: 1000;
    left: 0;
    background: linear-gradient(to top, var(--app), transparent);
}

.tray {

    width: 100%;
    height:5.1rem;
    background: var(--component);
    justify-content: center;
    box-sizing: border-box;
    padding: 0.5rem 1rem;
    z-index: 100;
    border: 1px solid var(--border);
    gap: 0.5rem;
    overflow: hidden;
    position: relative;

    display: grid;
    grid-template-columns: 0.6fr 1fr 0.6fr;
    grid-template-rows: 1fr;

    align-items: center;
}
.song {
    width:100%;
    display: flex;
    flex-direction: row;
    align-items: center;
    box-sizing: border-box;
    height: fit-content;
    padding: 0.5rem;
    color: var(--text-1);
    gap: 0.5rem;
    border-radius: var(--br-1);
    cursor: pointer;
    transition: .1s;


    .cover {
        height: 2.8rem;
        aspect-ratio: 1/1;
        border-radius: var(--br-2);
        object-fit: cover;
    }

    .info {
        height: fit-content;

        .name {
            font-size: 1.05rem;
            color: var(--text-1);
            max-width: 12rem;
        }

        .artist {
            color: var(--text-2);
            font-size: 0.8rem;
            max-width: 12rem;
        }
    }
}

.song:hover {
    backdrop-filter: brightness(1.2);
}


.control {
    width: 100%;
    display: flex;
    flex-direction: column;
    height: 100%;
    box-sizing: border-box;

    .buttons{
        display: flex;
        flex-direction: row;
        width: 100%;
        justify-content: center;
        gap: 1rem;
        align-items: center;
    }


    button {
        height: fit-content;
        flex-shrink: 0;
        background: none;
        border: none;
        color: var(--text-1);
        font-size: 1.6rem;
        box-sizing: border-box;
        
        padding: 0.2rem;
        aspect-ratio: 1/1;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--br-2);
    }

    button:hover {
        backdrop-filter: brightness(1.2);
    }

    button:nth-child(3) {
        font-size: 2.5rem;
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
        --height: 6px;
        --track: var(--text-1);
        --track-bg: var(--component-light);
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

    .time-tag {
        width: 2rem;
        color: var(--text-2);
        font-size: 0.85rem;
    }
}

.action{
    display: flex;
    flex-direction: row;
    width: 100%;
    justify-content: end;

    button {
        height: fit-content;
        flex-shrink: 0;
        background: none;
        border: none;
        color: var(--text-1);
        font-size: 1.5rem;
        box-sizing: border-box;
        
        padding: 0.2rem;
        aspect-ratio: 1/1;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--br-2);
    }

    button:hover {
        backdrop-filter: brightness(1.2);
    }
}
</style>