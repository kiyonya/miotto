<template>
    <Teleport to="body">

        <transition name="maskc">
            <div class="mask" v-if="windowProps.mask"></div>
        </transition>
        
        <div class="window-area">
            <transition name="wintrans">
                <div class="window" :class="{ 'window-material': windowProps.material }"
                    :style="{ width: winWidth, height: winHeight }" ref="windowEl" v-show="windowShow">
                    <div class="window-frame">
                        <div class="title">
                            <Icon :icon="windowProps.windowIcon" v-if="windowProps.windowIcon"></Icon>
                            <span>{{ windowProps.title }}</span>
                        </div>
                        <div class="actions">
                            <button class="close" @click.stop="closeWindow">
                                <Icon icon="material-symbols:close" />
                            </button>
                        </div>
                    </div>
                    <div class="window-content">
                        <slot></slot>
                    </div>
                </div>
            </transition>
        </div>
    </Teleport>
</template>
<script setup lang="ts">
import { computed, ComputedRef, onBeforeUnmount, onMounted, onUnmounted, ref } from 'vue';
import { Icon } from '@iconify/vue';

const windowEl = ref<HTMLElement | null>(null);
const windowShow = ref(false);
const windowProps = defineProps<{

    width?: string | number,
    height?: string | number,
    title?: string,
    windowIcon?: string,
    canClose?: boolean,
    mask?: boolean,
    material?: boolean,
    canMinimize?: boolean,
    movable?: boolean,
    backdropBlur?: boolean,

}>()

const winWidth: ComputedRef<string> = computed(() => {
    if (windowProps.width) {
        return typeof windowProps.width === 'number' ? windowProps.width + 'px' : windowProps.width
    }
    return '28rem'
})

const winHeight: ComputedRef<string> = computed(() => {
    if (windowProps.height) {
        return typeof windowProps.height === 'number' ? windowProps.height + 'px' : windowProps.height
    }
    return '20rem'
})

let cleanup: (() => void) | null = null

onMounted(() => {
    windowShow.value = true
    if (windowProps.movable && windowEl.value) {
        const windowFrame = windowEl.value.querySelector('.window-frame') as HTMLElement
        windowFrame.style.cursor = 'move'

        const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max))

        windowFrame.onmousedown = (e: MouseEvent) => {
            const startX = e.clientX
            const startY = e.clientY
            const rect = windowEl.value!.getBoundingClientRect()
            const offsetX = startX - rect.left
            const offsetY = startY - rect.top

            const onMouseMove = (e: MouseEvent) => {
                const moveX = e.clientX
                const moveY = e.clientY
                const newLeft = clamp(moveX - offsetX, 0, window.innerWidth - rect.width)
                const newTop = clamp(moveY - offsetY, 0, window.innerHeight - rect.height)
                windowEl.value!.style.left = newLeft + 'px'
                windowEl.value!.style.top = newTop + 'px'
                windowEl.value!.style.position = 'absolute'
            }

            const onMouseUp = () => {
                cleanup?.()
                cleanup = null
            }

            cleanup = () => {
                document.removeEventListener('mousemove', onMouseMove)
                document.removeEventListener('mouseup', onMouseUp)
            }

            document.addEventListener('mousemove', onMouseMove)
            document.addEventListener('mouseup', onMouseUp)
        }
    }
})
onBeforeUnmount(() => {
    windowShow.value = false
})
onUnmounted(() => {

    cleanup?.()
    if (windowEl.value) {
        const windowFrame = windowEl.value.querySelector('.window-frame') as HTMLElement
        windowFrame.onmousedown = null
    }

})

const emits = defineEmits(['close'])

function closeWindow() {
    emits('close')
}
</script>
<style scoped>
.mask {
    width: 100vw;
    height: 100vh;
    position: absolute;
    left: 0;
    top: 0;
    backdrop-filter: brightness(0.75) blur(2px);
    z-index:20;
}

@keyframes mask-in {
    from {
        opacity: 0;
    }
}

.window-area {
    width: calc(100vw);
    height: 100vh;
    position: absolute;
    left: 0;
    top: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 21;
    pointer-events: none;

}

@keyframes winin {
    from {
        opacity: 0;
        transform: translateY(50px);
    }
}

.window {
    pointer-events: all;
    background: var(--window);
    box-shadow: var(--shadow-md);
    border: 1px solid var(--border);
    border-radius: var(--br-3);
    box-sizing: border-box;
    color: var(--text);
    display: flex;
    flex-direction: column;
    z-index: 23;
    overflow: hidden;
}

.window-material {
    background: var(--component-op) !important;
    backdrop-filter: blur(5px) brightness(0.8) !important;
}

.window-frame {
    display: flex;
    width: 100%;
    height: fit-content;
    padding-bottom: 0.2rem;
    box-sizing: border-box;
    -webkit-app-region: no-drag;
    background: var(--component);
    box-sizing: border-box;
    padding: 0.3rem;

    .title {
        font-size: 1.05rem;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 0.4rem;
        margin-left: 0.5rem;
    }

    .actions {
        margin-left: auto;
        margin-right: 0;
        display: flex;
        gap: 0.2rem;

        button {
            background: none;
            border: none;
            color: var(--text);
            font-size: 1.5rem;
            padding: 0.2rem;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            aspect-ratio: 1/1;
            border-radius: var(--br-1);
        }

        button:hover {
            background-color: var(--hover);
        }

    }
}

.window-content {
    width: 100%;
    flex: 1;
    overflow-y: auto;
    margin-top: 0.6rem;
    box-sizing: border-box;
    padding:1rem;
}

.wintrans-enter-active,
.wintrans-leave-active {
    transition: all 0.3s ease;
}

.wintrans-enter-from,
.wintrans-leave-to {
    opacity: 0;
    transform: scale(0.9);
}

.wintrans-enter-to,
.wintrans-leave-from {
    opacity: 1;
    transform: scale(1);
}
.maskc-enter-active,.mask-leave-active{
    transition: all .3s ease;
}
.maskc-enter-from,.mask-leave-to{
    opacity: 0;
}
.maskc-enter-to,.mask-leave-from{
    opacity: 1;
}

</style>