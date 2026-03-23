<template>
    <div class="lyric-component">
        <div class="lyric-container" ref="lyricContainer">
                <div class="lyric-list">
            <div class="line" v-for="(line, index) in renderLyrics" :class="{ highlight: line.highlight }"
                :data-index="index" @click="lyricSeek(line.mlyric.lineStartTime)">

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
                        <div class="translate-lyric" v-if="lyricDisplayMode === 'tns'">{{ line.mlyric.translateLyric?.string }}</div>
                        <div class="roma-lyric" v-if="lyricDisplayMode === 'roma'">{{ line.mlyric.romaLyric?.string }}</div>
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
        
        <div class="lyric-control">

           <TabSwitch :items="lyricDisplayModeItems" v-model="lyricDisplayMode" v-if="showLyricTypeSwitch" class="switch"></TabSwitch>
           <div class="d" v-if="showLyricTypeSwitch"></div>
           <button class="btn" @click="lyricOffsetDecrese"><Icon icon="fluent:caret-left-16-filled" /></button>
           <button class="btn" @click="lyricOffsetIncrese"><Icon icon="fluent:caret-right-16-filled" /></button>
           <span class="lyric-offset" v-if="showLyricOffsetTip">{{ (lyricOffset / 1000).toFixed(1) }}s</span>
           <button class="btn" style="margin-left: auto;" @click="saveLyric"><Icon icon="fluent:save-16-regular" /></button>
        </div>
    </div>

</template>
<script setup lang="ts">
import { scrollCenterDistance } from '@renderer/hooks/useScroll';
import { AppTypes } from 'src/types/app';
import { computed, nextTick, onMounted, onUnmounted, ref, WatchHandle } from 'vue';
import { computeHighlightV2 } from './lyric';
import TabSwitch from '../components/TabSwitch.vue';
import { Icon } from '@iconify/vue';

const props = defineProps<{
    lyric: AppTypes.ILyric
}>()

const emits = defineEmits<{
    saveLyric:[],
    lyricSeek:[timems:number]
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

const showLyricTypeSwitch = computed<boolean>(()=>{
    if(!props.lyric.pure && props?.lyric.lyrics.some(lyric=>lyric.type === 'lyric' && lyric.mainLyric && lyric.romaLyric && lyric.translateLyric)){
        return true
    }
    return false
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

const lyricDisplayMode = ref<'roma' | 'tns'>('tns')
const lyricDisplayModeItems = [
    {
        label:'音',
        value:'roma',
    },
    {
        label:'译',
        value:'tns'
    },
]

const lyricOffset = ref<number>(0)
const showLyricOffsetTip = ref<boolean>(false)
let showLyricOffsetTipTimeout:NodeJS.Timeout | null  =null


function startRenderLyric(first:boolean = false) {
    if (!window.$player?.waudio.paused) {
        const now = Date.now()
        if((now - lastLyricComputeTime > lyricComputeInterval) || first){
            lastLyricComputeTime = now
            updateLyricState()
        }
    }
    requestAnimationId = requestAnimationFrame(()=>startRenderLyric())
}

function updateLyricState() {
    if (window.$player?.waudio) {
        const currentTime = window.$player.waudio.currentTime
        const timems = currentTime * 1000

        highlightWordIndex.value = 0
        highlightGapProgress.value = 0

        const timeState = computeHighlightV2(props.lyric.lyrics, timems + lyricOffset.value)
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

function lyricSeek(timems:number){
    emits('lyricSeek',timems)
}


function onResize() {
    nextTick().then(() => {
        scrollLyric(highlightIndex.value)
    })
}

function lyricOffsetIncrese(){
    lyricOffset.value += 200
    lyricOffsetTip()
}
function lyricOffsetDecrese(){
    lyricOffset.value -= 200
    lyricOffsetTip()
}
function lyricOffsetTip(){
     showLyricOffsetTip.value = true
    if(showLyricOffsetTipTimeout){
        clearTimeout(showLyricOffsetTipTimeout)
    }
    showLyricOffsetTipTimeout = setTimeout(() => {
        showLyricOffsetTip.value = false
    }, 1000);
}

 function saveLyric() {
    emits('saveLyric')
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
    overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.lyric-container{
    width: 100%;
    flex: 1;
    overflow: auto;
    -webkit-mask: linear-gradient(180deg,#000 75%, transparent 100%);
}

.lyric-container::-webkit-scrollbar {
    display: none;
}

.lyric-control{
    width: 100%;
    height: fit-content;
    display: flex;
    align-items: center;
    gap: 0.5rem;

    .d{
        height: 80%;
        width: 1.5px;
        background: rgba(255, 255, 255, 0.1);
    }

    .switch{
        height: 1.6rem;
    }

    .btn{
        height: 1.6rem;
        font-size: 1.3rem;
        box-sizing: border-box;
        display: flex;
        align-items: center;
        justify-content: center;
        border: none;
        background: none;
        color:rgba(255, 255, 255, 0.65);
        aspect-ratio: 1/1;
        border-radius: var(--br-1);
        cursor: pointer;
    }

    .btn:hover{
        background: rgba(255, 255, 255, 0.2);
    }

    .lyric-offset{
         color:rgba(255, 255, 255, 0.65);
         font-size: 0.9rem;
    }
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
        cursor: pointer;
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