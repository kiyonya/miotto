<template>
    <div class="lyric-component" ref="lyricContainer">
        <div class="lyric-list">
            <div class="line" v-for="(line, index) in renderLyrics" :class="{ highlight: line.highlight }"
                :data-index="index">

                <template v-if="line.mlyric.type === 'lyric'">
                    <div class="lyric">
                        <div class="main-lyric">
                            <template v-if="line.mlyric.mainLyric.isTimeline">
                                <template v-for="(char, index) in line.mlyric.mainLyric.words">
                                    <span class="char char-complete" v-if="index < line.highlightWord">{{ char.char
                                    }}</span>
                                    <span class="char char-running" v-if="index === line.highlightWord"
                                        :style="`--dt:${char.duration / 1000}s`" :data-text="char.char">
                                        {{ char.char }}
                                    </span>
                                    <span class="char char-wait" v-if="index > line.highlightWord">{{ char.char
                                    }}</span>
                                </template>

                            </template>

                            <template v-else>
                                <span class="string">{{ line.mlyric.mainLyric.string }}</span>
                            </template>

                        </div>
                        <div class="translate-lyric">{{ line.mlyric.translateLyric?.string }}</div>
                        <div class="roma-lyric"></div>
                    </div>
                </template>

                <template v-if="line.mlyric.type === 'sublyric'">

                    <div class="sublyric">
                        <div class="main-lyric">
                            <template v-if="line.mlyric.mainLyric.isTimeline">
                                <template v-for="(char, index) in line.mlyric.mainLyric.words">
                                    <span class="char char-complete" v-if="index < line.highlightWord">{{ char.char
                                    }}</span>
                                    <span class="char char-running" v-if="index === line.highlightWord"
                                        :style="`--dt:${char.duration / 1000}s`" :data-text="char.char">
                                        {{ char.char }}
                                    </span>
                                    <span class="char char-wait" v-if="index > line.highlightWord">{{ char.char
                                    }}</span>
                                </template>

                            </template>

                            <template v-else>
                                <span class="string">{{ line.mlyric.mainLyric.string }}</span>
                            </template>

                        </div>
                        <div class="translate-lyric">{{ line.mlyric.translateLyric?.string }}</div>
                        <div class="roma-lyric"></div>
                    </div>

                </template>

                <template v-if="line.mlyric.type === 'gap'">
                    <div class="gap">
                        <div class="ball" :style="`--progress:${Math.max(Math.min(line.gapPassProgress * 3, 1), 0.1)}`">
                        </div>
                        <div class="ball"
                            :style="`--progress:${Math.max(Math.max(0, Math.min((line.gapPassProgress - 1 / 3) * 3, 1)), 0.1)}`">
                        </div>
                        <div class="ball"
                            :style="`--progress:${Math.max(Math.max(0, Math.min((line.gapPassProgress - 2 / 3) * 3, 1)), 0.1)}`">
                        </div>
                    </div>
                </template>
            </div>

        </div>
    </div>

</template>
<script setup lang="ts">
import { scrollCenterDistance } from '@renderer/hooks/useScroll';
import { AppTypes } from 'src/types/app';
import { computed, nextTick, onMounted, onUnmounted, ref, WatchHandle } from 'vue';
import { computeHighlightV2 } from './lyric';

const props = defineProps<{
    lyric: AppTypes.ILyric
}>()

interface RenderLyric {
    mlyric: AppTypes.MLyric.CombineLine,
    highlight: boolean,
    highlightWord: number,
    isGap: boolean,
    gapPassProgress: number
}

const renderLyrics = computed<RenderLyric[]>(() => {
    const renderLyrics: RenderLyric[] = []
    for (const lyric of props.lyric.lyrics) {
        renderLyrics.push({
            mlyric: lyric,
            highlight: false,
            highlightWord: -1,
            isGap: lyric.type === 'gap',
            gapPassProgress: -1
        })
    }
    if (highlightIndex.value >= 0) {
        const highlightLine = renderLyrics[highlightIndex.value]
        if (highlightLine) {
            highlightLine.highlight = true
            highlightLine.highlightWord = highlightWordIndex.value
            if (highlightLine.isGap) {
                highlightLine.gapPassProgress = highlightGapProgress.value
            }
        }
    }
    return renderLyrics
})

const highlightIndex = ref<number>(-1)
const highlightWordIndex = ref<number>(-1)
const highlightGapProgress = ref<number>(-1)
const lyricContainer = ref<HTMLElement | null>(null)
let requestAnimationId: number | null = null
let highlightIndexWatcher: WatchHandle | null = null
let lyricWatcher: WatchHandle | null = null
let pauseScroll: boolean = false
let lyricScrollRestoreTimeout: NodeJS.Timeout | null = null
let lastIndex: number = -Infinity
let lyricComputeInterval:number =50
let lastLyricComputeTime:number = 0

