<template>
    <div class="audio-match">
        <div class="matching" v-if="!useFileMatch">
            <canvas class="wave-display" ref="waveCanvas" v-show="isRecording"></canvas>
            <!-- <div class="cvsrp tip" v-show="!isRecording">单击下方按钮开始采样</div> -->
            <div class="record-info" v-if="isRecording">
                <span>已录制缓冲区 {{ recordedBuffLength }} 字节</span>
                <span>剩余 {{ (sampleDuration - recordedDuration).toFixed(2) }} 秒</span>
            </div>
            <div class="control">
                <button class="btn" :class="{ mixin: isMicMixin }" @click="switchMicMixin">
                    <Icon icon="fluent:mic-16-regular" />混合麦克风
                </button>
                <button class="btn ctn" @click="startRecordingMedia">
                    <Icon icon="fluent:mic-pulse-20-regular" />
                </button>
                <button class="btn" @click="useFileMatch = true">
                    <Icon icon="fluent:crop-20-filled" />从文件截取
                </button>
            </div>
        </div>
        <div class="viewfile" v-else>
            
            <div class="control">
                <button @click="useFileMatch = false">
                    <Icon icon="fluent:arrow-hook-up-left-28-filled" />返回采样
                </button>
            </div>
        </div>

        <div class="result" v-if="matchedResult.length">
            <div class="title">找到结果</div>
            <SongMiniCard  :song="song" v-for="song in matchedResult"></SongMiniCard>
        </div>

    </div>
</template>
<script setup lang="ts">
import { GenerateFP } from '@renderer/lib/audio_fingerprint/afp';
import { AudioMediaRecorder } from '@renderer/script/recorder/recoder';
import { nextTick, onMounted, onUnmounted, ref } from 'vue';
import { Icon } from '@iconify/vue';
import { AppTypes } from 'src/types/app';
import SongMiniCard from './SongMiniCard.vue';

const sampleRate = ref<number>(8000)
const waveCanvas = ref<HTMLCanvasElement | null>(null)
const isRecording = ref<boolean>(false)
const isMicMixin = ref<boolean>(false)
const recordedBuffLength = ref<number>(0)
const sampleDuration = 3
const recordedDuration = ref<number>(0)
const matchedResult = ref<AppTypes.ISong[]>([])
const useFileMatch = ref<boolean>(false)

class WaveDrawer {
    private cvs: HTMLCanvasElement
    private ctx: CanvasRenderingContext2D
    private maxBarCount: number = 128
    private barColor: string = '#e11d48'
    private dpr: number = 1

    constructor(cvs: HTMLCanvasElement) {
        this.cvs = cvs
        this.ctx = cvs.getContext('2d') as CanvasRenderingContext2D
        this.initDPI()
    }

    public initDPI() {
        nextTick().then(() => {
            this.dpr = window.devicePixelRatio || 1
            const rect = this.cvs.getBoundingClientRect()
            console.log(rect)
            this.cvs.width = rect.width * this.dpr
            this.cvs.height = rect.height * this.dpr
        })
    }

    public drawBuff(buff: Float32Array, maxBuffLength: number = 0) {
        const drawValue = this.mapBuffToCount(buff, maxBuffLength)
        this.ctx.clearRect(0, 0, this.cvs.width, this.cvs.height)
        const prec = buff.length / maxBuffLength
        const recordPtrX = this.cvs.width * prec
        this.ctx.fillStyle = this.barColor
        if (buff.length < maxBuffLength) {
            this.ctx.fillRect(recordPtrX, 0, 2, this.cvs.height)
        }
        const barWidth = this.cvs.width / this.maxBarCount
        const barSpacing = Math.max(1, barWidth * 0.2)
        const actualBarWidth = barWidth - barSpacing

        for (let i = 0; i < this.maxBarCount; i++) {
            const value = drawValue[i]
            if (value === undefined) continue
            const barHeight = value * this.cvs.height
            const x = i * barWidth + barSpacing / 2
            const y = (this.cvs.height - barHeight) / 2
            this.ctx.fillRect(x, y, actualBarWidth, barHeight)
        }
    }

