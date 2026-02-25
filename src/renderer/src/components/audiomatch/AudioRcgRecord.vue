<template>
    <div class="matching">
        <canvas class="wave-display" ref="waveCanvas" v-show="isRecording"></canvas>
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
            <button class="btn" @click="emits('switchMode')">
                <Icon icon="fluent:crop-20-filled" />从文件截取
            </button>
        </div>
    </div>
</template>
<script setup lang="ts">
import { GenerateFP } from '@renderer/lib/audio_fingerprint/afp';
import { AudioMediaRecorder } from '@renderer/script/recorder/recoder';
import { onMounted, onUnmounted, ref } from 'vue';
import { Icon } from '@iconify/vue';
import WaveDrawer from './wavedrawer';

const emits = defineEmits<{
    afp:[audioFP:string,duration:number],
    start:[],
    switchMode:[]
}>()

const sampleRate = ref<number>(8000)
const waveCanvas = ref<HTMLCanvasElement | null>(null)
const isRecording = ref<boolean>(false)
const isMicMixin = ref<boolean>(false)
const recordedBuffLength = ref<number>(0)
const sampleDuration = 3
const recordedDuration = ref<number>(0)

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
    emits('start')
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
            await computedAudioFingerprint(buff)
            recorder.clearRecord()
            
        }
    }
    isRecording.value = false
}

async function computedAudioFingerprint(f32buff:Float32Array<ArrayBufferLike>) {
    const afp = await GenerateFP(f32buff)
    emits('afp',afp,sampleDuration)
}


function switchMicMixin() {
    isMicMixin.value = !isMicMixin.value
}

</script>
<style scoped>
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

</style>