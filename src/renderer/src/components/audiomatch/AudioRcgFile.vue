<template>
    <div class="filematch">
        <canvas class="wave" ref="waveCanvas"></canvas>
        <input type="file" name="" id="" accept="audio/*" @change="handleFileUpload">
        <audio :src="audioPlayURL"></audio>
    </div>
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue';
import WaveDrawer from './wavedrawer';

const emits = defineEmits<{
    afp:[audioFP:string,duration:number],
    start:[],
    switchMode:[]
}>()




const waveCanvas = ref<HTMLCanvasElement | null>(null)
let waveDrawer:WaveDrawer | null = null
const audioPlayURL = ref<string>('')
onMounted(()=>{
    if(waveCanvas.value){
        waveDrawer = new WaveDrawer(waveCanvas.value,256)
    }
})

async function handleFileUpload(event:Event){
    //@ts-ignore
    const files = event.target.files as FileList
    const file = files[0]
    audioPlayURL.value = URL.createObjectURL(file)
    const fileReader = new FileReader()
    fileReader.onload = async (e)=>{
        const buff = e.target?.result as ArrayBuffer
        if(buff){
            try {
               const audioCtx = new AudioContext({sampleRate:8000}) 
               const audioBuff = await audioCtx.decodeAudioData(buff)
               const leftChannel = audioBuff.getChannelData(0)
               
               if(waveDrawer){
                    waveDrawer.initDPI()
                    waveDrawer.drawBuff(leftChannel,leftChannel.length)
               }
               audioCtx.close()
            } catch (error) {
                
            }
        }
    }
    fileReader.readAsArrayBuffer(file)
}

</script>
<style scoped>

.filematch{
    width: 100%;

    .wave{
        width: 100%;
        height: 5rem;
    }
}
</style>