<template>
    <div class="cover-background">
        <img :src="cover" alt="" class="cover" v-if="cover">
        <div class="lyric-mask"></div>
        <div class="cover-mask" :style="{background:`rgb(${maskColor})`}" ></div>
        <div class="vignette"></div>
    </div>

</template>
<script setup lang="ts">
import { clamp } from 'lodash';
import { computed, toRef } from 'vue';

const props = defineProps<{
    cover?: string,
    matchColor?: [r: number, g: number, b: number]
}>()
const cover = toRef(props, 'cover')
const matchColor = toRef(props, 'matchColor')
const maskColor = computed<[r: number, g: number, b: number]>(()=>{
    if(matchColor.value){
        return matchColor.value
    }
    else return [0,0,0]
})
</script>
<style scoped>
.cover-background{
    width: 100%;
    height: 100%;
    position: absolute;
    left: 0;
    bottom: 0;
    z-index: 1101;

    .cover{
        width: 100%;
        height: 100%;
        object-fit: cover;
        transform: scale(1.4);
        z-index: 1102;
        filter: blur(0px) brightness(0.5);

    }

    .cover-mask{
        width: 100%;
        height: 100%;
        z-index: 1103;
        position: absolute;
        left: 0;
        top: 0;
        filter: brightness(0.7) saturate(1.3);
        
        opacity: 0.8;
        mask: linear-gradient(to left, rgba(0,0,0,1), rgba(0,0,0,0.8) 30%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.2) 100%);
    }
    .lyric-mask{
        width: 70%;
        position: absolute;
        height: 100%;
        right: 0;
        top: 0;
        backdrop-filter:  blur(8px);
        mask: linear-gradient(to left, rgba(0,0,0,1), rgba(0,0,0,0.8) 30%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.2) 100%);
    }
    .vignette{
        width: 100%;
        height: 100%;
        z-index: 1104;
        position: absolute;
        left: 0;
        top: 0;
        background: radial-gradient(ellipse at center, rgba(0,0,0,0) 0%, rgba(0,0,0,0.5) 80%, rgba(0,0,0,0.8) 100%);
        opacity: 0.7;
        backdrop-filter: blur(5px);
    }
}

</style>