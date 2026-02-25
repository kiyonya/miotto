<template>
    <div class="hscroll">
        <button @click="toLeft"><Icon icon="fluent:caret-left-16-filled" /></button>
        <div ref="slotWrapper" class="slot-wrapper">
            <slot></slot>
        </div>
        
        <button @click="toRight"><Icon icon="fluent:caret-right-16-filled" /></button>
    </div>
</template>
<script setup lang="ts">
import {  ref } from 'vue';
import { Icon } from '@iconify/vue';
const slotWrapper = ref<HTMLElement | null>(null)
function toRight(){
    if(slotWrapper.value){
        const w = slotWrapper.value.clientWidth
        const sl = slotWrapper.value.scrollLeft
        const wwl = Math.floor(sl / w)
        const sw = slotWrapper.value.scrollWidth
        if(sl < sw){
            slotWrapper.value.scrollTo({
                left:Math.min((1 + wwl) * w,sw),
                behavior:'smooth'
            })
        }
    }
}
function toLeft(){
    if(slotWrapper.value){
        const w = slotWrapper.value.clientWidth
        const sl = slotWrapper.value.scrollLeft
        const wwl = Math.floor(sl / w)
        if(sl > 0){
            slotWrapper.value.scrollTo({
                left:Math.max((wwl - 1) * w,0),
                behavior:'smooth'
            })
        }
    }
}

</script>
<style scoped>
.hscroll{
    
    display: flex;
align-items: center;
gap: 0.1rem;
    button{
        background: none;
        border: none;
        color: var(--text-1);
        height: fit-content;
        width: fit-content;
        box-sizing: border-box;
        padding: 0.2rem;
        display: flex;
        align-items: center;
        justify-content: center;
        transform: scaleY(1.5);
        border-radius: var(--br-1);
    }

    button:hover{
        background: var(--hover);
    }
}
.slot-wrapper{
    flex: 1;
    overflow-x: auto;
}
.slot-wrapper::-webkit-scrollbar{
    display: none;
}

</style>