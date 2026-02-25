<template>
    <div class="lyric-component" ref="lyricContainer">
        <div class="lyric-list" >
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
import { usePlayerStore } from '@renderer/store/player';
import { AppTypes } from 'src/types/app';
import { computed, getCurrentInstance, nextTick, onMounted, onUnmounted, ref, watch, WatchHandle } from 'vue';
const playerStore = usePlayerStore()
const vueInstance = getCurrentInstance()
const player = vueInstance?.appContext.config.globalProperties.$player

interface RenderLyric {
    mlyric: AppTypes.MLyric.CombineLine,
    highlight: boolean,
    highlightWord: number,
    isGap: boolean,
    gapPassProgress: number
}

const rawLyric = computed<AppTypes.MLyric.CombineLine[]>(() => {
    return playerStore.lyric?.lyrics || []
})

const renderLyrics = computed<RenderLyric[]>(() => {
    const renderLyrics: RenderLyric[] = []
    for (const lyric of rawLyric.value) {
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

function computeHighlight(time: number) {
    const timems = time * 1000
    const lyrics = rawLyric.value

    for (let i = 0; i < lyrics.length; i++) {
        const lyric = lyrics[i]
        if (timems >= lyric.lineStartTime && timems < lyric.lineStartTime + lyric.lineDuration) {
            highlightIndex.value = i
            break
        }
    }
    if (highlightIndex.value === -1) {
        for (let i = lyrics.length - 1; i >= 0; i--) {
            const lyric = lyrics[i]
            if (timems >= lyric.lineStartTime) {
                highlightIndex.value = i
                if (timems >= lyric.lineStartTime + lyric.lineDuration) {
                    highlightWordIndex.value = -2
                }
                break
            }
        }
    }
    if (highlightIndex.value >= 0 && highlightIndex.value < lyrics.length) {
        const highlightLine = lyrics[highlightIndex.value]
        if (highlightLine.type === 'gap') {

            const gapStart = highlightLine.lineStartTime
            const gapPass = (timems - gapStart) / highlightLine.lineDuration
            highlightGapProgress.value = gapPass

        } else if (highlightLine.mainLyric?.isTimeline) {
            const mainLyric = highlightLine.mainLyric
            let foundWord = false
            for (let i = 0; i < mainLyric.words.length; i++) {
                const word = mainLyric.words[i]

                if (timems >= word.startTime && timems < word.startTime + word.duration) {
                    highlightWordIndex.value = i
                    break
                }
            }
            if (!foundWord && mainLyric.words.length > 0) {
                const lastWord = mainLyric.words[mainLyric.words.length - 1]
                if (timems >= lastWord.startTime) {
                    highlightWordIndex.value = mainLyric.words.length - 1
                }
            }
        }
    }
}

function renderLyric() {

    if (player?.waudio && !player.waudio.paused) {
        const currentTime = player.waudio.currentTime
        computeHighlight(currentTime)
    }
    requestAnimationId = requestAnimationFrame(renderLyric)
}

function scrollLyric(index: number) {
    const container = lyricContainer.value
    if (container) {
        if (index < 0) {
            console.log("滚动到开头")
            container.scrollTo({
                top:0,
                behavior:'instant'
            })
            return
        }
        if (pauseScroll) {
            return
        }
        const lines = Array.from(container.querySelectorAll('.line'))
        const hltLine = lines[index] as HTMLElement
        const scrollDistance = scrollCenterDistance(hltLine,container)
        container.scrollTo({
            top:scrollDistance,
            behavior:'smooth'
        })
    }
}


function onContainerScroll(){
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
        lyricContainer.value.addEventListener('scroll',onContainerScroll)
    }

    window.addEventListener('resize', onResize)

    highlightIndexWatcher = watch(highlightIndex, () => {
        requestAnimationFrame(()=>{
             scrollLyric(highlightIndex.value)
        })
    }, {
        immediate: true
    })

    lyricWatcher = watch(rawLyric, () => {
       highlightIndex.value = -1
        nextTick().then(() => {
            scrollLyric(-1)
        })
    })

    //初始化加载一下
    if (player) {
        const currentTime = player.waudio.currentTime
        computeHighlight(currentTime)
    }
    renderLyric()
})

onUnmounted(() => {

    window.removeEventListener('resize', onResize)

    if (lyricContainer.value) {
        lyricContainer.value.removeEventListener('scroll',onContainerScroll)
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