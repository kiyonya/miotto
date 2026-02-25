<template>
    <div class="audio-match">

        <AudioRcgRecord @start="handleAnyMatchMethodStart" @afp="handleMatchAudio" @switch-mode="handleAnySwitchMode" v-if="!fileMatchMode"></AudioRcgRecord>
        <AudioRcgFile v-else></AudioRcgFile>

        <div class="result" v-if="matchedResult.length">
            <div class="title">找到结果</div>
            <SongMiniCard  :song="song" v-for="song in matchedResult"></SongMiniCard>
        </div>

    </div>
</template>
<script setup lang="ts">
import { AppTypes } from 'src/types/app';
import AudioRcgRecord from './AudioRcgRecord.vue';
import { ref } from 'vue';
import SongMiniCard from '../SongMiniCard.vue';
import AudioRcgFile from './AudioRcgFile.vue';
const fileMatchMode= ref<boolean>(false)

const matchedResult = ref<AppTypes.ISong[]>([])
async function handleMatchAudio(audioFP:string,duration:number){
    matchedResult.value = await window.ncmapi.audioFingerprintMatch(audioFP,duration)
}
function handleAnyMatchMethodStart(){
    matchedResult.value = []
}
function handleAnySwitchMode(){
    fileMatchMode.value = !fileMatchMode.value
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

.result{
    display: flex;
    flex-direction: column;
    width: 100%;
    gap: 0.3rem;
}
</style>