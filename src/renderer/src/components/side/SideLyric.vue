<template>
    <div class="lyric-view" v-if="lyric && !lyric.pure" ref="lyricContainer">
        <div class="lyric-item" v-for="(l,i) in lyric.lyrics" :data-index="i" :class="{highlight:i === highlightIndex}">
            <template v-if="l.type === 'lyric' || l.type === 'sublyric'">
                <div class="main">{{ l.mainLyric.string }}</div>
                <div class="sub">{{ l.translateLyric?.string }}</div>
            </template>
        </div>
    </div>
</template>
<script setup lang="ts">
import { AppTypes } from 'src/types/app';
import { computeHltLineIndex } from '../musicplayer/lyric';
import { nextTick, onMounted, onUnmounted, ref } from 'vue';
import { scrollCenterDistance } from '@renderer/hooks/useScroll';

const props = defineProps<{
    lyric: AppTypes.ILyric
}>()

const lyricContainer = ref<HTMLDivElement | null>(null)

let requestAnimationId: number | null = null
let pauseScroll: boolean = false
let lastIndex: number | undefined = undefined
let lyricScrollRestoreTimeout: NodeJS.Timeout | null = null
const highlightIndex = ref<number>(-1)

function startRenderLyric(first: boolean = false) {
    if (!window.$player?.waudio.paused) {
        updateLyricState()
    }
    requestAnimationId = requestAnimationFrame(() => startRenderLyric())
}

function updateLyricState() {
    if (window.$player.waudio) {
        const currentTime = window.$player.waudio.currentTime
        const timems = currentTime * 1000
        const index: number = computeHltLineIndex(props.lyric.lyrics, timems) || 0
        if (index !== highlightIndex.value) {
            highlightIndex.value = index
            scrollLyric(index)
        }
    }
}

function scrollLyric(index: number) {
    const container = lyricContainer.value
    if (container) {
        if (index < 0) {
            container.scrollTo({
                top: 0,
                behavior: 'instant'
            })
            return
        }
        if (pauseScroll) {
            return
        }
        const lines = Array.from(container.querySelectorAll('.lyric-item'))
        const hltLine = lines[index] as HTMLElement
        const scrollDistance = scrollCenterDistance(hltLine, container)
        container.scrollTo({
            top: scrollDistance,
            behavior: 'smooth'
        })
    }
}

function onContainerScroll() {
    pauseScroll = true
    if (lyricScrollRestoreTimeout) {
        clearTimeout(lyricScrollRestoreTimeout)
    }
    lyricScrollRestoreTimeout = setTimeout(() => {
        pauseScroll = false
        updateLyricState()
    }, 1000);
}

function onResize() {
    nextTick().then(() => {
        updateLyricState()
    })
}


onMounted(() => {
    if (lyricContainer.value) {
        lyricContainer.value.addEventListener('scroll', onContainerScroll)
    }
    window.addEventListener('resize', onResize)
    updateLyricState()
    startRenderLyric(true)
})

onUnmounted(() => {
    window.removeEventListener('resize', onResize)
    if (lyricContainer.value) {
        lyricContainer.value.removeEventListener('scroll', onContainerScroll)
    }
    if (requestAnimationId) {
        cancelAnimationFrame(requestAnimationId)
    }
    lyricContainer.value = null
})
</script>
<style scoped>
.lyric-view {
    height: 100%;
    width: 100%;
    overflow-y: auto;
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    gap: 1rem;

    .lyric-item:first-child{
        margin-top: 50%;
    }

    .lyric-item:last-child{
        margin-bottom: 50%;
    }

    .lyric-item {
        display: flex;
        flex-direction: column;
        color: white;

        .main {
            color: white;
            opacity: 0.7;
            font-size: 1.2rem;
            
        }

        .sub {
            color: white;
            opacity: 0.5;
            font-size: 0.8rem;
        }
    }
}

.lyric-view::-webkit-scrollbar {
    display: none;
}

.highlight{
    .main{
        opacity: 1 !important;
        font-weight: 500;
    }
    .sub{
        opacity: 0.9 !important;
    }
}
</style>