<template>
    <img src="" alt="">
</template>
<script setup lang="ts">
import { ComputedRef, onMounted, onUnmounted, Ref, watch, WatchHandle } from 'vue';
const props = defineProps<{
    src:Ref<string> | ComputedRef<string>
}>()
let watchHandler:WatchHandle | null = null
onMounted(()=>{
    watchHandler = watch(props.src,(newSrc:string)=>{
        console.log(newSrc)
    },{
        immediate:true
    })   
})
onUnmounted(()=>{
    watchHandler?.stop()
})

</script>