function startRenderLyric() {
    if (!window.$player?.waudio.paused) {
        const now = Date.now()
        if(now - lastLyricComputeTime > lyricComputeInterval){
            lastLyricComputeTime = now
            updateLyricState()
        }
    }
    requestAnimationId = requestAnimationFrame(startRenderLyric)
}

function updateLyricState() {
    if (window.$player?.waudio) {
        const currentTime = window.$player.waudio.currentTime
        const timems = currentTime * 1000

        highlightWordIndex.value = 0
        highlightGapProgress.value = 0

        const timeState = computeHighlightV2(props.lyric.lyrics, timems)
        highlightIndex.value = timeState.lineIndex

        if (timeState.lineIndex !== lastIndex) {
            lastIndex = timeState.lineIndex
            scrollLyric(timeState.lineIndex)
        }

        if (timeState.gapProgress) {
            highlightGapProgress.value = timeState.gapProgress
        }
        if (timeState.wordIndex) {
            highlightWordIndex.value = timeState.wordIndex
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
        const lines = Array.from(container.querySelectorAll('.line'))
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
        scrollLyric(highlightIndex.value)
    }, 1000);
}


function onResize() {
    nextTick().then(() => {
        scrollLyric(highlightIndex.value)
    })
}

onMounted(() => {
    if (lyricContainer.value) {
        lyricContainer.value.addEventListener('scroll', onContainerScroll)
    }
    window.addEventListener('resize', onResize)
    updateLyricState()
    startRenderLyric()
})

onUnmounted(() => {

    window.removeEventListener('resize', onResize)

    if (lyricContainer.value) {
        lyricContainer.value.removeEventListener('scroll', onContainerScroll)
    }

    if (requestAnimationId) {
        cancelAnimationFrame(requestAnimationId)
    }
    highlightIndexWatcher?.stop()
    highlightIndexWatcher = null
    lyricWatcher?.stop()
    lyricWatcher = null
    lyricContainer.value = null
})
</script>
<style scoped>
@keyframes ani {
    from {
        clip-path: polygon(0 0, 0 0, 0 100%, 0% 100%);
    }

    to {
        clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
    }
}


.lyric-component {
    width: 100%;
    height: 100%;
    overflow: auto;
}

.lyric-component::-webkit-scrollbar {
    display: none;
}

.lyric-list {

    --common: rgba(255, 255, 255, 0.4);
    --highlight: rgba(255, 255, 255, 1);
    --line-gap: 1.8rem;

    height: fit-content;
    font-size: 1rem;
    display: flex;
    flex-direction: column;

    .line {
        display: flex;
        flex-direction: column;
    }

    .line:first-child {
        margin-top: 50%;
    }

    .line:last-child {
        margin-bottom: 50%;
    }

    .lyric {
        display: flex;
        flex-direction: column;
        margin-bottom: var(--line-gap);

        .main-lyric {

            .string,
            .char {
                font-size: 1.8rem;
                color: var(--common);
            }
        }

        .translate-lyric,
        .roma-lyric {
            font-size: 1rem;
            color: var(--common);

        }
    }

    .sublyric {
        display: flex;
        flex-direction: column;
        text-align: right;
        margin-bottom: var(--line-gap);

        .main-lyric {

            .string,
            .char {
                font-size: 1.4rem;
                color: var(--common);
                display: inline-block;
            }

            .char::before {
                font-size: 1.4rem;
            }
        }

        .translate-lyric,
        .roma-lyric {
            font-size: 1rem;
            color: var(--common);
        }
    }

    .gap {

        display: flex;
        flex-direction: row;
        justify-content: center;
        gap: 0.5rem;
        margin-bottom: var(--line-gap);

        /* transform: scale(0) translateY(-10px); */
        transform-origin: top center;
        /* transition: .2s; */
        width: 5.5rem;

        .ball {
            width: 0;
            aspect-ratio: 1/1;
            background: var(--highlight);
            border-radius: 50%;
            opacity: 0;
            transition: .2s;
        }
    }
}



.highlight {

    .translate-lyric,
    .roma-lyric,
    .string {
        color: var(--highlight) !important;
    }

    .char,
    .string {
        position: relative;
        font-weight: 500;
        transition: .2s;
    }


    .lyric {

        /* .char,
        .string {
            font-size: 2.1rem !important;
        } */

        .char-complete {
            color: var(--highlight) !important;
        }

        .char-running {
            color: var(--common);
        }

        .char-running::before {
            content: attr(data-text);
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            animation: ani var(--dt) linear forwards;
            color: var(--highlight) !important;
        }

        .char-wait {
            color: var(--common) !important;
        }
    }

    .sublyric {
        .char-complete {
            color: var(--highlight) !important;
        }

        .char-running {
            color: var(--common);
        }

        .char-running::before {
            content: attr(data-text);
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            animation: ani var(--dt) linear forwards;
            color: var(--highlight) !important;
            text-align: right;
        }

        .char-wait {
            color: var(--common) !important;
        }
    }


    .gap {
        .ball {
            width: 1.2rem;
            opacity: var(--progress, 0) !important;
        }
    }
}
</style>