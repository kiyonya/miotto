<template>
   <div class="hs" ref="container">
     <button class="l" style="left: calc(-1.2rem - var(--button-gap));" @click="scrollLeft"><Icon icon="fluent:chevron-left-12-filled" class="i"/></button>
    <div class="hgrid"
        :style="{ '--row': props.row || 'auto', '--col': props.col || 'auto', '--gap': (props.gap || 0.8) + 'rem' }"
        ref="content">
        <slot></slot>
    </div>
    <button class="r" style="right: calc(-1.2rem - var(--button-gap));" @click="scrollRight"><Icon icon="fluent:chevron-right-12-filled" class="i"/></button>
   </div>
</template>
<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { ref } from 'vue';
const props = defineProps<{
    row?: number | 'auto',
    col?: number | 'auto',
    gap?: number,
}>()
const container = ref<HTMLDivElement | null>(null)
    const content = ref<HTMLDivElement | null>(null)
function scrollLeft(){
    if(container.value && content.value){
        content.value.scrollBy({
            left: -container.value.clientWidth,
            behavior: 'smooth'
        })
    }
}
function scrollRight(){
    if(container.value && content.value){
        content.value.scrollBy({
            left: container.value.clientWidth,
            behavior: 'smooth'
        })
    }
}
</script>
<style scoped>
.hs{
    display: flex;
    width: 100%;
    height: fit-content;
    align-items: center;
    position: relative;
    gap: 0.2rem;
    
    --button-gap:0.5rem;

    button{
        width: fit-content;
        box-sizing: border-box;
        padding: 0 0.1rem;
        background: none;
        border: none;
        color: var(--text-4);
        position: absolute;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--br-1);
        font-size: 1.2rem;
        height: 4rem;
        opacity: 0;
        .i{
            transform: scaleY(2.5);
        }
        
    }

}

.hs:hover{
    button{
        opacity: 1;
    }
}

.hgrid {
    display: grid;
    grid-auto-columns: calc((100% - var(--gap, 0.8rem) * calc(var(--col, 4) - 1)) / var(--col, 4));
    grid-template-rows: repeat(var(--row), 1fr);
    grid-auto-flow: column;
    gap: var(--gap, 0.8rem);
    overflow-x: auto;
    scroll-snap-type: x mandatory;
}

.hgrid::-webkit-scrollbar {
    display: none;
}
</style>