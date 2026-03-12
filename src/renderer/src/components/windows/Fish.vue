<template>
    <div class="fish">
        <div class="global-mask"></div>
        <canvas ref="gameCvs" :height="400"></canvas>
        <span>按下C键以钓鱼</span>
    </div>
</template>
<script setup lang="ts">
import FishGame from '@renderer/script/fish';
import { onMounted, onUnmounted, ref } from 'vue';

let game: FishGame | null = null
let gameCvs = ref<HTMLCanvasElement | null>(null)

const emits = defineEmits<{
    result: [isSuccess: boolean]
}>()

onMounted(() => {
    if (gameCvs.value) {
        game = new FishGame(gameCvs.value)
        game.start().then(() => {
            emits('result', true)
        }).catch(() => {
            emits('result', false)
        })
    }
})

onUnmounted(() => {
    game?.close()
})

</script>
<style scoped>
.fish {
    position: fixed;
    left: 0rem;
    top: 0rem;
    width: 100%;
    height: 100%;
    backdrop-filter: brightness(0.75) blur(3px);
    z-index: 9999999;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: var(--text-1);
    gap: 1rem;
    font-weight: 500;
}
</style>