    public mapBuffToCount(buff: Float32Array, maxBuffLength: number): number[] {
        const fullBuff = new Float32Array(maxBuffLength)
        fullBuff.set(buff.slice(0, Math.min(buff.length, maxBuffLength)), 0)
        const samplesPerBar = Math.floor(maxBuffLength / this.maxBarCount)
        const drawValue = new Array<number>(this.maxBarCount).fill(0)
        for (let barIndex = 0; barIndex < this.maxBarCount; barIndex++) {
            const startSample = barIndex * samplesPerBar
            const endSample = Math.min(startSample + samplesPerBar, maxBuffLength)
            if (startSample >= maxBuffLength) break
            let maxAmplitude = 0
            for (let sampleIndex = startSample; sampleIndex < endSample; sampleIndex++) {
                const amplitude = Math.abs(fullBuff[sampleIndex])
                if (amplitude > maxAmplitude) {
                    maxAmplitude = amplitude
                }
            }
            drawValue[barIndex] = maxAmplitude
        }

        return drawValue
    }

    public clear() {
        this.ctx.clearRect(0, 0, this.cvs.width, this.cvs.height)
    }
}

let waveDrawer: WaveDrawer | null = null
let recorder: AudioMediaRecorder | null = null

onMounted(() => {
    const cvs = waveCanvas.value
    if (cvs) {
        waveDrawer = new WaveDrawer(cvs)
    }
    recorder = new AudioMediaRecorder({ sampleRate: Number(sampleRate.value) })
})

onUnmounted(()=>{
    recorder?.destory()
})

async function startRecordingMedia() {
    if (isRecording.value) {
        return
    }
    isRecording.value = true
    recordedBuffLength.value = 0
    recordedDuration.value = 0
    matchedResult.value = []
    if (recorder) {
        recorder.clearRecord()
    }
    if (waveDrawer) {
        waveDrawer.clear()
        waveDrawer.initDPI()

    }
    const systemMediaSource = await window.mediaapi.desktopCapture({ types: ['screen'] })
    if (systemMediaSource) {
        const mediaStream = await navigator.mediaDevices.getDisplayMedia({
            audio: true,
            video: false
        })
        if (mediaStream && recorder) {
            const maxBuffLength = sampleDuration * sampleRate.value
            const buff = await recorder.startRecord(mediaStream, { maxBuffLength, pipeOutput: true }, (b) => {
                if (waveDrawer) {
                    waveDrawer.drawBuff(b, maxBuffLength)
                }
                recordedBuffLength.value = b.length
                recordedDuration.value = b.length / maxBuffLength * sampleDuration
            })
            await matchAudioBuffer(buff)
            recorder.clearRecord()
            
        }
    }
    isRecording.value = false
}

async function matchAudioBuffer(f32buff:Float32Array<ArrayBufferLike>) {
    const afp = await GenerateFP(f32buff)
    const result = await window.ncmapi.audioFingerprintMatch(afp,sampleDuration)
    matchedResult.value = result
}


function switchMicMixin() {
    isMicMixin.value = !isMicMixin.value
}
</script>
<style scoped>
.audio-match {
    width: 19.2rem;
    height: fit-content;
    background: var(--component);
    position: absolute;
    top: 3.4rem;
    left: 12rem;
    z-index: 90;
    transform-origin: top center;
    border-radius: var(--br-2);
    box-shadow: var(--shadow-md);
    box-sizing: border-box;
    padding: 0.5rem;
    overflow-y: auto;
    color: var(--text-1);

    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.title {
    color: var(--text-1);
    font-size: 0.9rem;
}

.mixin {
    background: var(--component-light) !important;
}

.matching {
    width: 100%;
    height: fit-content;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;

    .record-info{
        width: 100%;
        display: flex;
        justify-content: space-between;
        box-sizing: border-box;
        padding: 0 0.3rem;
        color: var(--text-3);
        font-size: 0.8rem;
    }

    .control {
        display: flex;
        width: 100%;
        justify-content: space-around;
        align-items: center;

        .btn {
            display: flex;
            align-items: center;
            gap: 0.3rem;
            padding: 0.3rem 0.3rem;
            background: var(--component);
            border-radius: var(--br-1);
            color: var(--text-2);
            font-size: 0.9rem;
            border: none;
            border-radius: var(--br-1);
            cursor: pointer;
        }

        .btn:hover {
            background: var(--hover);
        }

        .ctn {
            color: var(--text-1);
            font-size: 1.9rem;
            background: var(--component-light);
            border-radius: 50%;
            padding: 0.5rem;
        }
    }

    .wave-display {
        width: 100%;
        height: 5rem;
        border-radius: var(--br-2);
    }

    .tip{
        width: 100%;
        height: 5rem;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--text-2);
        font-size: 0.9rem;
        border-radius: var(--br-2);
    }


}

.result{
    display: flex;
    flex-direction: column;
    width: 100%;
    gap: 0.3rem;
}
</style>