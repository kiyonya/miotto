<template>
    <div class="dynamic-backgroud">
        <img :src="$imgrsz(cover as string, 500)" alt="" class="base-img" v-if="cover">
        <div class="backdrop-basecolor" :style="{ background: `rgb(${backdropBaseColor})` }"></div>
        <canvas class="dynamic-background" ref="dynamicBackgroundCvs"></canvas>
        <div class="mask" :style="{ opacity: backgroundGrayLevel }"></div>

        <svg style="display: none">
            <defs>
                <filter id="mix-sharp">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="30" result="blur"></feGaussianBlur>
                    <feColorMatrix in="blur" mode="matrix" values="
            1.5 0   0   0   0
            0   1.5 0   0   0
            0   0   1.5 0   0
            0   0   0   25  -12"></feColorMatrix>
                </filter>
            </defs>
        </svg>

    </div>
</template>
<script setup lang="ts">
import { onMounted, onUnmounted, ref, toRef, watch } from 'vue';
import DynamicBackgroundWebGL from './dynamic_background';
const props = defineProps<{
    cover?: string,
    matchColor?: [r: number, g: number, b: number]
}>()
const backgroundGrayLevel = ref<number>(0.5)
const cover = toRef(props, 'cover')
const matchColor = toRef(props, 'matchColor')
const dynamicBackgroundCvs = ref<HTMLCanvasElement | null>(null)
let dynamicBackgroud: DynamicBackgroundWebGL | null = null
const backdropBaseColor = ref<[r: number, g: number, b: number]>([255, 255, 255])

onMounted(() => {
    if (dynamicBackgroundCvs.value) {
        dynamicBackgroud = new DynamicBackgroundWebGL(dynamicBackgroundCvs.value)
        dynamicBackgroud.start()
    }
    watch(matchColor, (color: [r: number, g: number, b: number] | undefined) => {
        if (!color) {
            backdropBaseColor.value = [255, 255, 255]
        }
        else {
            dynamicBackgroud?.setColors(color)
            backdropBaseColor.value = color
            const [r, g, b] = color
            let grayLevel = (0.3 * r + 0.59 * g + 0.11 * b) / 255
            backgroundGrayLevel.value = grayLevel
        }
    },{
        immediate:true
    })
})

onUnmounted(() => {
    dynamicBackgroud?.unmount()
    dynamicBackgroud = null
})
</script>
<style scoped>
.dynamic-backgroud {
    width: 100%;
    height: 100%;
    position: absolute;
    left: 0;
    bottom: 0;
    z-index: 1101;

    .base-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        filter: blur(50px);
    }

    .backdrop-basecolor {
        width: 100%;
        height: 100%;
        position: absolute;
        left: 0;
        top: 0;
        z-index: 1102;
        opacity: 0.2;
        filter: saturate(2);
    }

    .dynamic-background {
        position: absolute;
        left: 0;
        top: 0;

        filter: url(#mix-sharp) saturate(1) brightness(0.6) contrast(1.2) blur(60px);
        transform: scale(1.2);

        transition: .5s;
        opacity: 0;
    }

    .mask {
        width: 100%;
        height: 100%;
        position: absolute;
        left: 0;
        top: 0;
        background: rgba(0, 0, 0, 0.6);
    }
}
</style>