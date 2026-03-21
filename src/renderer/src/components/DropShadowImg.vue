<template>
    <div class="drop-shadow-img">
        <img :src="props.src" alt="" class="layer-1" v-if="renderImage" :class="{round:props.round}">
        <img :src="props.src" alt="" class="layer-2" v-if="renderImage" :class="{round:props.round}">
    </div>
</template>
<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from 'vue';

const props = defineProps<{ src?: string,round?:boolean }>()
const renderImage = ref<boolean>(false)
let imgPreload = new Image()
onMounted(() => {
    imgPreload.src = props.src as string
    imgPreload.addEventListener('load', () => {
        renderImage.value = true
    }, { once: true })
})
onUnmounted(() => {
    imgPreload.remove()
})
</script>
<style scoped>
@keyframes fadein {
    from{
        opacity: 0;
    }
}
.drop-shadow-img {
    position: relative;
    width: 12rem;
    height: 12rem;
    aspect-ratio: 1/1;

    img{
        animation: fadein .3s ease-in-out;
    }

    .layer-1 {
        position: absolute;
        z-index: 6;
        width: 100%;
        height: 100%;
        object-fit: cover;
        left: 0;
        bottom: 0;
        border-radius: var(--br-2);
    }

    .layer-2 {
        position: absolute;
        z-index: 5;
        width: 85%;
        height: 100%;
        object-fit: cover;
        left: 2.5%;
        bottom: -0.2rem;
        filter: blur(30px);
        opacity: 0.3;
        border-radius: var(--br-2);
        transition: .2s;
    }
}

.drop-shadow-img:hover {
    .layer-2 {
        bottom: -0.6rem;
        opacity: 0.6;
    }
}

.round{
    border-radius: 50% !important;
}
</style>